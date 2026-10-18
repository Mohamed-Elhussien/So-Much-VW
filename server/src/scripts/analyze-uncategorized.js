// ⚡ سكريبت تشخيص بس — بيشتغل على الداتا اللي عندك بالفعل في
// MongoDB (بعد المزامنة)، مش بيعمل أي طلب لـ WooCommerce. الهدف:
// نعرف المنتجات اللي وقعت في department='uncategorized'، وأكتر
// إيه (البراند أو الاسم) متكرر بينهم — عشان نوسّع جدول
// DEPARTMENT_BY_SLUG بناءً على بيانات حقيقية، مش تخمين.
//
// ⚡ ملحوظة مهمة: الـ categories الخام نفسها مش متخزنة في الـ
// schema بتاعنا (احنا بنخزن بس النتيجة النهائية: department/
// category/brand). عشان كده السكريبت ده بيرجع يسأل WooCommerce
// تاني عن الـ categories الخام لكل منتج "uncategorized" بس (مش كل
// الـ 1825)، عشان نحلل الشكل الحقيقي للمشكلة.
//
// طريقة التشغيل: node src/scripts/analyze-uncategorized.js

require('dotenv').config()

const connectDB = require('../db')
const Product = require('../models/Product')

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

async function analyze() {
  await connectDB()

  const uncategorized = await Product.find({ department: 'uncategorized', wooId: { $exists: true } })
    .select('wooId name brand')
    .lean()

  console.log(`عدد المنتجات الحقيقية الواقعة في "uncategorized": ${uncategorized.length}\n`)

  if (uncategorized.length === 0) {
    console.log('✅ مفيش حاجة، كل المنتجات اتصنّفت.')
    process.exit(0)
  }

  // ⚡ بنسأل WooCommerce عن الـ categories الخام لكل منتج من دول —
  // عدد الطلبات = عدد المنتجات الـ uncategorized بس (مش كل الكتالوج)
  const categoryCounts = new Map() // slug -> count
  let processed = 0

  for (const p of uncategorized) {
    process.stdout.write(`\r بنحلل [${++processed}/${uncategorized.length}]`)
    try {
      const wooProduct = await wooFetch(`/wp-json/wc/v3/products/${p.wooId}`)
      for (const cat of wooProduct.categories || []) {
        categoryCounts.set(cat.slug, (categoryCounts.get(cat.slug) || 0) + 1)
      }
    } catch {
      // منتج واحد فشل مش لازم يوقف التحليل كله
    }
  }

  console.log('\n\nأكتر categories متكررة بين المنتجات التايهة دي (مرتبة تنازليًا):\n')
  const sorted = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])
  for (const [slug, count] of sorted) {
    console.log(`${String(count).padStart(4)}  ${slug}`)
  }

  console.log(
    '\n💡 الأرقام العالية دي هي المرشحين الأقوى تتضاف لـ DEPARTMENT_BY_SLUG في wooCategoryMap.js.'
  )
  process.exit(0)
}

analyze().catch((err) => {
  console.error('❌ إيرور:', err.message)
  process.exit(1)
})