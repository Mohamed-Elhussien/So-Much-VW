// ⚡ سكريبت تشخيص بس. بيطبع الـ HTML الخام (من غير ما نشيل أي حاجة)
// لوصف منتج معين — عشان نشوف شكل العناوين/القوائم/الجدول الحقيقي
// قبل ما نبني parser يفصلهم لحقول منفصلة (keyBenefits, howToUse,
// suitableFor, specifications, faq).
//
// طريقة التشغيل:
//   node src/scripts/dump-raw-description.js 51400
//   node src/scripts/dump-raw-description.js "Cybele Desire Lipstick Pencil"

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

async function resolveProductId(input) {
  if (/^\d+$/.test(input)) return Number(input)
  const results = await wooFetch(`/wp-json/wc/v3/products?search=${encodeURIComponent(input)}&per_page=1`)
  if (results.length === 0) {
    console.error(`❌ مفيش منتج بالاسم ده: "${input}"`)
    process.exit(1)
  }
  return results[0].id
}

async function dump() {
  const input = process.argv[2]
  if (!input) {
    console.error('❌ استخدم: node src/scripts/dump-raw-description.js <id أو اسم المنتج>')
    process.exit(1)
  }

  const productId = await resolveProductId(input)
  const product = await wooFetch(`/wp-json/wc/v3/products/${productId}`)

  console.log(`المنتج: [${product.id}] ${product.name}\n`)
  console.log('===== description (خام، من غير أي تعديل) =====\n')
  console.log(product.description || '(فاضي)')
  console.log('\n===== short_description (خام) =====\n')
  console.log(product.short_description || '(فاضي)')
}

dump().catch((err) => {
  console.error('❌ إيرور:', err.message)
  process.exit(1)
})