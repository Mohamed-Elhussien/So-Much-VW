const express = require('express')
const Product = require('../models/Product')
const { slugify } = require('../lib/slugify')

const router = express.Router()

// ⚡ لازم نعمل escape لأي حرف ليه معنى خاص في الـ Regex (زي . * + ? ...)
// قبل ما نحط مدخل المستخدم جوه `new RegExp(...)` — من غير ده، حد
// ممكن يبعت query يسبب ReDoS أو نتائج غلط.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// GET /api/products?category=lipstick&department=makeup&brand=cybele&tag=bestseller&onSale=true&page=1&limit=20&search=matte
router.get('/', async (req, res, next) => {
  try {
    // ⚡ تحقق ودّي من المدخلات — page/limit جايين من query params
    // (نص دايمًا)، لازم نحوّلهم لأرقام صحيحة ونحط حدود منطقية
    // عشان حد ميبعتش limit=99999 مثلاً ويقرا الجدول كله مرة واحدة.
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20))

    // ⚡ منتج سعره 0 (أو من غير سعر) في WooCommerce مش بيظهر في الموقع لحد ما يتسعّر:
    // مفيش عميل المفروض يشوف "EGP 0"، والأوردر أصلًا بيرفضه (no_price). راجع docs/08 P-30.
    const filter = { price: { $gt: 0 } }
    if (req.query.category) {
      filter.category = String(req.query.category).toLowerCase()
    }
    if (req.query.department) {
      filter.department = String(req.query.department).toLowerCase()
    }
    if (req.query.search) {
      filter.$text = { $search: String(req.query.search) }
    }
    if (req.query.brand) {
      // ⚡ مطابقة تامة على brandSlug (indexed) — أسرع وأأمن بكتير من
      // regex، ومفيش أي احتياج للـ escape لأنها مش regex أصلاً.
      filter.brandSlug = slugify(req.query.brand)
    }
    if (req.query.tag) {
      filter.customTagSlug = slugify(req.query.tag)
    }
    if (req.query.onSale === 'true') {
      // ⚡ "عليه عرض" = عنده salePrice فعلي (مش null). بنستخدم $ne
      // بدل ما نتحقق برقم معين، لأن أي رقم أقل من السعر الأصلي يبقى
      // عرض صحيح — الفحص الحقيقي (إن salePrice < price) بيحصل وقت
      // إدخال المنتج، مش وقت القراءة.
      filter.salePrice = { $ne: null }
    }
    if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
      // ⚡ الفلترة بالسعر بتحصل على effectivePrice (indexed) مش price
      // مباشرة — منتج عليه خصم لازم يتفلتر بالسعر اللي هيتباع بيه
      // فعليًا، مش بسعره الأصلي قبل الخصم.
      let min = Number(req.query.minPrice)
      let max = Number(req.query.maxPrice)
      const hasMin = req.query.minPrice !== undefined && req.query.minPrice !== '' && !Number.isNaN(min)
      const hasMax = req.query.maxPrice !== undefined && req.query.maxPrice !== '' && !Number.isNaN(max)

      // ⚡ لو المستخدم بعت min أكبر من max (غلط في الفرونت، أو حد
      // بيلعب بالـ URL يدويًا)، بنبدلهم بدل ما نرجّع فلتر مستحيل
      // (min > max) يرجّع صفر نتائج من غير أي سبب واضح.
      if (hasMin && hasMax && min > max) {
        ;[min, max] = [max, min]
      }

      const range = {}
      if (hasMin) range.$gte = Math.max(0, min)
      if (hasMax) range.$lte = Math.max(0, max)
      if (Object.keys(range).length > 0) {
        filter.effectivePrice = range
      }
    }

    const [items, totalItems] = await Promise.all([
      Product.find(filter)
        // ⚡ صفحات الليستة (Shop, CategorySection, Bestsellers) بتعرض
        // بس الاسم/السعر/الصورة/الألوان — مش محتاجة description الطويل
        // ولا keyBenefits/howToUse/specifications/faq اللي هيبقوا
        // فقرات كاملة لما الداتا الحقيقية تتحط. استبعادهم هنا بيقلل
        // حجم الـ response بشكل كبير لكل طلب pagination، من غير ما
        // يأثر على صفحة تفاصيل المنتج (اللي عندها route منفصل تحت
        // بيرجع كل الحقول).
        .select('-description -descriptionHtml -shortDescription -keyBenefits -howToUse -suitableFor -specifications -faq')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ])

    res.json({
      data: items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/products/search?q=cyb&limit=6
// ⚡ Endpoint منفصل ومخصص للـ typeahead (اقتراحات وأنت لسه بتكتب)،
// مش نفس endpoint الليستة الرئيسي فوق — الفرق مقصود:
// - بيدور بـ "prefix match" (^cyb) على nameLower، مش $text (اللي
//   بيدور على كلمات كاملة بس ومش هيلاقي حاجة لأول 3 حروف).
// - الـ projection صغير جدًا (بس اللي الـ dropdown محتاجه) عشان
//   الاستجابة تكون خفيفة وسريعة قدر الإمكان مع كل ضغطة زرار.
// - limit صغير وثابت بحد أقصى (8) لأنها اقتراحات مش صفحة نتائج.
router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase()
    const limit = Math.min(8, Math.max(1, parseInt(req.query.limit, 10) || 6))

    if (!q) {
      return res.json({ data: [] })
    }

    const pattern = new RegExp(`^${escapeRegex(q)}`)

    const products = await Product.find({ nameLower: pattern, price: { $gt: 0 } })
      .select('name slug price salePrice tone variants stock customTag')
      .limit(limit)

    res.json({ data: products })
  } catch (err) {
    next(err)
  }
})

// GET /api/products/slug/:slug — بيستخدمها صفحة تفاصيل المنتج
// (/product/[slug]) بدل ما تعتمد على الـ ObjectId في الرابط.
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, price: { $gt: 0 } })
    if (!product) {
      const err = new Error('Product not found')
      err.status = 404
      throw err
    }
    res.json(product)
  } catch (err) {
    next(err)
  }
})

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, price: { $gt: 0 } })
    if (!product) {
      const err = new Error('Product not found')
      err.status = 404
      throw err
    }
    res.json(product)
  } catch (err) {
    next(err)
  }
})

module.exports = router
