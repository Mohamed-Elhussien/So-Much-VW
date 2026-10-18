'use client'

import { useEffect, useState } from 'react'

// ⚡ NEXT_PUBLIC_ لازم هنا لأن الطلب دلوقتي بيحصل من متصفح المستخدم
// (Client Component) مش من سيرفر Next.js — العكس بالظبط من فكرة
// API_URL اللي كانت متعمولة للـ Server Components. لازم تحط
// NEXT_PUBLIC_API_URL في .env.local (شوف .env.local.example).
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// ⚡ كاش بسيط في الذاكرة (Map) بعمر قصير (30 ثانية). لو المستخدم راح
// "Make Up" بعدين "Fragrance" بعدين رجع "Make Up" تاني خلال نص
// دقيقة، مفيش داعي نضرب الـ API تاني بنفس الطلب بالظبط — الداتا
// مش هتتغيّر في ثوانٍ. الكاش ده module-level (مش useState) عشان
// يفضل موجود حتى لو المكوّن اتشال وتبنى تاني (تنقل بين الصفحات).
const CACHE_TTL_MS = 30_000
const cache = new Map()

function getCached(key) {
  const hit = cache.get(key)
  if (!hit) return undefined
  if (Date.now() - hit.time > CACHE_TTL_MS) {
    cache.delete(key)
    return undefined
  }
  return hit.value
}

function setCached(key, value) {
  cache.set(key, { value, time: Date.now() })
}

// ⚡ Hook واحد مشترك لأي مكان بيعرض ليستة منتجات (Offers,
// CategorySection, صفحة /shop) — بدل ما نكرر نفس منطق الـ
// fetch/loading/error/pagination/caching في كل مكون لوحده.
//
// ⚡ ليه بقى client-side دلوقتي مش Server Component: في بيئة التشغيل
// الحالية، fetch من جوه Node (Server Component وقت الـ SSR) كان
// بيفشل بخطأ شبكي عام حتى لو نفس الـ URL شغال 100% لما تتفتح من
// المتصفح مباشرة — غالبًا بسبب عزل شبكي بين عملية Next.js وعملية
// Express جوه بيئة التطوير الحالية. الحل الأضمن هو إن الطلب يتبعت من
// المتصفح زي أي طلب عادي.
export function useProducts(query) {
  const cacheKey = `list:${query}`
  const cached = getCached(cacheKey)

  const [state, setState] = useState(
    cached
      ? { products: cached.products, pagination: cached.pagination, loading: false, error: null }
      : { products: [], pagination: null, loading: true, error: null }
  )

  useEffect(() => {
    const fromCache = getCached(cacheKey)
    if (fromCache) {
      setState({ products: fromCache.products, pagination: fromCache.pagination, loading: false, error: null })
      return
    }

    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true }))

    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/products?${query}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error(`API responded with ${res.status}`)
        }

        const json = await res.json()
        const value = { products: json.data ?? [], pagination: json.pagination ?? null }
        setCached(cacheKey, value)
        setState({ ...value, loading: false, error: null })
      } catch (err) {
        if (err.name === 'AbortError') return
        console.error(`[useProducts] failed to fetch "${query}":`, err)
        setState({ products: [], pagination: null, loading: false, error: err })
      }
    }

    load()

    // ⚡ لو المكون اتشال من الشاشة قبل ما الطلب يخلص (مثلاً المستخدم
    // نقل صفحة بسرعة)، بنلغي الطلب عشان مانعملش setState على مكون
    // مبقاش موجود (تسريب ذاكرة/تحذير React).
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return state
}

// ⚡ نفس الفكرة بالظبط (fetch + كاش) بس لمنتج واحد — بتُستخدم في
// صفحة تفاصيل المنتج (/product/[slug]) اللي بتجيب المنتج بالـ slug
// بتاعه، وفي "Related Products" جوه نفس الصفحة كمان.
export function useProduct(slug) {
  const cacheKey = `product:${slug}`
  const cached = getCached(cacheKey)

  const [state, setState] = useState(
    cached ? { product: cached, loading: false, error: null } : { product: null, loading: true, error: null }
  )

  useEffect(() => {
    if (!slug) return

    const fromCache = getCached(cacheKey)
    if (fromCache) {
      setState({ product: fromCache, loading: false, error: null })
      return
    }

    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true }))

    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/products/slug/${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        })

        if (res.status === 404) {
          setState({ product: null, loading: false, error: null })
          return
        }

        if (!res.ok) {
          throw new Error(`API responded with ${res.status}`)
        }

        const product = await res.json()
        setCached(cacheKey, product)
        setState({ product, loading: false, error: null })
      } catch (err) {
        if (err.name === 'AbortError') return
        console.error(`[useProduct] failed to fetch "${slug}":`, err)
        setState({ product: null, loading: false, error: err })
      }
    }

    load()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  return state
}
