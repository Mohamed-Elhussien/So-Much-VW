'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductImage from '@/components/ProductImage'
import { buildShopHref } from '@/lib/buildShopHref'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// ⚡ نستنى المستخدم يوقف عن الكتابة 250ms قبل ما نبعت أي طلب — من
// غير debounce، كل ضغطة زرار (كل حرف) هتبعت طلب API لوحدها، يعني
// كتابة "cybele" هتبعت 6 طلبات بدل طلب واحد أو اتنين. أهم تحسين أداء
// واحد ممكن يتعمل لأي خانة بحث Live زي دي.
const DEBOUNCE_MS = 250

// ⚡ أقل عدد حروف قبل ما نبدأ نبحث خالص — حرف واحد أو اتنين هيرجعوا
// نتايج كتير جدًا ومش مفيدة، وبيبعت طلبات على الفاضي.
const MIN_CHARS = 2

// props:
// - variant: 'desktop' | 'mobile' — يفرق بس في شكل الـ input نفسه
// - onNavigate: بيتنادى لما المستخدم يدوس على نتيجة أو "See all
//   results" — الـ Navbar بيستخدمها يقفل قايمة الموبايل / يطبق
//   الـ search bar تاني بعد الانتقال
export default function SearchAutocomplete({ variant = 'desktop', onNavigate }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < MIN_CHARS) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/products/search?q=${encodeURIComponent(trimmed)}&limit=6`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error(`API responded with ${res.status}`)
        const json = await res.json()
        setResults(json.data ?? [])
      } catch (err) {
        if (err.name === 'AbortError') return
        console.error('[SearchAutocomplete] failed to fetch:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    // ⚡ لو المستخدم كتب حرف تاني قبل ما الـ 250ms تخلص، أو المكوّن
    // اتشال، بنلغي كل من الـ timer والطلب الجاري — من غير ده ممكن
    // ترد نتيجة قديمة (لبحث سابق) بعد نتيجة أحدث منها وتفضل ظاهرة
    // غلط (race condition كلاسيكي في أي typeahead).
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function goToAllResults() {
    const trimmed = query.trim()
    if (!trimmed) return
    setOpen(false)
    onNavigate?.()
    router.push(buildShopHref({ search: trimmed }))
  }

  function handleSelectResult() {
    setOpen(false)
    setQuery('')
    onNavigate?.()
  }

  const showDropdown = open && query.trim().length >= MIN_CHARS

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          goToAllResults()
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search products…"
          autoComplete="off"
          autoFocus={variant === 'desktop'}
          className={
            variant === 'desktop'
              ? 'w-[220px] rounded-full border border-ink/15 bg-surface/80 px-4 py-2 text-sm text-ink outline-none focus:border-gold'
              : 'w-full rounded-full border border-ink/15 bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-gold'
          }
        />
      </form>

      {showDropdown && (
        <div className="nav-panel-solid absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl shadow-glow">
          {loading ? (
            <p className="p-4 text-sm text-ink/50">Searching…</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-ink/50">No products found for &quot;{query.trim()}&quot;</p>
          ) : (
            <>
              <ul>
                {results.map((p) => {
                  const thumbnail = p.variants?.find((v) => v.image)?.image ?? null
                  const onSale = p.salePrice != null
                  return (
                    <li key={p.slug}>
                      <Link
                        href={`/product/${p.slug}`}
                        onClick={handleSelectResult}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-ink/5"
                      >
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
                          <ProductImage src={thumbnail} alt={p.name} tone={p.tone} sizes="40px" />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">{p.name}</span>
                        <span className="flex-shrink-0 text-xs font-semibold text-ink/60">
                          {onSale ? `EGP ${p.salePrice}` : `EGP ${p.price}`}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <button
                onClick={goToAllResults}
                className="block w-full border-t border-ink/10 px-4 py-2.5 text-left text-sm font-semibold text-gold-dark hover:bg-ink/5"
              >
                See all results for &quot;{query.trim()}&quot; →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
