// ⚡ سكريبت تشخيص بس. بنطبع الـ JSON الخام الكامل لمنتج واحد (مش
// الحقول المختارة بس زي سكريبت الاستكشاف الأول) — عشان نتأكد هل فيه
// حقل زي "brands" أو "tags" أو أي taxonomy تانية غفلنا عنها، لأن بعض
// إضافات WooCommerce بتضيف حقول زي دي منفصلة عن categories.
//
// طريقة التشغيل: node src/scripts/dump-raw-product.js <product_id>
// مثال: node src/scripts/dump-raw-product.js 29318

require('dotenv').config()

const WC_URL = process.env.WC_URL
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET

async function dump() {
  const productId = process.argv[2]
  if (!productId) {
    console.error('❌ استخدم: node src/scripts/dump-raw-product.js <product_id>')
    process.exit(1)
  }

  const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64')
  const url = `${WC_URL.replace(/\/$/, '')}/wp-json/wc/v3/products/${productId}`

  const response = await fetch(url, { headers: { Authorization: `Basic ${auth}` } })
  if (!response.ok) {
    console.error(`❌ فشل — status ${response.status}`)
    console.error(await response.text())
    process.exit(1)
  }

  const product = await response.json()

  // ⚡ بنطبع كل الحقول اللي أسماءها فيها إشارة لتصنيف/براند/تاج،
  // بالإضافة لكل أسماء الحقول الموجودة في الـ object كله (عشان نشوف
  // لو فيه حقل غريب معرفناهوش قبل كده).
  console.log('كل أسماء الحقول الموجودة في الرد:')
  console.log(Object.keys(product).join(', '))
  console.log('\n--- الحقول المتعلقة بتصنيف/براند تحديدًا ---')
  for (const key of Object.keys(product)) {
    if (/brand|categ|tag|attribute/i.test(key)) {
      console.log(`\n${key}:`, JSON.stringify(product[key], null, 2))
    }
  }
}

dump().catch((err) => {
  console.error('❌ إيرور:', err.message)
  process.exit(1)
})