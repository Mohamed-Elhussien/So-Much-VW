// تشغيل: node --test test/orders.test.js   (من مجلد server، من غير أي مكتبات إضافية)
const test = require('node:test')
const assert = require('node:assert/strict')
const { createOrderService, OrderError } = require('../src/services/orderService')
const { validateOrderInput, normalizePhone } = require('../src/validators/orderInput')

const P1 = 'a'.repeat(24) // منتج variable
const P2 = 'b'.repeat(24) // منتج بسيط
const P3 = 'c'.repeat(24) // ديمو (من غير wooId)
const P4 = 'd'.repeat(24) // منتج سعره 0 في WooCommerce
const KEY = 'key-1234567890abcdef'
const silent = { error() {}, warn() {}, log() {} }

const clock = { t: 1_000_000 } // ساعة وهمية نتحكم فيها في الاختبارات

function fakeOrderModel() {
  const docs = []
  const wrap = (d) => ({ ...d })
  return {
    docs,
    create(data) {
      if (docs.find((d) => d.idempotencyKey === data.idempotencyKey)) {
        const e = new Error('dup'); e.code = 11000; return Promise.reject(e)
      }
      const d = { _id: String(docs.length + 1), ...data, updatedAt: clock.t }
      docs.push(d)
      return Promise.resolve(wrap(d))
    },
    findOne: async (q) => { const d = docs.find((x) => x.idempotencyKey === q.idempotencyKey); return d ? wrap(d) : null },
    async findOneAndUpdate(q, u) {
      const d = docs.find(
        (x) => x._id === q._id && x.status === q.status && (!q.updatedAt || x.updatedAt < q.updatedAt.$lt.getTime())
      )
      if (!d) return null
      Object.assign(d, u, { updatedAt: clock.t }); return wrap(d)
    },
    async updateOne(q, u) {
      const d = docs.find((x) => x._id === q._id && (!q.status || x.status === q.status))
      if (d) Object.assign(d, u, { updatedAt: clock.t })
    },
    async deleteOne(q) { const i = docs.findIndex((x) => x._id === q._id); if (i >= 0) docs.splice(i, 1) },
  }
}

function fakeProductModel(products) {
  return { find: () => ({ select: () => ({ lean: async () => products }) }) }
}

const catalog = () => [
  {
    _id: P1, name: 'Lip Gloss', wooId: 100, price: 100, salePrice: null, stock: 5,
    variants: [
      { colorName: 'Pink', available: true, price: 150, salePrice: null, stock: 3, wooVariationId: 1001 },
      { colorName: 'Red', available: false, price: 150, salePrice: null, stock: 0, wooVariationId: 1002 },
      { colorName: 'Nude', available: true, price: null, salePrice: null, stock: 2, wooVariationId: null },
      { colorName: 'Free', available: true, price: null, salePrice: null, stock: 2, wooVariationId: 1005 },
    ],
  },
  { _id: P2, name: 'Cream', wooId: 200, price: 200, salePrice: 180, stock: 4, variants: [] },
  { _id: P3, name: 'Demo', price: 50, stock: 9, variants: [] },
  { _id: P4, name: 'Zero', wooId: 400, price: 0, salePrice: null, stock: 3, variants: [] },
]

function setup(wooImpl) {
  clock.t = 1_000_000
  const Order = fakeOrderModel()
  const calls = []
  const woo = { createOrder: async (body) => { calls.push(body); return wooImpl ? wooImpl(body, calls.length) : { id: 555, number: '555', total: '510.00' } } }
  const svc = createOrderService({ Order, Product: fakeProductModel(catalog()), woo, config: { shippingFee: 60 }, logger: silent, now: () => clock.t })
  return { svc, Order, calls }
}

const input = (items, extra = {}) => ({
  idempotencyKey: KEY,
  customer: { name: 'Sara Ahmed', phone: '01012345678', city: 'Giza', address: '12 Pyramids St' },
  note: '',
  items,
  ...extra,
})

test('أوردر ناجح: شيد بسعره + منتج عليه خصم، ومفيش أسعار في line_items', async () => {
  const { svc, Order, calls } = setup()
  const r = await svc.createOrder(input([{ id: P1, colorName: 'Pink', qty: 2 }, { id: P2, colorName: null, qty: 1 }]))
  assert.equal(r.orderNumber, '555')
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].line_items, [
    { product_id: 100, variation_id: 1001, quantity: 2 },
    { product_id: 200, quantity: 1 },
  ])
  assert.ok(!JSON.stringify(calls[0].line_items).includes('price'))
  assert.equal(calls[0].payment_method, 'cod')
  assert.equal(calls[0].shipping_lines[0].total, '60.00')
  assert.equal(calls[0].billing.first_name, 'Sara')
  assert.equal(calls[0].billing.last_name, 'Ahmed')
  assert.equal(Order.docs[0].status, 'created')
  // السعر المسجّل = سعر الشيد (150) والخصم (180) من الداتابيز
  assert.deepEqual(Order.docs[0].items.map((i) => i.unitPrice), [150, 180])
})

test('نفس الـ key ونفس البيانات: مفيش أوردر تاني (replay)', async () => {
  const { svc, calls } = setup()
  const items = [{ id: P2, colorName: null, qty: 1 }]
  await svc.createOrder(input(items))
  const again = await svc.createOrder(input(items))
  assert.equal(again.replayed, true)
  assert.equal(again.orderNumber, '555')
  assert.equal(calls.length, 1)
})

test('ضغطتين متوازيتين: أوردر واحد بس والتاني IN_PROGRESS', async () => {
  let release
  const gate = new Promise((r) => (release = r))
  const { svc, calls } = setup(async () => { await gate; return { id: 7, number: '7', total: '240.00' } })
  const items = [{ id: P2, colorName: null, qty: 1 }]
  const first = svc.createOrder(input(items))
  await new Promise((r) => setImmediate(r))
  await assert.rejects(svc.createOrder(input(items)), (e) => e instanceof OrderError && e.code === 'IN_PROGRESS')
  release()
  await first
  assert.equal(calls.length, 1)
})

test('نفس الـ key بسلة مختلفة: KEY_REUSED', async () => {
  const { svc } = setup()
  await svc.createOrder(input([{ id: P2, colorName: null, qty: 1 }]))
  await assert.rejects(
    svc.createOrder(input([{ id: P2, colorName: null, qty: 3 }])),
    (e) => e.code === 'KEY_REUSED' && e.status === 409
  )
})

test('شيد غير متاح + منتج ديمو: UNAVAILABLE بالتفاصيل، ومفيش اتصال بـ Woo، والحجز بيتمسح', async () => {
  const { svc, Order, calls } = setup()
  await assert.rejects(
    svc.createOrder(input([{ id: P1, colorName: 'Red', qty: 1 }, { id: P3, colorName: null, qty: 1 }])),
    (e) => e.code === 'UNAVAILABLE' && e.status === 409 && e.details.length === 2 &&
      e.details[0].reason === 'out_of_stock' && e.details[1].reason === 'not_found'
  )
  assert.equal(calls.length, 0)
  assert.equal(Order.docs.length, 0)
})

test('شيد من غير wooVariationId (لسه ما اتعملش sync): CATALOG_OUTDATED 503', async () => {
  const { svc, calls } = setup()
  await assert.rejects(svc.createOrder(input([{ id: P1, colorName: 'Nude', qty: 1 }])), (e) => e.code === 'CATALOG_OUTDATED' && e.status === 503)
  assert.equal(calls.length, 0)
})

test('منتج أو شيد من غير سعر: no_price (ما نبيعش بصفر جنيه)، ومفيش اتصال بـ Woo', async () => {
  const { svc, calls } = setup()
  await assert.rejects(
    svc.createOrder(input([{ id: P4, colorName: null, qty: 1 }, { id: P1, colorName: 'Free', qty: 1 }])),
    (e) => e.code === 'UNAVAILABLE' && e.details.length === 2 && e.details.every((d) => d.reason === 'no_price')
  )
  assert.equal(calls.length, 0)
})

test('منتج بشيدز بس العميل ما بعتش شيد: variant_required', async () => {
  const { svc } = setup()
  await assert.rejects(svc.createOrder(input([{ id: P1, colorName: null, qty: 1 }])), (e) => e.details[0].reason === 'variant_required')
})

test('Woo رفض (4xx): failed، وإعادة المحاولة بنفس الـ key مسموحة', async () => {
  let n = 0
  const { svc, Order, calls } = setup(async () => {
    if (++n === 1) { const e = new Error('forbidden'); e.kind = 'http'; e.status = 401; throw e }
    return { id: 9, number: '9', total: '240.00' }
  })
  const items = [{ id: P2, colorName: null, qty: 1 }]
  await assert.rejects(svc.createOrder(input(items)), (e) => e.code === 'ORDER_REJECTED' && e.status === 502)
  assert.equal(Order.docs[0].status, 'failed')
  const ok = await svc.createOrder(input(items))
  assert.equal(ok.orderNumber, '9')
  assert.equal(calls.length, 2)
})

test('Woo رد 201 بس من غير رقم أوردر / بـ invalid_response: unknown ومفيش تكرار (مش TypeError)', async () => {
  for (const impl of [async () => ({}), async () => null, async () => { const e = new Error('bad body'); e.kind = 'invalid_response'; e.status = 201; throw e }]) {
    const { svc, Order, calls } = setup(impl)
    await assert.rejects(svc.createOrder(input([{ id: P2, colorName: null, qty: 1 }])), (e) => e.code === 'ORDER_UNCERTAIN')
    assert.equal(Order.docs[0].status, 'unknown')
    assert.equal(calls.length, 1)
  }
})

test('Woo timeout: unknown، وإعادة المحاولة ممنوعة (عشان مايتكررش الأوردر)', async () => {
  const { svc, Order, calls } = setup(async () => { const e = new Error('timed out'); e.kind = 'timeout'; throw e })
  const items = [{ id: P2, colorName: null, qty: 1 }]
  await assert.rejects(svc.createOrder(input(items)), (e) => e.code === 'ORDER_UNCERTAIN')
  assert.equal(Order.docs[0].status, 'unknown')
  await assert.rejects(svc.createOrder(input(items)), (e) => e.code === 'ORDER_UNCERTAIN' && e.status === 409)
  assert.equal(calls.length, 1)
})

test('سجل "creating" قديم (السيرفر وقع قبل ما يكلّم Woo): بيتعالج ويكمّل بدل ما يفضل IN_PROGRESS للأبد', async () => {
  const { svc, Order, calls } = setup()
  const items = [{ id: P2, colorName: null, qty: 1 }]
  // نحاكي سيرفر وقع بعد الحجز: سجل creating ما اتكمّلش
  Order.docs.push({ _id: 'x', idempotencyKey: KEY, payloadHash: require('../src/services/orderService').hashInput(input(items)), status: 'creating', updatedAt: clock.t })

  // لسه جديد (أقل من دقيقة): IN_PROGRESS عادي
  clock.t += 30_000
  await assert.rejects(svc.createOrder(input(items)), (e) => e.code === 'IN_PROGRESS')
  assert.equal(calls.length, 0)

  // بقى قديم (أكتر من دقيقة): بيكمّل وينشئ الأوردر
  clock.t += 40_000
  const r = await svc.createOrder(input(items))
  assert.equal(r.orderNumber, '555')
  assert.equal(calls.length, 1)
  assert.equal(Order.docs[0].status, 'created')
})

test('سجل "sending" قديم (السيرفر وقع وهو بيكلّم Woo): unknown ومينفعش نكرر الأوردر', async () => {
  const { svc, Order, calls } = setup()
  const items = [{ id: P2, colorName: null, qty: 1 }]
  Order.docs.push({ _id: 'x', idempotencyKey: KEY, payloadHash: require('../src/services/orderService').hashInput(input(items)), status: 'sending', updatedAt: clock.t })

  clock.t += 60_000 // لسه تحت دقيقتين
  await assert.rejects(svc.createOrder(input(items)), (e) => e.code === 'IN_PROGRESS')

  clock.t += 120_000
  await assert.rejects(svc.createOrder(input(items)), (e) => e.code === 'ORDER_UNCERTAIN' && e.status === 409)
  assert.equal(Order.docs[0].status, 'unknown')
  assert.equal(calls.length, 0)
})

test('الحالة بتعدّي على sending قبل ما نكلّم Woo (عشان لو السيرفر وقع نعرف)', async () => {
  let statusSeenByWoo
  const { svc, Order } = setup(async () => { statusSeenByWoo = Order.docs[0].status; return { id: 3, number: '3', total: '240.00' } })
  await svc.createOrder(input([{ id: P2, colorName: null, qty: 1 }]))
  assert.equal(statusSeenByWoo, 'sending')
})

test('getStatus: not_found / processing / created / failed / unknown', async () => {
  const { svc, Order } = setup()
  assert.deepEqual(await svc.getStatus(KEY), { status: 'not_found' })

  await svc.createOrder(input([{ id: P2, colorName: null, qty: 1 }]))
  assert.deepEqual(await svc.getStatus(KEY), { status: 'created', orderNumber: '555', total: 510 })

  const d = Order.docs[0]
  d.status = 'sending'; d.updatedAt = clock.t
  assert.deepEqual(await svc.getStatus(KEY), { status: 'processing' })
  clock.t += 200_000
  assert.deepEqual(await svc.getStatus(KEY), { status: 'unknown' }) // sending قديم
  d.status = 'creating'
  assert.deepEqual(await svc.getStatus(KEY), { status: 'failed' }) // creating قديم: آمن نعيد
  d.status = 'failed'
  assert.deepEqual(await svc.getStatus(KEY), { status: 'failed' })
})

// ---------------- validator ----------------
test('الموبايل: كل الصيغ الصحيحة بتتوحّد، والغلط بيترفض', () => {
  for (const p of ['01012345678', '+201012345678', '201012345678', '1012345678', '010 1234 5678', '010-1234-5678'])
    assert.equal(normalizePhone(p), '01012345678', p)
  for (const p of ['0101234567', '01312345678', 'abc', '', null])
    assert.equal(normalizePhone(p), null, String(p))
})

test('validator: بيدمج الأسطر المكررة وبيرفض المدخلات الغلط', () => {
  const ok = validateOrderInput({
    idempotencyKey: KEY,
    customer: { name: '  Sara   Ahmed ', phone: '01012345678', city: 'Giza', address: '12 Pyramids St' },
    items: [{ id: P1, colorName: 'Pink', qty: 1 }, { id: P1, colorName: 'Pink', qty: 2 }, { id: P2, qty: 1 }],
  })
  assert.equal(ok.ok, true)
  assert.equal(ok.data.customer.name, 'Sara Ahmed')
  assert.equal(ok.data.items.length, 2)
  assert.equal(ok.data.items.find((i) => i.id === P1).qty, 3)

  const bad = validateOrderInput({ idempotencyKey: 'x', customer: { name: '', phone: '1', city: '', address: '' }, items: [{ id: 'nope', qty: 0 }] })
  assert.equal(bad.ok, false)
  for (const k of ['name', 'phone', 'city', 'address', 'idempotencyKey', 'items']) assert.ok(bad.errors[k], k)

  assert.equal(validateOrderInput(null).ok, false)
  assert.equal(validateOrderInput({ idempotencyKey: KEY, customer: {}, items: [] }).errors.items, 'Your cart is empty.')
})
