// ⚡ سكريبت اختبار بس — مش جزء من الكود النهائي. الهدف الوحيد: نتأكد
// إن مفاتيح الـ API شغالة وإن الموقع بيرد قبل ما نبني أي كود مزامنة
// حقيقي فوقه.
//
// طريقة التشغيل: node src/scripts/test-woocommerce-connection.js
// (من جوه مجلد server، وبعد ما تضيف الثلاث سطور دول في .env)

require('dotenv').config()

const WC_URL = process.env.WC_URL // مثال: https://test1.somuchstores.com
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET

async function testConnection() {
  if (!WC_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    console.error('❌ WC_URL / WC_CONSUMER_KEY / WC_CONSUMER_SECRET ناقصين في .env')
    process.exit(1)
  }

  // ⚡ WooCommerce REST API بيقبل الـ Basic Auth بالـ Consumer Key/Secret
  // طول ما الموقع https — أبسط من OAuth 1.0a اللي بيتاستخدم مع http بس.
  const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64')
  const url = `${WC_URL.replace(/\/$/, '')}/wp-json/wc/v3/products?per_page=1`

  console.log('🔌 بنحاول نتصل بـ:', url)

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
    })

    if (!response.ok) {
      const body = await response.text()
      console.error(`❌ فشل الاتصال — status ${response.status}`)
      console.error(body)
      process.exit(1)
    }

    const products = await response.json()
    console.log('✅ الاتصال شغال! عدد المنتجات في الرد:', products.length)
    if (products.length > 0) {
      console.log('   أول منتج:', {
        id: products[0].id,
        name: products[0].name,
        price: products[0].price,
      })
    } else {
      console.log('   ⚠️ الرد فاضي — يعني الموقع مفيهوش منتجات لسه، مش مشكلة في الاتصال.')
    }
  } catch (err) {
    console.error('❌ إيرور في الاتصال نفسه (شبكة/رابط غلط):', err.message)
    process.exit(1)
  }
}

testConnection()