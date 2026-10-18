const mongoose = require('mongoose')
const { slugify } = require('../lib/slugify')

const variantSchema = new mongoose.Schema(
  {
    // ⚡ الاسم مش لازم يبقى "لون" فعليًا — ممكن يبقى ريحة أو مقاس
    // (زي روائح Tutti Frutti: fantasy, lolly pop..). الاسم "colorName"
    // اتسمى كده من التصميم الأصلي، بس القيمة نفسها أي label نصي.
    colorName: { type: String, required: true, trim: true },
    tone: { type: String, required: true }, // hex fallback swatch color
    image: { type: String, default: null }, // صورة المنتج الحقيقية بهذا الاختيار
    available: { type: Boolean, default: true },
    // ⚡ سعر خاص بالاختيار ده تحديدًا — بيتفعّل بس لما يكون مختلف عن
    // سعر المنتج الأساسي (زي منتجات WooCommerce اللي كل اختيار فيها
    // بسعر مختلف شوية). لو مالوش قيمة، الواجهة بترجع لسعر المنتج
    // الأساسي (product.price) — راجع fallback في product/[slug]/page.jsx.
    price: { type: Number, default: null },
    salePrice: { type: Number, default: null },
    stock: { type: Number, default: null },
    // ⚡ رقم الـ variation في WooCommerce: لازم عشان الأوردر يتبعت بالشيد الصح (variation_id)
    wooVariationId: { type: Number, default: null },
  },
  { _id: false }
)

// ⚡ specifications/faq بترجع بنفس ترتيب الإدخال (array مش object)
// عشان الجدول والأسئلة يفضلوا بنفس الترتيب اللي المحرر كتبه بالظبط.
const specSchema = new mongoose.Schema(
  { property: { type: String, required: true, trim: true }, details: { type: String, required: true, trim: true } },
  { _id: false }
)

const faqSchema = new mongoose.Schema(
  { question: { type: String, required: true, trim: true }, answer: { type: String, required: true, trim: true } },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    // ⚡ wooId = رقم المنتج نفسه في WooCommerce. ده اللي بيخلينا نعرف
    // "هل المنتج ده موجود بالفعل نعدّله (upsert)" بدل ما نكرره كل مرة
    // نعمل مزامنة. sparse: true لأن المنتجات اللي اتعملها seed يدويًا
    // (بيانات الديمو الأصلية) مالهاش wooId خالص، ومش عايزين index
    // unique يرفض قيم null متكررة.
    wooId: { type: Number, unique: true, sparse: true, index: true },

    name: { type: String, required: true, trim: true },

    // ⚡ نسخة lowercase من الاسم مخصصة للـ typeahead search (المستخدم
    // بيكتب أول 3-4 حروف والاسم يظهر جنبه فورًا). عملناها indexed
    // منفصلة عن الـ text index تحت لأن $text مش بيعمل "prefix match"
    // (يعني "cyb" مش هيلاقي "Cybele" أبدًا — الـ text index بيدور على
    // كلمات كاملة بس). regex بادئ بـ ^ على حقل indexed lowercase زي ده
    // بيفضل يستخدم الـ index بكفاءة (عكس regex في النص العشوائي).
    nameLower: { type: String, index: true },

    // ⚡ الـ slug ده اللي بيتبني بيه رابط صفحة المنتج (/product/:slug)
    // بدل ما نستخدم الـ ObjectId الطويل في الـ URL — أنضف وأحسن SEO.
    // بيتحسب تلقائيًا من الاسم في pre('save') تحت، مش حاجة بتتدخل فيها يدويًا.
    slug: { type: String, unique: true, index: true },

    // ⚡ index: true هنا مهم للأداء — الفلترة بالتصنيف هتحصل في كل
    // طلب pagination تقريبًا، والـ index بيخلي الاستعلام سريع حتى
    // مع آلاف المنتجات بدل ما MongoDB يفحص كل الجدول (collection scan).
    category: { type: String, required: true, trim: true, lowercase: true, index: true },

    // ⚡ department هو التصنيف العام اللي بيظهر في الـ Navbar الرئيسي
    // (Make Up, Hair & Skin Care, Fragrance, Leather)، بعكس category
    // اللي أدق بكتير (lipstick, foundation, eyeshadow...). منتج واحد
    // بيبقى ليه الاتنين مع بعض.
    department: { type: String, required: true, trim: true, lowercase: true, index: true },

    // ⚡ brand بيتخزن بشكله الأصلي عشان يتعرض زي ما هو ("Cybele")،
    // وbrandSlug (تحت) هو النسخة المطابقة اللي بيتفلتر بيها — نفس
    // فكرة customTag/customTagSlug تمامًا، عشان الفلترة تستخدم
    // الـ index بمطابقة مباشرة (exact match) بدل regex أبطأ.
    brand: { type: String, required: true, trim: true },
    brandSlug: { type: String, index: true },

    price: { type: Number, required: true, min: 0 },
    // ⚡ index: true هنا لأن "?onSale=true" فلتر متوقع يتستخدم كتير
    // (زرار "View All Offers" في الهوم)، ونفس فكرة category/department:
    // أرخص نستعلم على index جاهز بدل ما MongoDB يفحص كل الجدول.
    salePrice: { type: Number, default: null, min: 0, index: true },
    // ⚡ effectivePrice = salePrice لو موجود، وإلا price. فلتر السعر
    // (?minPrice&maxPrice) بيستعلم على الحقل ده، مش على price مباشرة،
    // عشان منتج عليه عرض يتفلتر بسعره الفعلي اللي المستخدم هيدفعه —
    // مش بسعره الأصلي قبل الخصم. index: true عشان range query ($gte/
    // $lte) يستخدم الـ index بدل ما يفحص كل الجدول ويفلتر بعدين.
    effectivePrice: { type: Number, index: true },

    // ⚡ لون افتراضي بس (مش إجباري) — المفروض يتستخدم بس لو مفيش صورة
    // حقيقية خالص (images فاضية). المنتجات الحقيقية من WooCommerce
    // معندهاش "لون" أصلاً، فمينفعش يفضل إجباري زي ما كان في بيانات
    // الديمو القديمة.
    tone: { type: String, default: '#EADFD7' },

    // ⚡ روابط صور حقيقية للمنتج (من WooCommerce أو أي مصدر تاني
    // مستقبلًا). أول عنصر في المصفوفة هو الصورة الأساسية اللي بتتعرض
    // في الكارت وأول صورة في صفحة المنتج. لو المصفوفة فاضية، الواجهة
    // بترجع تلقائيًا للون (tone) بدل الصورة — راجع ProductImage.jsx.
    images: { type: [String], default: [] },

    // ⚡ description = نص عادي (للبحث وكروت المنتجات).
    // descriptionHtml / shortDescription = HTML منضّف وقت الـ sync (sanitize-html)
    // وبيتعرض في صفحة المنتج بنفس تنسيق WooCommerce.
    description: { type: String, default: '' },
    descriptionHtml: { type: String, default: '' },
    shortDescription: { type: String, default: '' },

    // ⚡ محتوى صفحة المنتج التفصيلية — كله اختياري، الصفحة بتخفي أي
    // قسم فاضي بدل ما تعرض جدول/ليستة فاضية.
    keyBenefits: { type: [String], default: [] },
    howToUse: { type: [String], default: [] },
    suitableFor: { type: [String], default: [] },
    specifications: { type: [specSchema], default: [] },
    faq: { type: [faqSchema], default: [] },

    // ⚡ customTag هو المدخل اليدوي بس (زي "Bestseller"). الـ badge
    // النهائي اللي بيتعرض للمستخدم بيتحسب في الـ virtual "tag" تحت،
    // مش بيتخزّن، عشان يفضل مطابق للمخزون الفعلي دايمًا.
    customTag: { type: String, default: null, trim: true },
    // ⚡ customTagSlug — نفس فكرة brandSlug: نسخة مطابقة للفلترة
    // الدقيقة (?tag=bestseller) بدل الاعتماد على regex.
    customTagSlug: { type: String, default: null, index: true },

    stock: { type: Number, required: true, min: 0, default: 0 },

    variants: [variantSchema],
  },
  { timestamps: true }
)

// ⚡ الـ slugs الثلاثة دي مشتقة (derived) من حقول تانية، فبنعيد
// حسابها في كل save بدل ما نسيبها تتوارث/تتنسى — رخيصة وبسيطة، ومفيش
// أي احتمال إنها "تخرج عن المزامنة" مع الاسم/البراند/التاج الحقيقيين.
productSchema.pre('save', function (next) {
  // ⚡ منتجات WooCommerce (اللي ليها wooId) بيتضاف رقمها الفريد في
  // آخر الـ slug — الاسم لوحده مش كافي يضمن رابط فريد على كتالوج
  // حقيقي كبير (1000+ منتج)، ممكن يتكرر اسمين متشابهين أو حتى
  // متطابقين بالغلط. الرقم بيضمن رياضيًا إن الرابط يفضل فريد دايمًا،
  // من غير ما نضطر نعمل استعلام إضافي على الداتابيز في كل save.
  this.slug = this.wooId ? `${slugify(this.name)}-${this.wooId}` : slugify(this.name)
  this.nameLower = this.name.trim().toLowerCase()
  this.brandSlug = slugify(this.brand)
  this.customTagSlug = this.customTag ? slugify(this.customTag) : null
  this.effectivePrice = this.salePrice ?? this.price
  next()
})

// ⚡ نفس منطق lib/getProductTag.js بالظبط في الفرونت — لو غيّرت
// المنطق في مكان، لازم تحدّثه في التاني كمان لحد ما نلغي النسخة
// الفرونت-إند بالكامل ونعتمد على الـ API بس.
productSchema.virtual('tag').get(function () {
  if (this.stock === 0) return 'Sold Out'
  if (this.stock > 0 && this.stock <= 5) return 'Almost Gone'
  if (this.stock > 5) return this.customTag ?? null
  return null
})

// index نصي للبحث عن اسم/وصف المنتج (يخدم مشكلة "البحث المبوظ"
// اللي كانت موجودة في الموقع الحقيقي)
productSchema.index({ name: 'text', description: 'text' })

// ⚡ compound index على النمط الأكتر شيوعًا في التصفح الفعلي: مستخدم
// بيدوس على "Make Up" (department) بعدين يفلتر بتصنيف فرعي زي
// "Lipstick" (category) سوا. الـ index المفرد على كل حقل لوحده
// (فوق) كويس، لكن compound index زي ده بيخلي MongoDB يحل الاستعلام
// المركب في خطوة واحدة بدل ما يقاطع (intersect) نتيجتين منفصلتين —
// فرق حقيقي لما الكتالوج يوصل لآلاف المنتجات.
productSchema.index({ department: 1, category: 1 })

productSchema.set('toJSON', { virtuals: true })
productSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('Product', productSchema)