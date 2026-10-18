// تشغيل: node --test test/wooCategoryMap.test.js   (من مجلد server)
const test = require('node:test')
const assert = require('node:assert/strict')
const { categorizeProduct, matchBrand, normalize, inferDepartment, inferCategory } = require('../src/lib/wooCategoryMap')

test('normalize: & و&amp; و and والأكسنتس وعلامات الاقتباس', () => {
  assert.equal(normalize('Dolce &amp; Gabbana'), normalize('Dolce & Gabbana'))
  assert.equal(normalize('Dolce & Gabbana'), normalize('dolce-gabbana'))
  assert.equal(normalize("L'Oréal Paris"), 'loreal paris')
  assert.equal(normalize('Care and More'), normalize('Care & More'))
  assert.equal(normalize('Johan.B'), 'johan b')
})

test('matchBrand: الحالات اللي كانت بتفشل في الـ sync الفعلي', () => {
  const cases = {
    'Dolce & Gabbana Pour Homme EDT spray': 'dolce-gabbana',
    'Roger & Gallet Open EDT Spray': 'roger-gallet',
    'Viktor & Rolf Flowerbomb EDP': 'viktor-rolf',
    'Victor & Rolf Flowerbomb EDP': 'viktor-rolf',
    'Care and More Liquid Hand Soap': 'care-more',
    'Care & More Original Lip Butter': 'care-more',
    'R?my Marquis Shalis EDP Spray': 'remy-marquis',
    "Maison Alhambra Men's Salvo": 'alhambra',
    'Heaven Eau de Parfum by Amran Entertainment': 'amaran',
    'Loreal Elvive Extraordinary Oil': "l'oreal", // loreal و l'oreal نفس البراند بعد normalize: بيتوحّد العرض
    'Elvive Total Repair 5': "l'oreal",
    'Sol de Janeiro Perfumes 250ml': 'sol-de-janeiro',
    'Natural Fiber Precision Eye Shadow Brush': 'beter',
  }
  for (const [name, brand] of Object.entries(cases)) assert.equal(matchBrand(name), brand, name)
})

test('matchBrand: مفيش false positives، والبراندات اللي كانت شغالة لسه شغالة', () => {
  assert.equal(matchBrand('Maxeo taxes face cream'), null) // "axe" جوه كلمات تانية
  assert.equal(matchBrand('Moody Blush Palette'), null) // "mood" جوه "moody"
  assert.equal(matchBrand('Dr. Althea Skin Relief Essence 85ml'), null) // Essence = نوع المنتج مش البراند
  assert.equal(matchBrand('Aloe Eva Strengthening Hair Conditioner'), null) // "eva" في النص مش في الأول
  assert.equal(matchBrand('Essence Lash Princess Mascara'), 'essence')
  assert.equal(matchBrand('Blusher Rose All Day Soft Baked By Essence - 30'), 'essence')
  assert.equal(matchBrand('Eva Skin Care Shower Gel'), 'eva')
  assert.equal(matchBrand('Giorgio Armani Si Eau de Parfum'), 'giorgio-armani') // إصلاح الشرطة/المسافة القديم
  assert.equal(matchBrand('Catrice *Eternal Red* - Lip Care Set'), 'catrice')
  assert.equal(matchBrand('Golden Rose 3d mega shine lipgloss'), 'golden-rose')
})

test('inferDepartment: أنواع المنتجات حسب قوايم الـ nav', () => {
  const d = (name, brand) => inferDepartment(name, brand)?.value
  assert.equal(d('Britney Spears Ladies Fantasy Intense EDP Spray'), 'fragrance')
  assert.equal(d('Carolina Herrera Amber Desire Unisex tst100ml'), 'fragrance')
  assert.equal(d('Amanda Splash Body Mist'), 'fragrance') // Body Splash تحت Fragrance في الـ nav
  assert.equal(d('Beesline Radiant Bright Underarm spray'), 'hair-and-skin-care') // مش fragrance رغم كلمة spray
  assert.equal(d('Dr. Althea 345 Relief Cream Mist 60ml'), 'hair-and-skin-care')
  assert.equal(d("Beter Coffee O'Clock Scalp Massager Shampoo Brush"), 'tools-nails-and-lashes') // brush > shampoo
  assert.equal(d('Natural Fiber Precision Eye Shadow Brush'), 'tools-nails-and-lashes') // brush > eye shadow
  assert.equal(d('Flormar Smooth Skin Foundation', 'flormar'), 'makeup')
  assert.equal(d('Bubblzz Sugar Plum Fairy Candle', 'bubblzz'), 'hair-and-skin-care') // من البراند
  assert.equal(d('Jean Antoine Collection 15ml', 'jean-antoine'), undefined) // مفيش دلالة → يفضل للمراجعة
  assert.equal(d('loli'), undefined)
})

test('inferCategory: شيل اسم البراند قبل التطبيق + الترتيب الصح', () => {
  const c = (name, brand) => inferCategory(name, brand)
  assert.equal(c('Essence Eyebrow Designer Pencil', 'essence'), 'eyebrow') // Essence = البراند مش essence كنوع
  assert.equal(c('Numbuzin No.9 NAD Bio Lifting Essence 50ml', 'numbuzin'), 'essence')
  assert.equal(c('Tocobo Cica Calming Sun Serum SPF50+', 'tocobo'), 'sun-care') // sun > serum
  assert.equal(c('Dr. Althea 345 Relief Cream Mist 60ml', 'dr-althea'), 'cream') // مش body-splash
  assert.equal(c('Eva Senses Body Mist - 240 ml', 'eva'), 'body-splash')
  assert.equal(c('Some By Mi Retinol Intense Trial Kit', 'some-by-mi'), 'sets')
  assert.equal(c('Eva Skin Care Shower Gel Royal Island', 'eva'), 'shower-gel')
  assert.equal(c('Golden Rose correct&conceal camouflage palet', 'golden-rose'), 'palettes') // "palet" typo معروف
})

test('categorizeProduct: بيانات WooCommerce ليها الأولوية، والاستنتاج fallback بس ومتسجّل', () => {
  // 1) كل البيانات من Woo → مفيش استنتاج ولا مراجعة
  const full = categorizeProduct(
    'Essence Lash Princess Mascara',
    [{ slug: 'makeup', name: 'Makeup' }, { slug: 'mascara', name: 'Mascara' }, { slug: 'essence', name: 'Essence' }],
    []
  )
  assert.deepEqual([full.department, full.category, full.brand], ['makeup', 'mascara', 'Essence'])
  assert.deepEqual(full.needsReview, [])
  assert.deepEqual(full.inferred, [])

  // 2) براند من Woo + نوع من الاسم (K-beauty من غير category فرعي)
  const k = categorizeProduct(
    'Dr. Althea Vitamin C Boosting Serum 30ml',
    [{ slug: 'hair-and-skin-care', name: 'Hair and Skin Care' }],
    [{ name: 'Dr. Althea' }]
  )
  assert.deepEqual([k.department, k.category, k.brand], ['hair-and-skin-care', 'serum', 'Dr. Althea'])
  assert.deepEqual(k.needsReview, [])
  assert.deepEqual(k.inferred, ['category → serum (من الاسم)'])

  // 3) براند فيه & + اسم عرض صح
  const dg = categorizeProduct(
    'Dolce & Gabbana Dolce EDP Spray, 2.5oz/75ml',
    [{ slug: 'fragrance', name: 'Fragrance' }, { slug: 'edp', name: 'EDP' }],
    []
  )
  assert.equal(dg.brand, 'Dolce & Gabbana')
  assert.deepEqual(dg.needsReview, [])

  // 4) باقات المتجر: براند = علامة المتجر، مش "مفيش براند"
  const bag = categorizeProduct('Summer Bag - 7-BAGS-6 FOR 2026', [{ slug: 'leather', name: 'Leather' }, { slug: 'bags', name: 'Bags' }], [])
  assert.equal(bag.brand, 'So Much')
  assert.ok(!bag.needsReview.some((r) => r.startsWith('brand')))

  // 5) منتج مالوش أي دلالة: يفضل للمراجعة بالقيم الافتراضية (مش تخمين عشوائي)
  const junk = categorizeProduct('loli', [], [])
  assert.deepEqual([junk.department, junk.category, junk.brand], ['uncategorized', 'other', 'Unbranded'])
  assert.equal(junk.needsReview.length, 3)
})
