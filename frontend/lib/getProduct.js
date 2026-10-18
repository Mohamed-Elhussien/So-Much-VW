// ⚡ للـ Server Components بس. بيرجّع status صريح:
//   ok        ← المنتج
//   not-found ← الـ API رد 404 فعلاً (المنتج مش موجود أو مخفي لأن سعره 0)
//   error     ← فشل شبكة/سيرفر ← الصفحة بترجع للـ CSR بدل ما تقول "مش موجود" غلط
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL

class NotFoundError extends Error {
  constructor() {
    super('not found')
    this.name = 'NotFoundError'
  }
}

async function fetchProduct(slug) {
  if (!API_URL) {
    // في production نفشل بصوت عالي بدل ما نفترض localhost
    if (process.env.NODE_ENV === 'production') throw new Error('API_URL is not set')
    throw new Error('API_URL غير مضبوط في frontend/.env.local')
  }

  const url = `${API_URL.replace(/\/+$/, '')}/api/products/slug/${encodeURIComponent(slug)}`
  let res
  try {
    res = await fetch(url, { cache: 'no-store' })
  } catch (err) {
    console.error(`[getProduct] ❌ الاتصال بالـ API فشل: ${url} (${err?.message})`)
    throw err
  }

  if (res.status === 404) {
    console.warn(`[getProduct] الـ API رد 404 لـ ${url}`)
    throw new NotFoundError()
  }
  if (!res.ok) {
    console.error(`[getProduct] ❌ الـ API رد ${res.status} لـ ${url}`)
    throw new Error(`API responded ${res.status}`)
  }
  return res.json()
}

// ⚡ كاش 5 دقايق (ISR) **للنجاح بس**. unstable_cache ما بتخزّنش لو الدالة رمت error، فـ 404 أو فشل
// عابر ما يتكاشوش (بعكس fetch مع revalidate اللي ممكن يخزّن رد 404/5xx). والـ tags جاهزة
// لـ revalidateTag(`product:${slug}`) من الـ webhooks.
const fetchCached = (slug) =>
  unstable_cache(() => fetchProduct(slug), ['product', slug], {
    revalidate: 300,
    tags: ['products', `product:${slug}`],
  })()

// React cache: generateMetadata والصفحة بينادوا نفس الدالة في نفس الطلب، فبتتنفّذ مرة واحدة.
export const getProduct = cache(async (slug) => {
  try {
    // في التطوير: دايمًا طازج (من غير كاش)، عشان أي تغيير بعد sync يظهر فورًا
    const product = process.env.NODE_ENV === 'production' ? await fetchCached(slug) : await fetchProduct(slug)
    return { status: 'ok', product }
  } catch (err) {
    if (err?.name === 'NotFoundError') return { status: 'not-found' }
    return { status: 'error' }
  }
})
