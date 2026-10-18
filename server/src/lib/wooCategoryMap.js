// ⚡ WooCommerce بيخزن كل حاجة (department, نوع المنتج, البراند,
// الجمهور المستهدف) في مصفوفة "categories" واحدة مسطحة، من غير أي
// فصل واضح. المفروض شكل الداتا مش يتوقع منها ترتيب معين — بنعتمد على
// جداول/قوائم بنعرفها إحنا، مش على تخمين شكل عشوائي.
//
// ⚡ القوائم دي مقصود تكون قابلة للتوسعة بسهولة — كل ما نشوف براند أو
// department جديد في بيانات حقيقية، بنضيفه هنا سطر واحد، مش بنغيّر
// منطق الكود نفسه.

// slug الفئة في WooCommerce → القيمة اللي بنخزنها في حقل department عندنا
// ⚡ القائمة دي بُنيت من الليستة الكاملة لـ 250 category حقيقية في
// المتجر (مش تخمين) — عشان نغطي أكبر عدد ممكن من مرة واحدة.
const DEPARTMENT_BY_SLUG = {
  'make-up': 'makeup',
  makeup: 'makeup',
  fragrance: 'fragrance',
  perfume: 'fragrance',
  perfumes: 'fragrance',
  'men-perfumes': 'fragrance',
  'women-perfumes': 'fragrance',
  'hair-and-skin-care': 'hair-and-skin-care',
  'hair-care': 'hair-and-skin-care',
  'skin-care': 'hair-and-skin-care',
  leather: 'leather',
  // ⚡ قسم جديد كليًا مش موجود في نافيجيشن الموقع حاليًا (Makeup/Hair
  // &Skin/Fragrance بس). 106 منتج حقيقي محتاجين مكان يظهروا فيه —
  // ده قرار محتاج تأكيدك، راجع الشرح في الرد.
  'tools-nails-and-lashes': 'tools-nails-and-lashes',

  // ⚡ الإضافات دي مبنية على تحليل حقيقي لـ 473 منتج وقعوا في
  // "uncategorized" (سكريبت analyze-uncategorized.js) + مطابقتها مع
  // تصنيف يدوي قديم موجود في frontend/data/nav.js — مش تخمين.
  // أنواع منتجات Hair & Skin Care (كانت من غير department خالص):
  wash: 'hair-and-skin-care',
  'cream-face-hair-and-skin-care': 'hair-and-skin-care',
  shampoo: 'hair-and-skin-care',
  'mask-face-hair-and-skin-care': 'hair-and-skin-care',
  serum: 'hair-and-skin-care',
  conditioner: 'hair-and-skin-care',
  deodorant: 'hair-and-skin-care',
  lotion: 'hair-and-skin-care',
  'makeup-remover': 'hair-and-skin-care',
  'cream-hand': 'hair-and-skin-care',
  'cream-hair': 'hair-and-skin-care',
  cream: 'hair-and-skin-care',
  'leave-in': 'hair-and-skin-care',
  scrub: 'hair-and-skin-care',
  mask: 'hair-and-skin-care',
  'serum-hair': 'hair-and-skin-care',
  coloring: 'hair-and-skin-care',
  'shower-gel': 'hair-and-skin-care',
  'eye-face-hair-and-skin-care': 'hair-and-skin-care',
  'hair-perfume': 'hair-and-skin-care',
  soap: 'hair-and-skin-care',
  oil: 'hair-and-skin-care',
  'wash-for-sensitive-skin': 'hair-and-skin-care',
  'face-hair-and-skin-care': 'hair-and-skin-care',
  'scrub-body': 'hair-and-skin-care',
  gel: 'hair-and-skin-care',
  'lip-therapy': 'hair-and-skin-care',
  'scrub-hand': 'hair-and-skin-care',
  'micellar-water': 'hair-and-skin-care',
  toner: 'hair-and-skin-care',
  'lip-balm': 'hair-and-skin-care',
  'lip-care': 'hair-and-skin-care',
  'hair-removal': 'hair-and-skin-care',
  'lotion-hand': 'hair-and-skin-care',
  sunscreen: 'hair-and-skin-care', // ⚡ فات علينا في المرة اللي فاتت — 26 منتج حقيقي بيستخدموها

  // أنواع منتجات Make Up:
  'powder-puff': 'makeup',
  blusher: 'makeup',
  eye: 'makeup',
  face: 'makeup',
  mascara: 'makeup',
  eyebrow: 'makeup',
  'lip-gloss': 'makeup',
  foundation: 'makeup',
  eyeliner: 'makeup',
  eyeshadow: 'makeup',
  contour: 'makeup',
  lipstick: 'makeup',
  'eyeshadow-brush': 'makeup',
  'nail-polish': 'makeup', // ⚡ منطقيًا "أداة"، لكن نفس nav.js بيحطها تحت Make Up
  palette: 'makeup',
  lip: 'makeup',

  // أدوات (Tools, Nails and Lashes) — نفس التصنيف الموجود في nav.js:
  'face-brush': 'tools-nails-and-lashes',
  'nail-clipper-file': 'tools-nails-and-lashes',
  'hair-brush': 'tools-nails-and-lashes',
  comb: 'tools-nails-and-lashes',
  tweezers: 'tools-nails-and-lashes',
  sharpener: 'tools-nails-and-lashes',
  'hair-clips': 'tools-nails-and-lashes',

  // منتجات Body Spray/Splash — nav.js بيحطها تحت Fragrance مش Hair&Skin:
  'women-body-spray': 'fragrance',
  'body-splash': 'fragrance',
  'body-spray': 'fragrance',
}

// ⚡ دي بس أسماء الأقسام "العريضة" الحرفية (زي "Hair And Skin Care"
// نفسها كـ category عام) — مش كل الـ slugs اللي بترجع department عن
// طريق الجدول فوق. الفرق مهم: category فرعي زي "Deodorant" بيدّي
// department صح (hair-and-skin-care) *و* في نفس الوقت هو نفسه قيمة
// مفيدة لحقل category الفرعي عندنا — مش عايزين نستبعده من حساب الـ
// category بس لأنه استُخدم للـ department. الاستبعاد ده بيحصل بس
// للأقسام العريضة الحرفية اللي مالهاش معنى كـ "نوع منتج" فرعي أصلاً.
const PURE_DEPARTMENT_SLUGS = new Set([
  'make-up',
  'makeup',
  'fragrance',
  'hair-and-skin-care',
  'hair-care',
  'skin-care',
  'leather',
  'tools-nails-and-lashes',
])

// slugs مالهاش قيمة تصنيفية حقيقية — جمهور مستهدف، أو "أب" تنظيمي
// بيجمع فئات تانية تحته (زي "Brands" اللي بيحتوي براندات فرعية)، مش
// معلومة عن المنتج نفسه.
const IGNORED_SLUGS = new Set([
  'women',
  'men',
  'unisex',
  'uncategorized',
  'sale',
  'featured',
  // ⚡ فئات "أب" تنظيمية بس (parent buckets) — مش معلومة حقيقية عن
  // المنتج، وأي منتج تحتها هيبقى ليه برضو فئة براند حقيقية جنبها.
  'brands',
  'brands-fragrance',
  'brands-hair-and-skin-care',
  'brands-tools-nails-and-lashes',
  'bodylicious-brands-hair-and-skin-care',
])

// ⚡ أسماء براندات معروفة — الليستة دي مبنية من مراجعة فعلية لكل
// الـ categories والـ brands الحقيقية في المتجر (مش تخمين عشوائي).
// دي fallback بس تستخدم لو حقل wooProduct.brands فاضي (زي L'Oreal
// Paris وStar-ville اللي مسجلين في categories القديمة بس).
const KNOWN_BRANDS = [
  'catrice', 'essence', 'cybele', 'maybelline', "l'oreal", 'loreal', 'loreal-paris', 'nyx', 'revlon',
  'flormar', 'beter', 'amanda', 'eveline', 'luna', 'eva', 'bourjois', 'the-hair-addict', 'garnier',
  'star-ville', 'starville', 'burberry', 'lattafa', 'beesline', 'paco-rabanne', 'versace',
  'giorgio-armani', 's-t-dupont', 'bobai', 'guess', 'drakon', 'hugo-boss', 'calvin-klein', 'jaguar',
  'roberto-cavalli', 'shaan', 'azzaro', 'karen-low', 'mood', 'alfred-dunhill', 'adidas', 'givenchy',
  'britney-spears', 'nutshell', 'clary', 'al-fares', 'bvlgari', 'gucci', 'lacoste', 'yves-saint-laurent',
  'mercedes-benz', 'escada', 'dior', 'davidoff', 'salvatore-ferragamo', 'valentino', 'jacques-bogart',
  'issey-miyake', 'ferrari', 'tom-ford', 'prada', 'kenzo', 'chanel', 'elie-saab', 'thierry-mugler',
  'dolce-gabbana', 'yves-de-sistelle', 'narciso', 'juicy-couture', 'chopard', 'lancome', 'bentley',
  'guy-laroche', 'jean-paul-gaultier', 'jacomo', 'le-chameau', 'emper', 'ralph-lauren-polo', 'armaf',
  'reyane', 'estelle-ewen', 'mpf', 'le-bonheur', 'lapidus', 'salvador', 'aquolina', 'nina-ricci',
  'elodie', 'fan-di-fendi', 'sos-creations', 'chris-adams', 'carrera', 'mancera', 'antonio-banderas',
  'donna-karan', 'roger-gallet', 'maryaj', 'geparlys', 'rimmel', 'topface', 'golden-rose', 'korean',
  'rasasi', 'johan-b', 'mont-blanc', 'carolina-herrera', 'bobana', 'bodylicious', 'almas', 'zippo',
  // ⚡ اتضافوا من تقرير المراجعة الفعلي (sync-log): براندات كانت بتطلع "مفيش براند"
  'viktor-rolf', 'alhambra', 'amaran', 'lively', 'remy-marquis', 'sol-de-janeiro', 'memwa', 'axe',
  'my-perfumes', 'jessica-simpson', 'glenn-perri', 'khanjar', 'sainte-valere', 'malizia',
  'cosmo-designs', 'passport', 'care-more', 'amarah', 'john-antoine', 'jean-antoine', 'camara',
  'tutti-frutti', 'bubblzz',
]

/**
 * بياخد مصفوفة categories الخام من WooCommerce (شكلها [{id, name, slug}])
 * واسم المنتج، ويرجع department/category/brand + علم "يحتاج مراجعة"
 * لو مش واثقين من نتيجة واحدة أو أكتر.
 */
/**
 * بيحوّل slug (زي "l'oreal" أو "the-hair-addict") لاسم مرتب للعرض
 * ("L'Oreal", "The Hair Addict") — بيكبّر أول حرف كل كلمة، وأول حرف
 * بعد أي علامة اقتباس (') كمان عشان أسماء زي "L'Oreal" تتكتب صح.
 */
function titleCase(slug) {
  return slug
    .split(/[-\s]/)
    .map((word) =>
      word
        .split("'")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("'")
    )
    .join(' ')
}

// ===================================================================
// مطابقة الأسماء
// ===================================================================

// ⚡ توحيد أي اسم قبل المقارنة (براند/منتج/category) عشان الفروق الشكلية ما تكسرش المطابقة:
//   حروف كبيرة/صغيرة، أكسنتس (Rémy → remy)، "&" و"&amp;" و"and" ("Dolce & Gabbana"
//   = "dolce-gabbana")، علامات الاقتباس ("L'Oreal" = "Loreal")، وأي رمز تاني (شرطة/نقطة/نجمة).
// الأحرف التالفة في الداتا نفسها ("R?my") بتتحول لمسافة، وبنغطيها بـ BRAND_ALIASES.
function normalize(s = '') {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&amp;|&/g, ' ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .replace(/\band\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// أسماء بديلة/أخطاء إملائية/أحرف تالفة/خطوط فرعية → البراند الأساسي (من KNOWN_BRANDS)
const BRAND_ALIASES = {
  elvive: "l'oreal", // Elvive خط منتجات تابع لـ L'Oréal
  'maison alhambra': 'alhambra',
  'victor rolf': 'viktor-rolf', // typo شائع
  'r my marquis': 'remy-marquis', // "R?my" (حرف تالف في WooCommerce)
  'lanc me': 'lancome',
  'l oreal': "l'oreal",
  'l or al': "l'oreal",
  amran: 'amaran',
  'parfums lively': 'lively',
  '212 men': 'carolina-herrera', // 212 خط تابع لـ Carolina Herrera
  'natural fiber': 'beter', // خط فرش Beter (الاسم بيجي أحيانًا من غير كلمة Beter)
}

// اسم العرض للبراندات اللي فيها & أو أكسنت (الباقي بيتعمله titleCase للـ slug)
const BRAND_DISPLAY = {
  'dolce-gabbana': 'Dolce & Gabbana',
  'viktor-rolf': 'Viktor & Rolf',
  'roger-gallet': 'Roger & Gallet',
  'care-more': 'Care & More',
  'remy-marquis': 'Rémy Marquis',
  'sol-de-janeiro': 'Sol de Janeiro',
}

// منتجات ملهاش براند خارجي (باقات/منتجات المتجر نفسه) → مش "مفيش براند"، دي علامة المتجر.
// ⚠️ قرار تسمية: غيّر 'So Much' لو عايز اسم تاني.
const OWN_LABEL_PATTERNS = [{ re: /^summer bag\b/i, brand: 'So Much' }]

// قسم افتراضي للبراند لو الاسم نفسه ما فيهوش دلالة (وWooCommerce ما حطش department)
const BRAND_DEFAULT_DEPARTMENT_RAW = {
  bubblzz: 'hair-and-skin-care', eva: 'hair-and-skin-care', luna: 'hair-and-skin-care',
  shaan: 'hair-and-skin-care', mood: 'hair-and-skin-care', clary: 'hair-and-skin-care',
  garnier: 'hair-and-skin-care', "l'oreal": 'hair-and-skin-care', loreal: 'hair-and-skin-care',
  'loreal-paris': 'hair-and-skin-care', beesline: 'hair-and-skin-care', drakon: 'hair-and-skin-care',
  nutshell: 'hair-and-skin-care', bodylicious: 'hair-and-skin-care', 'the-hair-addict': 'hair-and-skin-care',
  'care-more': 'hair-and-skin-care',
  beter: 'tools-nails-and-lashes',
  'carolina-herrera': 'fragrance', 'britney-spears': 'fragrance', guess: 'fragrance', 'johan-b': 'fragrance',
  'le-chameau': 'fragrance', alhambra: 'fragrance', amaran: 'fragrance', lively: 'fragrance',
}

const BRAND_CANDIDATES = [
  ...KNOWN_BRANDS.map((b) => ({ key: normalize(b), brand: b })),
  ...Object.entries(BRAND_ALIASES).map(([alias, b]) => ({ key: normalize(alias), brand: b })),
].sort((a, z) => z.key.length - a.key.length) // الأطول الأول: "maison alhambra" قبل "alhambra"

const BRAND_DEFAULT_DEPARTMENT = Object.fromEntries(
  Object.entries(BRAND_DEFAULT_DEPARTMENT_RAW).map(([b, d]) => [normalize(b), d])
)

// براندات اسمها كلمة عادية ("Essence" = نوع منتج K-beauty كمان، "Mood"، "Eva"، "Luna"...).
// دي بتتطابق كبراند من الاسم بس لو في أوله أو بعد "by" ("...Baked By Essence")، عشان
// "Skin Relief Essence" ما يتحسبش منتج براند Essence. (لو WooCommerce حدد البراند بنفسه، ده مش بيتطبق.)
const AMBIGUOUS_BRANDS = new Set(['essence', 'mood', 'eva', 'luna', 'passport', 'korean', 'almas'].map(normalize))

// ⚡ المطابقة على حدود الكلمات ("axe" ما يطابقش جوه "taxes")، وبعدها fallback قديم
// (substring) للأسماء الطويلة بس (6+ حروف) عشان الأسماء القصيرة ما تدخلش جوه كلمات تانية.
function matchBrand(name) {
  const n = normalize(name)
  const padded = ` ${n} `
  const fits = (c) =>
    padded.includes(` ${c.key} `) &&
    (!AMBIGUOUS_BRANDS.has(c.key) || n.startsWith(`${c.key} `) || padded.includes(` by ${c.key} `))

  const hit = BRAND_CANDIDATES.find(fits)
  if (hit) return hit.brand
  return BRAND_CANDIDATES.find((c) => c.key.length >= 6 && !AMBIGUOUS_BRANDS.has(c.key) && n.includes(c.key))?.brand ?? null
}

// ===================================================================
// استنتاج department / category من اسم المنتج (لما WooCommerce ما حطهمش)
// ===================================================================
// ⚡ الأولوية دايمًا لبيانات WooCommerce. ده fallback بس، وكل استنتاج بيتسجّل في
// `inferred` (مش بيتخبّى) عشان صاحب المتجر يراجعه. الترتيب مهم: أول قاعدة تطابق تكسب.
// Taxonomy مبنية على قوايم الـ nav نفسها (Body Splash/Spray تحت Fragrance، Deodorant تحت Skin Care...).
const DEPARTMENT_NAME_RULES = [
  [/\b(edp|edt|eau de (parfum|toilette|cologne)|parfum|perfumes?|perfumed|cologne|tester)\b|\btst ?\d+/i, 'fragrance'],
  [/\b(nail|brush|comb|towel|sponge|scalp massager)\b|فرش|بلندر|اسفنج/i, 'tools-nails-and-lashes'],
  [/\b(deodorant|underarm|sanitizer|shampoo|conditioner|cleanser|serum|moisturi[sz]\w*|lotion|shower gel|body (care|gel|wash|scrub|butter)|scrub|soap|hair (water|oil|mask)|foot mask|lip (butter|therapy|moisturizer)|cream)\b/i, 'hair-and-skin-care'],
  [/\b(body (mist|splash|spray)|splash|mist|spray)\b/i, 'fragrance'],
  [/\b(foundation|mascara|lip ?stick|lip ?gloss|blush(er)?|eye ?liner|eye ?shadow|concealer|primer|powder|kohl|palet+e?s?)\b/i, 'makeup'],
]

const CATEGORY_NAME_RULES = [
  [/\b(kit|set)\b/i, 'sets'],
  [/\bmascara\b/i, 'mascara'],
  [/\bkohl\b/i, 'kohl'],
  [/\b(eye ?liner|liner)\b/i, 'eyeliner'],
  [/\beye ?brow\b|\bbrow\b/i, 'eyebrow'],
  [/\beye ?shadow\b/i, 'eyeshadow'],
  [/\bpalet+e?s?\b/i, 'palettes'],
  [/\b(concealer|corrector)\b/i, 'concealer'],
  [/\bfoundation\b/i, 'foundation'],
  [/\bprimer\b/i, 'primer'],
  [/\bblush(er)?\b/i, 'blusher'],
  [/\bpowder\b/i, 'powder'],
  [/\blip ?gloss\b/i, 'lip-gloss'],
  [/\blip ?stick\b/i, 'lipstick'],
  [/\blip (care|butter|therapy|balm|moisturizer)\b/i, 'lip-care'],
  [/\b(fixing|fix|setting) spray\b/i, 'fix-spray'],
  [/\b(edp|edt|eau de (parfum|toilette|cologne)|parfum|perfumes?|cologne|tester)\b|\btst ?\d+/i, 'perfume'],
  [/\bdeodorant\b|\bunderarm\b/i, 'deodorant'],
  // ⚠️ "mist" لوحدها مش body splash (Cream Mist للوش): لازم body/perfumed أو splash
  [/\b(body (mist|splash|spray)|perfumed mist|splash)\b/i, 'body-splash'],
  [/\b(shower gel|body (gel|wash))\b/i, 'shower-gel'],
  [/\bsun\b|\bspf ?\d+/i, 'sun-care'],
  [/\b(eye (cream|patch(es)?|serum|gel)|under eye)\b/i, 'eye-care'],
  [/\bpad(s)?\b/i, 'pads'],
  [/\bpatch(es)?\b/i, 'patches'],
  [/\b(cleans(er|ing)|micellar|foam)\b/i, 'cleanser'],
  [/\btoner\b/i, 'toner'],
  [/\bampoule\b/i, 'ampoule'],
  [/\bessence\b/i, 'essence'], // آمن لأن اسم البراند (Essence) بيتشال قبل التطبيق
  [/\bcandles?\b/i, 'candles'],
  [/\bserum\b/i, 'serum'],
  [/\bcream\b/i, 'cream'],
  [/\bmask\b/i, 'mask'],
  [/\bscrub\b/i, 'scrub'],
  [/\blotion\b/i, 'lotion'],
  [/\bshampoo\b/i, 'shampoo'],
  [/\bconditioner\b/i, 'conditioner'],
  [/\bsoap\b/i, 'soap'],
  [/\boil\b/i, 'oil'],
  [/\bsanitizer\b/i, 'sanitizer'],
  [/\bcomb\b/i, 'comb'],
  [/\bbrush\b|فرش/i, 'brush'],
  [/\bnail\b/i, 'nails'],
]

const brandKeyOf = (brandSlug) => (brandSlug ? normalize(brandSlug) : null)

// بنشيل اسم البراند من الاسم قبل ما نطبّق القواعد ("Essence" براند مش نوع منتج)
function stripBrand(name, brandSlug) {
  const key = brandKeyOf(brandSlug)
  if (!key) return String(name)
  return String(name).replace(new RegExp(`\\b${key.split(' ').join('[^a-z0-9]*')}\\b`, 'i'), ' ')
}

function inferDepartment(name, brandSlug) {
  const rest = stripBrand(name, brandSlug)
  const rule = DEPARTMENT_NAME_RULES.find(([re]) => re.test(rest))
  if (rule) return { value: rule[1], via: 'الاسم' }
  const byBrand = BRAND_DEFAULT_DEPARTMENT[brandKeyOf(brandSlug)]
  if (byBrand) return { value: byBrand, via: 'البراند' }
  return null
}

function inferCategory(name, brandSlug) {
  const rest = stripBrand(name, brandSlug)
  const rule = CATEGORY_NAME_RULES.find(([re]) => re.test(rest))
  return rule ? rule[1] : null
}

/**
 * بياخد اسم المنتج + categories الخام + brands الخام (لو موجودة) من
 * WooCommerce، ويرجع department/category/brand.
 *   needsReview: حاجة ناقصة فعلاً ومحدش عارف يحلها (محتاجة تدخّل بشري)
 *   inferred:    حاجة استنتجناها من الاسم (غالبًا صح، بس تستاهل مراجعة سريعة)
 */
function categorizeProduct(name, wooCategories = [], wooBrands = []) {
  const categories = wooCategories.filter((c) => !IGNORED_SLUGS.has(c.slug))
  const nameLower = name.toLowerCase()

  const needsReview = []
  const inferred = []

  // ---- brand ----
  // أولوية 1: حقل brands الرسمي. 2: category اسمها براند معروف. 3: علامة المتجر (باقات). 4: الاسم نفسه.
  const brandFromWooField = wooBrands?.[0]?.name
  const brandCategory = categories.find((c) => KNOWN_BRANDS.some((b) => normalize(b) === normalize(c.name)))
  const own = OWN_LABEL_PATTERNS.find((p) => p.re.test(name))
  const matchedSlug = matchBrand(name)

  const properCasedBrand = brandFromWooField ?? brandCategory?.name ?? own?.brand
  const brand =
    properCasedBrand ??
    (matchedSlug ? BRAND_DISPLAY[matchedSlug] ?? titleCase(matchedSlug) : 'Unbranded')
  const brandSlug = properCasedBrand ?? matchedSlug
  if (!brandSlug) needsReview.push('brand: مفيش براند معروف اتلاقى في brands ولا categories ولا الاسم')

  // ---- department ----
  const departmentMatch = categories.find((c) => DEPARTMENT_BY_SLUG[c.slug])
  let department = departmentMatch ? DEPARTMENT_BY_SLUG[departmentMatch.slug] : 'uncategorized'
  if (!departmentMatch) {
    const guess = inferDepartment(name, brandSlug)
    if (guess) {
      department = guess.value
      inferred.push(`department → ${guess.value} (من ${guess.via})`)
    } else {
      needsReview.push('department: مفيش أي category بتدل على department معروف')
    }
  }

  // ---- category (النوع الفرعي: eyeliner/mascara/blusher..) ----
  // من الباقي بعد استبعاد department/brand، بنختار الاسم اللي بيتطابق مع اسم المنتج (الأطول أدق).
  const remaining = categories.filter(
    (c) => !PURE_DEPARTMENT_SLUGS.has(c.slug) && normalize(c.name) !== normalize(brandSlug)
  )
  const nameMatches = remaining
    .filter((c) => nameLower.includes(c.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length)

  const categoryMatch = nameMatches[0] ?? remaining[0]
  let category = categoryMatch ? categoryMatch.slug : 'other'
  if (!categoryMatch) {
    const guess = inferCategory(name, brandSlug)
    if (guess) {
      category = guess
      inferred.push(`category → ${guess} (من الاسم)`)
    } else {
      needsReview.push('category: مفيش أي category فرعي واضح بعد استبعاد department/brand')
    }
  }

  return { department, category, brand, needsReview, inferred }
}

module.exports = {
  categorizeProduct,
  matchBrand,
  normalize,
  inferDepartment,
  inferCategory,
  DEPARTMENT_BY_SLUG,
  IGNORED_SLUGS,
  KNOWN_BRANDS,
}
