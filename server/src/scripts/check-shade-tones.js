// بيتأكد إن كل شيد جوه نفس المنتج له لون مختلف (بعد تشغيل الـ sync الجديد).
//   node src/scripts/check-shade-tones.js                   → ملخص لكل المنتجات
//   node src/scripts/check-shade-tones.js "Cybele Desire"   → ألوان منتج معيّن (بحث بالاسم)
// ما بيكتبش أي حاجة في الداتابيز.
require('dotenv').config()

const connectDB = require('../db')
const Product = require('../models/Product')

async function main() {
  await connectDB()
  const query = process.argv[2]

  if (query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const products = await Product.find({ name: new RegExp(escaped, 'i') })
      .select('name slug variants.colorName variants.tone')
      .limit(5)
      .lean()
    if (products.length === 0) console.log(`مفيش منتج اسمه شبه "${query}"`)
    for (const p of products) {
      const tones = (p.variants || []).map((v) => v.tone)
      console.log(`\n${p.name}  (${p.slug})`)
      console.log(`  شيدات: ${tones.length} | ألوان مختلفة: ${new Set(tones).size}`)
      for (const v of p.variants || []) console.log(`    ${v.tone}  ${v.colorName}`)
    }
    process.exit(0)
  }

  const products = await Product.find({ 'variants.0': { $exists: true } })
    .select('name variants.tone')
    .lean()

  let withDuplicates = 0
  let maxVariants = 0
  const samples = []
  for (const p of products) {
    const tones = p.variants.map((v) => v.tone)
    maxVariants = Math.max(maxVariants, tones.length)
    if (new Set(tones).size !== tones.length) {
      withDuplicates++
      if (samples.length < 10) samples.push(`${p.name} (${new Set(tones).size} لون لـ ${tones.length} شيد)`)
    }
  }

  console.log(`منتجات فيها شيدات: ${products.length} | أكتر عدد شيدات في منتج: ${maxVariants}`)
  if (withDuplicates === 0) {
    console.log('✅ كل شيدات كل منتج ألوانها مختلفة.')
  } else {
    console.log(`⚠️  ${withDuplicates} منتج فيه ألوان مكررة (غالبًا الـ sync القديم هو اللي اشتغل):`)
    for (const s of samples) console.log('   -', s)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
