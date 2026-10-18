// ⚡ سكريبت تنظيف بيشتغل مرة واحدة بس. بيمسح كل منتج مالوش wooId —
// يعني منتجات الديمو الوهمية القديمة (اتعملها seed زمان) — وبيسيب
// أي منتج حقيقي جاي من WooCommerce (وليه wooId).
//
// ⚡ بيسألك تأكيد قبل ما يمسح أي حاجة — مفيش مسح تلقائي بصمت.
//
// طريقة التشغيل: node src/scripts/remove-demo-products.js

require('dotenv').config()
const readline = require('node:readline')

const connectDB = require('../db')
const Product = require('../models/Product')

async function cleanup() {
  await connectDB()

  const demoCount = await Product.countDocuments({ wooId: { $exists: false } })
  const realCount = await Product.countDocuments({ wooId: { $exists: true } })

  console.log(`منتجات ديمو (هتتمسح): ${demoCount}`)
  console.log(`منتجات حقيقية من WooCommerce (هتفضل زي ما هي): ${realCount}\n`)

  if (demoCount === 0) {
    console.log('✅ مفيش منتجات ديمو خالص — الداتابيز نضيفة بالفعل.')
    process.exit(0)
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  rl.question(`متأكد عايز تمسح الـ ${demoCount} منتج ديمو؟ (اكتب yes للتأكيد): `, async (answer) => {
    if (answer.trim().toLowerCase() !== 'yes') {
      console.log('❌ اتلغى — مفيش حاجة اتمسحت.')
      rl.close()
      process.exit(0)
    }

    const result = await Product.deleteMany({ wooId: { $exists: false } })
    console.log(`\n✅ اتمسح ${result.deletedCount} منتج ديمو. الـ ${realCount} منتج الحقيقي فضلوا زي ما هم.`)
    rl.close()
    process.exit(0)
  })
}

cleanup().catch((err) => {
  console.error('❌ إيرور:', err.message)
  process.exit(1)
})