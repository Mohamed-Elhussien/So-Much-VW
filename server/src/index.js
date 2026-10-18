require('dotenv').config()

// ⚡ لو السيرفر وقع (استثناء غير ملتقط أو promise اتعمله reject من غير catch): بنكتب السبب بوضوح في الترمنال
// **وفي ملف server/crash.log**، عشان الدليل ما يضيعش لو الترمنال اتقفل أو اتمسح. (Node بيطبع الخطأ
// برضه، بس في وضع --watch بيتغطّى برسالة "Waiting for file changes".) الملف ده ما بيترفعش على Git.
const fs = require('fs')
const path = require('path')

function logFatal(kind, err) {
  const text = `[${new Date().toISOString()}] ${kind}: ${err?.stack || err}\n`
  console.error(`\n💥💥💥 السيرفر هيقف بسبب:\n${text}`)
  try {
    fs.appendFileSync(path.join(__dirname, '../crash.log'), text)
  } catch {
    /* مش مشكلة لو ما قدرناش نكتب الملف */
  }
}
process.on('uncaughtException', (err) => {
  logFatal('uncaughtException', err)
  process.exit(1)
})
process.on('unhandledRejection', (reason) => {
  logFatal('unhandledRejection', reason)
  process.exit(1)
})

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const connectDB = require('./db')
const productsRouter = require('./routes/products')
const ordersRouter = require('./routes/orders')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// ⚡ خلف proxy (Render/Railway/Vercel...) لازم نضبط TRUST_PROXY=1 عشان الـ rate limit
// يشوف الـ IP الحقيقي للعميل مش IP الـ proxy.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY))

// ⚡ دلوقتي الفرونت إند بيعمل fetch للـ API من متصفح المستخدم مباشرة
// (Client Component) مش من سيرفر Next.js، يعني الـ CORS بقى فعليًا
// مهم (قبل كده كان Node-to-Node، والـ CORS مبيتفعّلش أصلاً على طلبات
// السيرفر لبعضه، بس على طلبات المتصفح). localhost و 127.0.0.1
// بيتحسبوا origins مختلفين تمامًا للمتصفح حتى لو نفس الجهاز، فلازم
// الاتنين يكونوا مسموحين صراحة. CLIENT_ORIGIN لو محتاج origin إضافي
// (زي دومين staging) ممكن يتحط كقيمة واحدة أو list مفصولة بفواصل.
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim()) : []),
]

const warnedOrigins = new Set()

// ⚡ CORS لازم يكون أول middleware: أي خطأ بعده (body كبير، JSON غلط...) لازم يرجع ومعاه headers الـ CORS،
// وإلا المتصفح بيعرضه "مشكلة اتصال" من غير ما يقول السبب الحقيقي.
app.use(
  cors({
    origin(origin, callback) {
      // origin بيكون undefined لطلبات من غير متصفح (curl, Postman, سيرفر-لسيرفر): مسموحة.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)

      // ⚡ مش بنرمي error (كان بيطلع 500 من غير headers): بنرفض بس، ونكتب في اللوج السبب مرة واحدة.
      if (!warnedOrigins.has(origin)) {
        warnedOrigins.add(origin)
        console.warn(`[cors] ❌ origin مش مسموح: ${origin}  ← ضيفه في CLIENT_ORIGIN (الحالي: ${allowedOrigins.join(', ')})`)
      }
      callback(null, false)
    },
  })
)

app.use(helmet())
// حد أقصى لحجم الـ body (الأوردر الطبيعي أقل من 5KB)
app.use(express.json({ limit: '20kb' }))

// لوج بسيط لطلبات الأوردر: لو الأوردر فشل في المتصفح ومفيش سطر هنا = الطلب ما وصلش السيرفر أصلاً.
app.use('/api/orders', (req, res, next) => {
  console.log(`[http] ${req.method} ${req.originalUrl} origin=${req.headers.origin ?? '-'}`)
  next()
})

app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// ⚡ لازم يكون آخر middleware مضاف — بيمسك أي error اتعمله next(err)
// في أي route قبله
app.use(errorHandler)

const PORT = process.env.PORT || 4000

connectDB()
  .then(() => {
    // ⚡ 0.0.0.0 بدل الافتراضي عشان السيرفر يقبل اتصالات من أي واجهة
    // شبكة على الجهاز (مش بس 127.0.0.1) — مفيد لو بتفتح الموقع من
    // جهاز/كونتينر تاني على نفس الشبكة.
    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`))
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message)
    process.exit(1)
  })
