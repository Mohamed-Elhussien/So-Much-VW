// بيدوّر على منتج في الداتابيز (من غير ما يعدّي على الـ API) ويطبع حالته، عشان نعرف ليه صفحته مش بتفتح.
//   node src/scripts/find-product.js "I Love Extreme"      ← بحث بجزء من الاسم أو الـ slug
// ما بيكتبش أي حاجة.
require('dotenv').config()

const connectDB = require('../db')
const Product = require('../models/Product')

async function main() {
  const q = process.argv.slice(2).join(' ').trim()
  if (!q) {
    console.log('استخدام: node src/scripts/find-product.js "جزء من اسم المنتج"')
    process.exit(0)
  }
  await connectDB()

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(escaped, 'i')
  const docs = await Product.find({ $or: [{ name: re }, { slug: re }] })
    .select('wooId name slug price salePrice effectivePrice stock variants.colorName variants.available')
    .limit(8)
    .lean()

  if (docs.length === 0) console.log(`مفيش منتج في الداتابيز اسمه/slug شبه "${q}"`)
  for (const p of docs) {
    const vs = p.variants || []
    console.log(`\n${p.name}`)
    console.log(`  slug           : ${p.slug}`)
    console.log(`  wooId          : ${p.wooId ?? '(من غير wooId: ديمو؟)'}`)
    console.log(`  price / sale   : ${p.price} / ${p.salePrice ?? '-'}   (effective: ${p.effectivePrice})`)
    console.log(`  stock          : ${p.stock}`)
    console.log(`  شيدات          : ${vs.length} (متاح: ${vs.filter((v) => v.available).length})`)
    const visible = p.price > 0
    console.log(`  ظاهر في الـ API: ${visible ? '✅ آه' : '❌ لأ (السعر 0، المنتج مخفي ويرجّع 404)'}`)
    console.log(`  الرابط         : /product/${p.slug}`)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
