// ⚡ سكريبت المزامنة الحقيقي: بيجيب كل المنتجات من WooCommerce، ويعمل
// upsert (تحديث لو موجود بـ wooId، إنشاء لو جديد) في MongoDB.
//
// طريقة التشغيل: node src/scripts/sync-woocommerce-products.js
//
// ⚡ آمن يتكرر (idempotent) — تشغيله عشر مرات بنفس الداتا بيدّي نفس
// النتيجة، مش بيكرر المنتجات ولا يزوّد نسخ. ده أساسي لأنه هيتشغل
// دوريًا (cron) لاحقًا، مش مرة واحدة بس.

require('dotenv').config()

const connectDB = require('../db')
const Product = require('../models/Product')
const fs = require('fs')
const path = require('path')
const { categorizeProduct } = require('../lib/wooCategoryMap')
const { distinctTones } = require('../lib/shadeTones')
const sanitizeHtml = require('sanitize-html')
const he = require('he')

// ⚡ وصف المنتج في WooCommerce HTML (عناوين/قوايم/جداول). بنخزّنه منضّف بقايمة
// تاجات محدودة (مفيش script/style/iframe/img/event handlers) فآمن للعرض في الفرونت.
const HTML_OPTIONS = {
  allowedTags: ['h2', 'h3', 'h4', 'p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'a', 'span', 'div'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
  },
}
const cleanHtml = (html = '') => sanitizeHtml(html || '', HTML_OPTIONS).trim()

// نص عادي: التاجات بتتحول لمسافات (مش بتتمسح) عشان الكلمات ما تلزقش في بعض،
// والـ entities (&amp; ...) بتتفكّك.
const toPlainText = (html = '') =>
  he.decode(sanitizeHtml(html || '', { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ')).trim()

const WC_URL = process.env.WC_URL
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET
const AUTH_HEADER = `Basic ${Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64')}`

async function wooFetch(path, { timeoutMs = 20000 } = {}) {
  const url = `${WC_URL.replace(/\/$/, '')}${path}`

  // ⚡ من غير timeout، لو السيرفر بتاعهم بطّأ أو الطلب ضاع في الشبكة،
  // fetch ممكن يستنى للأبد من غير أي إيرور ولا تقدّم — السكريبت هيفضل
  // "شغال" في الشكل بس عمليًا واقف. الـ AbortController بيضمن إننا
  // نطلع بإيرور واضح بدل ما نستنى للأبد.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers: { Authorization: AUTH_HEADER },
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`WooCommerce API error ${response.status} على ${path}: ${await response.text()}`)
    }
    return await response.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`الطلب استنى أكتر من ${timeoutMs / 1000} ثانية من غير رد على ${path} — الأرجح مشكلة شبكة/سيرفر`)
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

// ⚡ WooCommerce بيرجع المنتجات صفحة صفحة (100 كحد أقصى للصفحة).
// بنجيب صفحة صفحة لحد ما تيجي صفحة أصغر من الحد الأقصى — معناها دي آخر صفحة.
async function fetchAllProducts() {
  const perPage = 100
  let page = 1
  let all = []

  while (true) {
    const batch = await wooFetch(`/wp-json/wc/v3/products?per_page=${perPage}&page=${page}`)
    all = all.concat(batch)
    if (batch.length < perPage) break
    page += 1
  }

  return all
}

// ⚡ للمنتجات type=variable: السعر والمخزون الحقيقيين موجودين في
// الـ variations، مش في المنتج الأساسي. بناخد أرخص variation
// متوفرة (in stock) كممثل للمنتج في العرض/الفلترة — مش دعم كامل
// ⚡ ألوان الـ swatches بتتحط بعد ما نجمع كل شيدات المنتج (distinctTones في lib/shadeTones.js):
// كل شيد في المنتج لون مختلف ومتباعد بصريًا. (القديم: 6 ألوان باستيل بالـ hash = تكرار حتمي.)
// ⚡ بيجيب كل اختيارات المنتج (مش أرخص واحد بس زي قبل) — كل اختيار
// بسعره ومخزونه وصورته الخاصة، عشان نقدر نبني variants array كامل
// يعرض كل اختيار بسعره الصح في الواجهة.
async function getAllVariations(productId) {
  return wooFetch(`/wp-json/wc/v3/products/${productId}/variations?per_page=100`)
}

function mapVariationToVariant(variation, index, fallbackImage) {
  const label = variation.attributes?.[0]?.option || `Option ${index + 1}`
  // ⚡ الأسعار: sale_price لوحده مش كفاية. WooCommerce بيحتفظ بيه حتى لو العرض لسه ما بدأش
  // أو خلص (on_sale=false)، فكنا ممكن نعرض خصم مش فعّال. بنعتمد على on_sale، وبنتأكد
  // إن سعر العرض أقل فعلاً من الأصلي.
  const price = Number(variation.regular_price || 0) || Number(variation.price || 0) || null
  const rawSale = variation.on_sale && variation.sale_price ? Number(variation.sale_price) : null
  const salePrice = rawSale != null && price != null && rawSale < price ? rawSale : null
  // ⚡ شيد من غير سعر (أو سعره 0) في WooCommerce مش قابل للشراء: بنعلّمه غير متاح بدل ما يتباع بصفر جنيه.
  // (WooCommerce نفسه بيرجّع purchasable=false للحالة دي.)
  const inStock = variation.stock_status === 'instock'
  const available = inStock && variation.purchasable !== false && price != null
  // ⚡ WooCommerce بيسمح بمخزون سالب (طلب مسبق/backorder)، والـ schema بتمنع < 0: بنثبّته عند 0.
  const rawStock = variation.stock_quantity != null ? variation.stock_quantity : inStock ? 1 : 0
  const stock = Math.max(0, rawStock)

  return {
    colorName: label,
    tone: null, // بيتحدد في mapWooProductToOurSchema بعد ما نعرف عدد الشيدات
    image: variation.image?.src ?? fallbackImage ?? null,
    available,
    price,
    salePrice,
    stock,
    wooVariationId: variation.id,
  }
}

async function mapWooProductToOurSchema(wooProduct) {
  // ⚡ WooCommerce بيرجّع الأسماء بـ HTML entities (Dolce &amp; Gabbana) —
  // بنفكّها قبل التصنيف والتخزين عشان الاسم يظهر صح ومطابقة البراندات تشتغل.
  const name = he.decode(wooProduct.name || '')
  const categories = (wooProduct.categories || []).map((c) => ({ ...c, name: he.decode(c.name || '') }))
  const brands = (wooProduct.brands || []).map((b) => ({ ...b, name: he.decode(b.name || '') }))

  const { department, category, brand, needsReview, inferred } = categorizeProduct(name, categories, brands)

  let regularPrice = Number(wooProduct.regular_price || 0) || Number(wooProduct.price || 0)
  const rawProductSale = wooProduct.on_sale && wooProduct.sale_price ? Number(wooProduct.sale_price) : null
  let salePrice = rawProductSale != null && rawProductSale < regularPrice ? rawProductSale : null
  // مخزون سالب (backorder) ← 0، عشان الـ validation ما ترفضش المنتج (حصل مع Essence Eyeshadow Palette: -1)
  let stock = Math.max(
    0,
    wooProduct.stock_quantity != null ? wooProduct.stock_quantity : wooProduct.stock_status === 'instock' ? 1 : 0
  )
  let variants = []

  if (wooProduct.type === 'variable') {
    const variations = await getAllVariations(wooProduct.id)
    if (variations.length > 0) {
      const fallbackImage = wooProduct.images?.[0]?.src ?? null
      variants = variations.map((v, i) => mapVariationToVariant(v, i, fallbackImage))
      const tones = distinctTones(variants.length)
      variants = variants.map((v, i) => ({ ...v, tone: tones[i] }))

      // ⚡ سعر/مخزون المنتج "الأساسي" (اللي بيظهر في الكارت وفي
      // الفلترة بالسعر) بيبقى أرخص اختيار متوفر — نفس منطق قبل كده،
      // لكن دلوقتي بنحتفظ كمان بكل الاختيارات التانية في variants
      // بدل ما نرميهم.
      const available = variants.filter((v) => v.available)
      const pool = available.length > 0 ? available : variants
      // ⚡ "الأرخص" = أقل سعر فعلي (بعد الخصم). قبل كده كان بالسعر الأصلي، فلو كل الشيدات سعرها الأصلي
      // واحد كان بياخد أول واحد حتى لو غيره عليه خصم أكبر → الكارت وفلتر السعر يتضلّلوا.
      const effective = (v) => v.salePrice ?? v.price ?? Infinity
      const cheapest = pool.reduce((min, v) => (effective(v) < effective(min) ? v : min), pool[0])
      regularPrice = cheapest.price ?? regularPrice
      salePrice = cheapest.salePrice
      stock = variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    } else {
      needsReview.push('type=variable بس مفيش variations خالص — راجع المنتج في WooCommerce')
    }
  }

  // ⚡ منتج من غير سعر في WooCommerce بيظهر "EGP 0" ومينفعش يتباع: لازم يتصلّح من WooCommerce
  if (!(regularPrice > 0)) needsReview.push('price: مفيش سعر (0) في WooCommerce: بيظهر EGP 0 ومش هيتباع')

  const description = toPlainText(wooProduct.description)
  const descriptionHtml = cleanHtml(wooProduct.description)
  const shortDescription = cleanHtml(wooProduct.short_description)

  return {
    doc: {
      wooId: wooProduct.id,
      name,
      department,
      category,
      brand,
      price: regularPrice,
      salePrice,
      stock,
      description,
      descriptionHtml,
      shortDescription,
      images: (wooProduct.images || []).map((img) => img.src),
      variants,
    },
    needsReview,
    inferred,
  }
}

async function sync() {
  await connectDB()

  console.log('📥 بنجيب كل المنتجات من WooCommerce...')
  const wooProducts = await fetchAllProducts()
  console.log(`   لقينا ${wooProducts.length} منتج.\n`)

  let created = 0
  let updated = 0
  let skipped = 0
  const reviewReport = []
  const inferredReport = []
  const failedProducts = []

  for (let i = 0; i < wooProducts.length; i++) {
    const wooProduct = wooProducts[i]

    // ⚡ طباعة تقدّم كل منتج — من غيرها مفيش أي طريقة نعرف هل
    // السكريبت شغال فعليًا ولا واقف على حاجة معينة (زي ما حصل).
    process.stdout.write(`\r[${i + 1}/${wooProducts.length}] بنعالج: ${wooProduct.name.slice(0, 50).padEnd(50)}`)

    // ⚡ منتجات مش منشورة (draft/private) بنتجاهلها — مش المفروض
    // تظهر للعميل النهائي أصلاً.
    if (wooProduct.status !== 'publish') {
      skipped += 1
      continue
    }

    try {
      const { doc, needsReview, inferred } = await mapWooProductToOurSchema(wooProduct)

      // ⚡ doc.name = الاسم بعد فك الـ HTML entities (مش wooProduct.name الخام اللي فيه &amp;)
      if (needsReview.length > 0) {
        reviewReport.push({ id: wooProduct.id, name: doc.name, reasons: needsReview })
      }
      if (inferred.length > 0) {
        inferredReport.push({ id: wooProduct.id, name: doc.name, notes: inferred })
      }

      const existing = await Product.findOne({ wooId: doc.wooId })
      if (existing) {
        Object.assign(existing, doc)
        await existing.save() // ⚡ .save() مش updateOne — عشان الـ pre('save') hook يشتغل (slug, effectivePrice..)
        updated += 1
      } else {
        await Product.create(doc)
        created += 1
      }
    } catch (err) {
      // ⚡ منتج واحد فشل (مشكلة شبكة مؤقتة، بيانات غريبة..) مش لازم
      // يوقف الـ 1824 منتج الباقيين. بنسجله ونكمل، ونراجعه في الآخر.
      failedProducts.push({ id: wooProduct.id, name: wooProduct.name, error: err.message })
    }
  }

  console.log('\n') // ⚡ سطر جديد بعد آخر رسالة تقدّم (كانت بتتكتب على نفس السطر)
  console.log(`✅ خلصنا. اتضاف ${created} منتج جديد، واتحدّث ${updated} منتج موجود، واتجاهل ${skipped} (غير منشور).\n`)

  if (failedProducts.length > 0) {
    console.log(`❌ ${failedProducts.length} منتج فشل تمامًا (مش هيتحفظ خالص لحد ما نصلّح المشكلة):\n`)
    for (const item of failedProducts) {
      console.log(`   [${item.id}] ${item.name} — ${item.error}`)
    }
    console.log()
  }

  // ⚡ التقرير الكامل بيتكتب في ملف (sync-report.txt) بدل ما يغرق الترمنال.
  // الملف ده مؤقت: ما ترفعوش على Git (ضيفه لـ .gitignore).
  const countBy = (list, pick) => {
    const counts = {}
    for (const item of list) for (const r of pick(item)) {
      const key = r.split(':')[0].split('→')[0].split('=')[0].trim()
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }
  const reviewByReason = countBy(reviewReport, (i) => i.reasons)
  const inferredByKind = countBy(inferredReport, (i) => i.notes)

  const lines = []
  lines.push(`⚠️  محتاج مراجعة يدوية (${reviewReport.length}): حاجة ناقصة فعلاً ومحدش قدر يحلها`)
  for (const item of reviewReport) {
    lines.push(`   [${item.id}] ${item.name}`)
    for (const reason of item.reasons) lines.push(`      - ${reason}`)
  }
  lines.push('')
  lines.push(`🔎 مستنتج من الاسم (${inferredReport.length}): غالبًا صح، بس راجع عينة منه`)
  for (const item of inferredReport) {
    lines.push(`   [${item.id}] ${item.name}`)
    for (const note of item.notes) lines.push(`      - ${note}`)
  }
  const reportPath = path.join(__dirname, '../../sync-report.txt')
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8')

  console.log(`⚠️  ${reviewReport.length} منتج محتاج مراجعة يدوية (حاجة ناقصة فعلاً):`)
  for (const [reason, n] of Object.entries(reviewByReason)) console.log(`     ${String(n).padStart(4)}  ${reason}`)
  console.log(`🔎 ${inferredReport.length} منتج اتصنّف تلقائيًا من الاسم (راجع عينة):`)
  for (const [kind, n] of Object.entries(inferredByKind)) console.log(`     ${String(n).padStart(4)}  ${kind}`)
  console.log(`\n📄 التقرير الكامل بأسماء المنتجات: ${reportPath}\n`)

  process.exit(0)
}

sync().catch((err) => {
  console.error('❌ فشلت المزامنة:', err.message)
  process.exit(1)
})