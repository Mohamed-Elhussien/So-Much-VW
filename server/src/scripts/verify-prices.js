// بيقارن أسعار الموقع (MongoDB) بالأسعار الحيّة في WooCommerce لكل المنتجات والشيدات،
// ويفحص التناسق الداخلي (مثلاً سعر الخصم أقل من الأصلي). ما بيكتبش أي حاجة.
//   node src/scripts/verify-prices.js
// التقرير الكامل: server/price-report.txt (ما ترفعوش على Git)
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const connectDB = require('../db')
const Product = require('../models/Product')
const { wooRequest } = require('../lib/woo')
const { compareProduct } = require('../lib/priceCheck')

const CONCURRENCY = 5

async function fetchAllWooProducts() {
  let all = []
  for (let page = 1; ; page++) {
    const batch = await wooRequest('GET', `/wp-json/wc/v3/products?per_page=100&page=${page}`)
    all = all.concat(batch)
    if (batch.length < 100) break
  }
  return all.filter((p) => p.status === 'publish')
}

async function main() {
  await connectDB()
  console.log('📥 بنجيب المنتجات من WooCommerce...')
  const wooProducts = await fetchAllWooProducts()
  console.log(`   ${wooProducts.length} منتج منشور. بنقارن...\n`)

  const docs = await Product.find({ wooId: { $in: wooProducts.map((p) => p.id) } })
    .select('wooId name price salePrice effectivePrice variants')
    .lean()
  const byWooId = new Map(docs.map((d) => [d.wooId, d]))

  const problems = []
  let checked = 0

  async function check(woo) {
    const variations = woo.type === 'variable'
      ? await wooRequest('GET', `/wp-json/wc/v3/products/${woo.id}/variations?per_page=100`)
      : null
    const issues = compareProduct(woo, variations, byWooId.get(woo.id))
    if (issues.length) problems.push({ id: woo.id, name: woo.name, issues })
    process.stdout.write(`\r[${++checked}/${wooProducts.length}]`)
  }

  const queue = [...wooProducts]
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) await check(queue.shift())
    })
  )

  const kinds = {}
  for (const p of problems) for (const i of p.issues) {
    const k = i.split(' ')[0]
    kinds[k] = (kinds[k] || 0) + 1
  }

  const lines = [`منتجات فيها مشاكل: ${problems.length} من ${wooProducts.length}`, '']
  for (const p of problems) {
    lines.push(`[${p.id}] ${p.name}`)
    for (const i of p.issues) lines.push(`   - ${i}`)
  }
  const reportPath = path.join(__dirname, '../../price-report.txt')
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8')

  console.log('\n')
  if (problems.length === 0) {
    console.log(`✅ كل أسعار ${wooProducts.length} منتج (والشيدات) مطابقة لـ WooCommerce.`)
  } else {
    console.log(`⚠️  ${problems.length} منتج فيه مشاكل أسعار:`)
    for (const [k, n] of Object.entries(kinds).sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(5)}  ${k}`)
    console.log('\nأول 15:')
    for (const p of problems.slice(0, 15)) console.log(`   [${p.id}] ${p.name.slice(0, 50)}  →  ${p.issues[0]}`)
    console.log(`\n📄 التقرير الكامل: ${reportPath}`)
    console.log('لو "price_mismatch" أو "base_price_not_cheapest" ظهروا: شغّل الـ sync الجديد وأعد الفحص.')
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('\n❌', err.message)
  process.exit(1)
})
