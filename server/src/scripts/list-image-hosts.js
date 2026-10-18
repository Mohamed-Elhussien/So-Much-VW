// بيطبع دومينات صور المنتجات الفعلية في الداتابيز (مع العدد) عشان نضبط IMAGE_HOSTS
// في next.config.js. شغّله من مجلد server:  node src/scripts/list-image-hosts.js
require('dotenv').config()

const connectDB = require('../db')
const Product = require('../models/Product')

async function main() {
  await connectDB()

  const docs = await Product.find({}, { images: 1, 'variants.image': 1 }).lean()
  const counts = new Map()
  let invalid = 0

  const add = (url) => {
    if (!url) return
    try {
      const { protocol, hostname } = new URL(url)
      const key = `${protocol}//${hostname}`
      counts.set(key, (counts.get(key) || 0) + 1)
    } catch {
      invalid++
    }
  }

  for (const d of docs) {
    for (const img of d.images || []) add(img)
    for (const v of d.variants || []) add(v.image)
  }

  console.log('دومينات الصور في الداتابيز:\n')
  for (const [host, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(6)}  ${host}`)
  }
  if (invalid) console.log(`\n  (${invalid} رابط مش صالح)`)

  const hosts = [...counts.keys()].map((k) => k.replace(/^https?:\/\//, ''))
  const insecure = [...counts.keys()].filter((k) => k.startsWith('http:'))
  console.log(`\nحطّ ده في IMAGE_HOSTS (frontend/.env.local وفي Vercel):\n  IMAGE_HOSTS=${hosts.join(',')}`)
  if (insecure.length) {
    console.log(`\n⚠️  دومينات على http (مش https): ${insecure.join(', ')} — next.config.js بيسمح بـ https بس.`)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
