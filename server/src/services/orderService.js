const crypto = require('crypto')

class OrderError extends Error {
  constructor(code, status, message, details = null) {
    super(message)
    this.name = 'OrderError'
    this.code = code
    this.status = status
    this.details = details
  }
}

const hashInput = (input) =>
  crypto
    .createHash('sha256')
    .update(JSON.stringify({ c: input.customer, n: input.note, i: input.items }))
    .digest('hex')

// نفس منطق lib/pricing.js في الفرونت: سعر الاختيار المحدد، وإلا سعر المنتج الأساسي
function resolvePricing(product, variant) {
  const price = variant?.price ?? product.price
  const salePrice = variant?.salePrice ?? (variant?.price != null ? null : product.salePrice ?? null)
  return { price, salePrice }
}

// ⚡ Dependency injection: عشان نختبر المنطق من غير MongoDB ولا WooCommerce فعليين.
function createOrderService({ Order, Product, woo, config = {}, logger = console, now = Date.now }) {
  // ⚡ لو السيرفر وقع/اتعمله restart في نص طلب، السجل كان بيفضل "creating" للأبد وكل إعادة محاولة
  // بترجع "Your order is already being processed" إلى ما لا نهاية. دلوقتي السجل القديم بيتعالج:
  //   creating قديم = ما اتبعتش حاجة لـ WooCommerce ← آمن نكمّل
  //   sending قديم  = ممكن الأوردر اتعمل ← نقفله كـ unknown (ما نكررش)
  const creatingStaleMs = Number(config.creatingStaleMs ?? 60_000)
  const sendingStaleMs = Number(config.sendingStaleMs ?? 120_000)
  const ageMs = (doc) => now() - new Date(doc.updatedAt).getTime()
  const shippingFee = Number(config.shippingFee ?? 60)
  const orderStatus = config.orderStatus ?? 'processing'

  // ---- 1) بنحجز الـ idempotencyKey قبل أي حاجة تانية ----
  async function claim(input, payloadHash) {
    try {
      return await Order.create({ idempotencyKey: input.idempotencyKey, payloadHash, status: 'creating' })
    } catch (err) {
      if (err?.code !== 11000) throw err
    }

    const existing = await Order.findOne({ idempotencyKey: input.idempotencyKey })
    if (!existing) return claim(input, payloadHash) // اتمسح بين الاستعلامين (نادر)

    if (existing.payloadHash !== payloadHash) {
      throw new OrderError('KEY_REUSED', 409, 'Your cart changed. Please review it and try again.')
    }
    if (existing.status === 'created') return { replay: existing }
    if (existing.status === 'creating') {
      if (ageMs(existing) <= creatingStaleMs) {
        throw new OrderError('IN_PROGRESS', 409, 'Your order is already being processed. Please wait a moment.')
      }
      const reclaimed = await Order.findOneAndUpdate(
        { _id: existing._id, status: 'creating', updatedAt: { $lt: new Date(now() - creatingStaleMs) } },
        { failureReason: null },
        { new: true }
      )
      if (!reclaimed) throw new OrderError('IN_PROGRESS', 409, 'Your order is already being processed. Please wait a moment.')
      logger.warn(`[orders] reclaimed stale claim ${String(input.idempotencyKey).slice(0, 8)}`)
      return reclaimed
    }
    if (existing.status === 'sending') {
      if (ageMs(existing) <= sendingStaleMs) {
        throw new OrderError('IN_PROGRESS', 409, 'Your order is already being processed. Please wait a moment.')
      }
      await Order.updateOne(
        { _id: existing._id, status: 'sending' },
        { status: 'unknown', failureReason: 'server stopped while sending to WooCommerce' }
      )
      throw new OrderError(
        'ORDER_UNCERTAIN',
        409,
        "We couldn't confirm your previous attempt. Please contact us before ordering again."
      )
    }
    if (existing.status === 'unknown') {
      throw new OrderError(
        'ORDER_UNCERTAIN',
        409,
        "We couldn't confirm your previous attempt. Please contact us before ordering again."
      )
    }
    // failed → نعيد المحاولة (claim ذري عشان طلبين متوازيين مايعدّوش الاتنين)
    const claimed = await Order.findOneAndUpdate(
      { _id: existing._id, status: 'failed' },
      { status: 'creating', failureReason: null },
      { new: true }
    )
    if (!claimed) throw new OrderError('IN_PROGRESS', 409, 'Your order is already being processed. Please wait a moment.')
    return claimed
  }

  // ---- 2) الأسعار والتوفر من الداتابيز (مش من العميل) ----
  async function resolveLines(items) {
    const ids = [...new Set(items.map((i) => i.id))]
    const products = await Product.find({ _id: { $in: ids } })
      .select('name wooId price salePrice stock variants')
      .lean()
    const byId = new Map(products.map((p) => [String(p._id), p]))

    const lines = []
    const unavailable = []
    let outdated = false

    for (const item of items) {
      const p = byId.get(item.id)
      const bad = (reason) => unavailable.push({ id: item.id, name: p?.name ?? null, colorName: item.colorName, reason })

      if (!p || !p.wooId) {
        bad('not_found') // منتج ديمو/محذوف
        continue
      }

      let unitPrice
      let wooVariationId = null

      if (p.variants?.length) {
        if (!item.colorName) {
          bad('variant_required')
          continue
        }
        const v = p.variants.find((x) => x.colorName === item.colorName)
        if (!v) {
          bad('variant_not_found')
          continue
        }
        if (!v.available || v.stock === 0) {
          bad('out_of_stock')
          continue
        }
        if (!v.wooVariationId) {
          outdated = true // المنتج اتزامن قبل ما نبدأ نحفظ variationId → محتاج sync
          continue
        }
        // ⚡ الشيد لازم يكون له سعر في WooCommerce. من غير الشرط ده resolvePricing كان هيرجع لسعر المنتج
        // الأساسي، لكن WooCommerce هيحسب الأوردر بصفر (الشيد من غير سعر عنده).
        if (!(v.price > 0)) {
          bad('no_price')
          continue
        }
        wooVariationId = v.wooVariationId
        const { price, salePrice } = resolvePricing(p, v)
        unitPrice = salePrice ?? price
      } else {
        if (item.colorName) {
          bad('variant_not_found')
          continue
        }
        if (p.stock === 0) {
          bad('out_of_stock')
          continue
        }
        unitPrice = p.salePrice ?? p.price
        if (!(unitPrice > 0)) {
          bad('no_price') // منتج سعره 0 في WooCommerce: ما نبيعوش بصفر جنيه
          continue
        }
      }

      lines.push({
        productId: item.id,
        wooId: p.wooId,
        wooVariationId,
        name: p.name,
        colorName: item.colorName,
        qty: item.qty,
        unitPrice,
      })
    }

    if (unavailable.length > 0) {
      throw new OrderError('UNAVAILABLE', 409, 'Some items in your cart are no longer available.', unavailable)
    }
    if (outdated) {
      throw new OrderError('CATALOG_OUTDATED', 503, 'We are updating our catalog. Please try again in a few minutes.')
    }
    return lines
  }

  function buildWooPayload(input, lines) {
    const [firstName, ...rest] = input.customer.name.split(' ')
    const person = {
      first_name: firstName,
      last_name: rest.join(' '),
      address_1: input.customer.address,
      city: input.customer.city,
      country: 'EG',
    }
    return {
      status: orderStatus,
      payment_method: 'cod',
      payment_method_title: 'Cash on Delivery',
      set_paid: false,
      customer_note: input.note || '',
      billing: { ...person, phone: input.customer.phone },
      shipping: person,
      // ⚡ مفيش أسعار هنا عمدًا: WooCommerce بيحسب من أسعاره هو (مصدر الحقيقة)
      line_items: lines.map((l) => ({
        product_id: l.wooId,
        ...(l.wooVariationId ? { variation_id: l.wooVariationId } : {}),
        quantity: l.qty,
      })),
      shipping_lines: [{ method_id: 'flat_rate', method_title: 'Shipping', total: shippingFee.toFixed(2) }],
      meta_data: [
        { key: '_storefront', value: 'headless' },
        { key: '_idempotency_key', value: input.idempotencyKey },
      ],
    }
  }

  async function createOrder(input) {
    const payloadHash = hashInput(input)
    const claimed = await claim(input, payloadHash)

    if (claimed.replay) {
      return { orderNumber: claimed.replay.orderNumber, total: claimed.replay.total, replayed: true }
    }
    const record = claimed

    // مفيش حاجة اتبعتت لـ WooCommerce لحد هنا، فلو فشل نمسح الحجز ونطلّع الخطأ
    let lines
    try {
      lines = await resolveLines(input.items)
    } catch (err) {
      await Order.deleteOne({ _id: record._id }).catch(() => {})
      throw err
    }

    // من هنا بنكلّم WooCommerce: لو العملية وقفت بعد النقطة دي الأوردر ممكن يكون اتعمل
    await Order.updateOne({ _id: record._id }, { status: 'sending' })
    const tag = String(input.idempotencyKey).slice(0, 8)
    const startedAt = now()

    let wooOrder
    try {
      wooOrder = await woo.createOrder(buildWooPayload(input, lines))
    } catch (err) {
      const definitelyRejected = err?.kind === 'http' && err.status >= 400 && err.status < 500
      logger.error(`[orders] WooCommerce error (${err?.kind}${err?.status ? ' ' + err.status : ''}):`, err?.message)
      if (err?.status === 401 || err?.status === 403) {
        logger.error('[orders] ⚠️ مفتاح WooCommerce ملوش صلاحية Write — راجع WooCommerce → Settings → Advanced → REST API')
      }

      if (definitelyRejected) {
        await Order.updateOne({ _id: record._id }, { status: 'failed', failureReason: String(err.message).slice(0, 300) }).catch(() => {})
        throw new OrderError('ORDER_REJECTED', 502, "We couldn't place your order right now. Please try again in a few minutes.")
      }
      // timeout/شبكة/5xx: الأوردر ممكن يكون اتعمل → نقفل إعادة المحاولة التلقائية
      await Order.updateOne({ _id: record._id }, { status: 'unknown', failureReason: String(err?.message).slice(0, 300) }).catch(() => {})
      throw new OrderError(
        'ORDER_UNCERTAIN',
        502,
        "We couldn't confirm your order. Please contact us before ordering again, so you don't get charged twice."
      )
    }

    // حارس: لو الرد ما فيهوش رقم أوردر (غلاف غريب)، الأوردر ممكن يكون اتعمل ← ما نكرّرش
    if (!wooOrder || (wooOrder.id == null && wooOrder.number == null)) {
      logger.error('[orders] WooCommerce رد من غير رقم أوردر:', JSON.stringify(wooOrder)?.slice(0, 200))
      await Order.updateOne({ _id: record._id }, { status: 'unknown', failureReason: 'woo response without order id' }).catch(() => {})
      throw new OrderError(
        'ORDER_UNCERTAIN',
        502,
        "We couldn't confirm your order. Please contact us before ordering again, so you don't get charged twice."
      )
    }

    const orderNumber = String(wooOrder.number ?? wooOrder.id)
    const total = Number(wooOrder.total)
    logger.log(`[orders] ${tag} created in WooCommerce as #${orderNumber} (${now() - startedAt}ms)`)

    // الأوردر اتعمل فعلاً. أي فشل في التسجيل الداخلي مايخليش العميل يشوف خطأ.
    try {
      await Order.updateOne(
        { _id: record._id },
        { status: 'created', wooOrderId: wooOrder.id, orderNumber, total, items: lines }
      )
    } catch (err) {
      logger.error(`[orders] order ${orderNumber} created in Woo but local record update failed:`, err.message)
    }

    // فرق بين اللي توقعناه (من نسخة الداتابيز) واللي WooCommerce حسبه = المخزون/السعر متأخر عن الـ sync
    const expected = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0) + shippingFee
    if (Number.isFinite(total) && Math.abs(total - expected) > 0.01) {
      logger.warn(`[orders] total mismatch on #${orderNumber}: woo=${total} expected=${expected} (catalog may be stale)`)
    }

    return { orderNumber, total, replayed: false }
  }

  // حالة أوردر بالـ idempotencyKey (بيستخدمها الفرونت لو الرد ضاع: بدل ما يقول "مشكلة نت"
  // بيسأل السيرفر هل الأوردر اتعمل). المفتاح عشوائي طويل، والرد مفيهوش بيانات شخصية.
  async function getStatus(key) {
    const o = await Order.findOne({ idempotencyKey: key })
    if (!o) return { status: 'not_found' } // الطلب ما وصلش السيرفر أصلاً: آمن نعيد المحاولة
    if (o.status === 'created') return { status: 'created', orderNumber: o.orderNumber, total: o.total }
    if (o.status === 'creating') return { status: ageMs(o) > creatingStaleMs ? 'failed' : 'processing' }
    if (o.status === 'sending') return { status: ageMs(o) > sendingStaleMs ? 'unknown' : 'processing' }
    return { status: o.status } // failed | unknown
  }

  return { createOrder, getStatus }
}

module.exports = { createOrderService, OrderError, hashInput }
