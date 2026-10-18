// ⚡ سكريبت تشخيص بس. بياخد اسم منتج (أو رقمه)، ويطبع كل الـ
// variations الخام بتاعته — الأسعار والـ attributes كاملة — عشان
// نتأكد هل اختلاف/تكرار السعر أو اللون حاجة حقيقية في بيانات
// WooCommerce، ولا في الطريقة اللي بنقرأها بيها.
//
// طريقة التشغيل:
//   node src/scripts/inspect-variations.js 51400
//   node src/scripts/inspect-variations.js "Amanda Better Than Butter"

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

  // ⚡ مش رقم، يبقى اسم — ندور عليه بالبحث المدمج في WooCommerce نفسه
  const results = await wooFetch(`/wp-json/wc/v3/products?search=${encodeURIComponent(input)}&per_page=5`)
  if (results.length === 0) {
    console.error(`❌ مفيش أي منتج بالاسم ده: "${input}"`)
    process.exit(1)
  }
  if (results.length > 1) {
    console.log(`لقينا أكتر من منتج مطابق، هناخد أول واحد. باقي النتائج:`)
    for (const r of results) console.log(`   [${r.id}] ${r.name}`)
  }
  return results[0].id
}

async function inspect() {
  const input = process.argv[2]
  if (!input) {
    console.error('❌ استخدم: node src/scripts/inspect-variations.js <id أو اسم المنتج>')
    process.exit(1)
  }

  const productId = await resolveProductId(input)
  const product = await wooFetch(`/wp-json/wc/v3/products/${productId}`)
  console.log(`\nالمنتج: [${product.id}] ${product.name}`)
  console.log(`النوع: ${product.type}`)
  console.log(
    `الـ attributes اللي المنتج معرّفها (كل اللي variation:true بيدخل في تركيبة كل variation):`
  )
  console.log(JSON.stringify(product.attributes, null, 2))

  if (product.type !== 'variable') {
    console.log('\n⚠️  المنتج ده مش variable — مفيش variations نتفحصها.')
    return
  }

  const variations = await wooFetch(`/wp-json/wc/v3/products/${productId}/variations?per_page=100`)
  console.log(`\nعدد الـ variations: ${variations.length}\n`)

  for (const v of variations) {
    console.log('─────────────────────────────')
    console.log('id:', v.id)
    console.log('attributes:', JSON.stringify(v.attributes))
    console.log('regular_price:', v.regular_price, '| sale_price:', v.sale_price)
    console.log('stock_status:', v.stock_status, '| stock_quantity:', v.stock_quantity)
    console.log('image:', v.image?.src ?? '(مفيش صورة خاصة — هيرجع لصورة المنتج العامة)')
  }
}

inspect().catch((err) => {
  console.error('❌ إيرور:', err.message)
  process.exit(1)
})