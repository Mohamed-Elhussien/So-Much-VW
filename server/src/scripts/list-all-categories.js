// ⚡ بيجيب كل الـ categories المستخدمة في المتجر كله (مش من منتج واحد
// بس) مع عدد المنتجات في كل واحدة (count) — عشان نبني جدول تحويل
// شامل لـ department مرة واحدة، بدل ما نكتشف فئة جديدة كل شوية.
//
// طريقة التشغيل: node src/scripts/list-all-categories.js

require('dotenv').config()

const WC_URL = process.env.WC_URL
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET
const AUTH = `Basic ${Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64')}`

async function wooFetch(path) {
  const url = `${WC_URL.replace(/\/$/, '')}${path}`
  const response = await fetch(url, { headers: { Authorization: AUTH } })
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`)
  return response.json()
}

async function listAll() {
  const perPage = 100
  let page = 1
  let all = []

  while (true) {
    // ⚡ orderby=count&order=desc: الفئات اللي فيها أكتر منتجات تظهر
    // الأول — دي الأهم نتأكد إن ليها department صح، عكس فئة نادرة
    // فيها منتج واحد بس.
    const batch = await wooFetch(
      `/wp-json/wc/v3/products/categories?per_page=${perPage}&page=${page}&orderby=count&order=desc`
    )
    all = all.concat(batch)
    if (batch.length < perPage) break
    page += 1
  }

  console.log(`إجمالي عدد الـ categories في المتجر: ${all.length}\n`)
  console.log('slug'.padEnd(35), 'name'.padEnd(30), 'عدد المنتجات')
  console.log('-'.repeat(80))
  for (const c of all) {
    console.log(c.slug.padEnd(35), c.name.padEnd(30), c.count)
  }
}

// ⚡ نفس الفكرة بالظبط لكن للبراندات — عشان نتأكد كام براند موجود
// ونعرف نتوقع شكل النتيجة النهائية.
async function listAllBrands() {
  const perPage = 100
  let page = 1
  let all = []

  while (true) {
    const batch = await wooFetch(`/wp-json/wc/v3/products/brands?per_page=${perPage}&page=${page}`)
    all = all.concat(batch)
    if (batch.length < perPage) break
    page += 1
  }

  console.log(`\n\nإجمالي عدد الـ brands في المتجر: ${all.length}\n`)
  console.log('slug'.padEnd(35), 'name'.padEnd(30), 'عدد المنتجات')
  console.log('-'.repeat(80))
  for (const b of all) {
    console.log(b.slug.padEnd(35), b.name.padEnd(30), b.count)
  }
}

listAll()
  .then(() =>
    // ⚡ رابط الـ brands ده تخمين (مش موثّق رسميًا زي categories) —
    // بيختلف حسب إضافة البراندات اللي بيستخدموها بالظبط. لو فشل، مش
    // مشكلة — الجزء المهم (categories) خلص بنجاح فوق خالص.
    listAllBrands().catch((err) => {
      console.log('\n⚠️  مقدرناش نجيب ليستة البراندات (الرابط مش شغال أو مختلف):', err.message)
      console.log('   مش مشكلة — عندنا فعلاً الـ brand جوه كل منتج لوحده من سكريبت المزامنة.')
    })
  )
  .catch((err) => {
    console.error('❌ إيرور:', err.message)
    process.exit(1)
  })