// ⚡ سكريبت استكشاف بس (مش جزء من الكود النهائي). الهدف: نشوف الشكل
// الحقيقي الكامل لمنتجات متجرهم (categories, attributes, images,
// stock) قبل ما نقرر إزاي نحوّل كل حقل لحقل الـ Product schema بتاعنا.
// بدون الخطوة دي، أي مزامنة هنكتبها هتبقى تخمين.
//
// طريقة التشغيل: node src/scripts/explore-woocommerce-products.js

require('dotenv').config()

const WC_URL = process.env.WC_URL
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET

async function explore() {
  const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64')
  // ⚡ per_page=5 بس عشان نشوف عينة كفاية من غير ما نغرق نفسنا في
  // ناتج ضخم — الهدف نفهم الشكل، مش نعالج الداتا كلها دلوقتي.
  const url = `${WC_URL.replace(/\/$/, '')}/wp-json/wc/v3/products?per_page=5`

  const response = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
  })

  if (!response.ok) {
    console.error(`❌ فشل الطلب — status ${response.status}`)
    console.error(await response.text())
    process.exit(1)
  }

  const products = await response.json()
  console.log(`📦 عدد المنتجات اللي رجعت: ${products.length}\n`)

  for (const p of products) {
    // ⚡ بنطبع بس الحقول اللي هتهمنا في الـ mapping — مش الـ object
    // الكامل (فيه حاجات كتير زي meta_data الطويلة مش لازمانا دلوقتي).
    console.log('─────────────────────────────')
    console.log('id:', p.id)
    console.log('name:', p.name)
    console.log('type:', p.type) // simple | variable | ...
    console.log('regular_price:', p.regular_price)
    console.log('sale_price:', p.sale_price)
    console.log('stock_quantity:', p.stock_quantity)
    console.log('stock_status:', p.stock_status)
    console.log('categories:', p.categories) // [{id, name, slug}]
    console.log('images:', p.images?.map((img) => img.src))
    console.log('attributes:', JSON.stringify(p.attributes, null, 2)) // لون/مقاس لو موجودين
    console.log('description (أول 100 حرف):', (p.description || '').replace(/<[^>]+>/g, '').slice(0, 100))
  }
}

explore().catch((err) => {
  console.error('❌ إيرور:', err.message)
  process.exit(1)
})