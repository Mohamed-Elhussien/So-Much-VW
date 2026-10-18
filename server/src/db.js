// ⚡ FORCE_GOOGLE_DNS بيتفعّل بس لو محتاجه صراحة (env var). ده حل
// دايجست لمشكلة DNS resolution في بيئة الـ dev sandbox الحالية —
// مش المفروض يتفعّل في أي بيئة تانية (staging/production) من غير
// قصد، لأنه بيغيّر الـ DNS resolver لكل الـ process مش بس لاتصال
// MongoDB، وممكن يكسر شبكات فيها proxy/firewall شركة أو DNS داخلي.
if (process.env.FORCE_GOOGLE_DNS === 'true') {
  const dns = require('node:dns')
  dns.setServers(['8.8.8.8', '8.8.4.4'])
}

const mongoose = require('mongoose')

async function connectDB() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('MONGODB_URI is missing — check your .env file')
  }

  await mongoose.connect(uri)
  console.log('✅ MongoDB connected')
}

module.exports = connectDB