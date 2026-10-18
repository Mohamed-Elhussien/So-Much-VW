'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// ⚡ فلتر السعر الوحيد المستخدم في أي صفحة بتعرض ليستة منتجات (حاليًا
// /shop فقط — الهوم بيها فقط سكاشن ترويجية، مش صفحة فلترة، فمش محتاجة
// الكومبوننت ده). بيقرأ/يكتب minPrice و maxPrice في الـ URL query
// string زي باقي الفلاتر بالظبط (department/category/brand...)، عشان
// يفضل الرابط نفسه قابل للمشاركة ورجوع المتصفح (back/forward) يشتغل
// صح من غير أي state إضافي.
//
// ⚡ ليه فيه زرار "Apply" بدل ما نفلتر مع كل ضغطة كيبورد: كل تغيير في
// الـ URL بيعمل طلب جديد للـ API (useProducts بيعتمد على الـ query
// string كـ dependency). فلترة على كل حرف/رقم هتبعت طلبات كتير من غير
// داعي وهي لسه بتكتب الرقم. الزرار (+ Enter) بيخلي طلب واحد بس لما
// المستخدم يخلص كتابة الرينج اللي عايزه.
export default function PriceFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlMin = searchParams.get('minPrice') || ''
  const urlMax = searchParams.get('maxPrice') || ''

  const [minPrice, setMinPrice] = useState(urlMin)
  const [maxPrice, setMaxPrice] = useState(urlMax)

  // ⚡ لو المستخدم مسح الفلاتر كلها من مكان تاني (زرار "Clear
  // filters") أو استخدم رجوع المتصفح، الـ inputs المحلية دي لازم
  // تتزامن مع القيمة الجديدة في الـ URL بدل ما تفضل شايلة رقم قديم.
  useEffect(() => {
    setMinPrice(urlMin)
    setMaxPrice(urlMax)
  }, [urlMin, urlMax])

  const hasRange = Boolean(urlMin || urlMax)

  function applyRange(nextMinRaw, nextMaxRaw) {
    const params = new URLSearchParams(searchParams.toString())
    nextMinRaw ? params.set('minPrice', nextMinRaw) : params.delete('minPrice')
    nextMaxRaw ? params.set('maxPrice', nextMaxRaw) : params.delete('maxPrice')
    // ⚡ أي تغيير في الفلتر لازم يرجّع الصفحة لـ 1 — لو المستخدم واقف
    // في صفحة 4 وغيّر السعر، مفيش ضمان إن صفحة 4 لسه موجودة أصلاً في
    // النتائج الجديدة.
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const min = minPrice.trim()
    const max = maxPrice.trim()

    // ⚡ لو المستخدم كتب أقل أكبر من أكبر بالغلط، بنبدلهم بدل ما
    // الفلتر يرجع صفر نتائج من غير أي تفسير ليه.
    if (min && max && Number(min) > Number(max)) {
      setMinPrice(max)
      setMaxPrice(min)
      applyRange(max, min)
      return
    }

    applyRange(min, max)
  }

  function handleClear() {
    setMinPrice('')
    setMaxPrice('')
    applyRange('', '')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-ink/10 bg-surface/60 p-4"
      role="search"
      aria-label="Filter by price"
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink/70">Min price (EGP)</span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          placeholder="0"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-28 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink/70">Max price (EGP)</span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          placeholder="Any"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-28 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
      </label>

      <button
        type="submit"
        className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-cream transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Apply
      </button>

      {hasRange && (
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-medium text-ink/60 underline underline-offset-4 hover:text-ink"
        >
          Clear price
        </button>
      )}
    </form>
  )
}
