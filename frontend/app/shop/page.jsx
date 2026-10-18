'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import PriceFilter from '@/components/PriceFilter'
import { useProducts } from '@/lib/useProducts'
import { getCategoryLabel } from '@/lib/categories'

// ⚡ صفحة واحدة بس لكل المتجر — مفيش صفحة منفصلة لكل تصنيف/براند.
// كل لينك في الـ Navbar (والـ Categories في الهوم) بيوصل هنا بفلاتر
// مختلفة في query string (?department=makeup&category=lipstick...).
// الـ API endpoint نفسه (/api/products) أصلاً مبني عشان يقبل أي
// تركيبة من الفلاتر دي مع بعض.

function toTitle(slug) {
  return String(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildQueryString({ department, category, brand, search, onSale, minPrice, maxPrice, page }) {
  const params = new URLSearchParams()
  if (department) params.set('department', department)
  if (category) params.set('category', category)
  if (brand) params.set('brand', brand)
  if (search) params.set('search', search)
  if (onSale) params.set('onSale', 'true')
  if (minPrice) params.set('minPrice', minPrice)
  if (maxPrice) params.set('maxPrice', maxPrice)
  params.set('page', String(page))
  params.set('limit', '24')
  return params.toString()
}

function ShopContent() {
  const searchParams = useSearchParams()
  const department = searchParams.get('department') || ''
  const category = searchParams.get('category') || ''
  const brand = searchParams.get('brand') || ''
  const search = searchParams.get('search') || ''
  const onSale = searchParams.get('onSale') === 'true'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const page = Number(searchParams.get('page')) || 1

  const query = buildQueryString({ department, category, brand, search, onSale, minPrice, maxPrice, page })
  const { products, pagination, loading, error } = useProducts(query)

  const hasFilters = Boolean(department || category || brand || search || onSale || minPrice || maxPrice)

  const activeTitle = onSale
    ? 'Offers'
    : category
      ? getCategoryLabel(category)
      : brand
        ? toTitle(brand)
        : department
          ? toTitle(department)
          : search
            ? `Search: "${search}"`
            : 'All Products'

  const breadcrumbItems = [{ label: 'Home', href: '/' }, { label: 'Shop', href: hasFilters ? '/shop' : undefined }]

  // ⚡ كل جزء في السلسلة (Department > Category > Brand) لازم يكون
  // لينك شغال إلا الجزء الأخير بس (الصفحة الحالية اللي إنت فيها
  // فعليًا). قبل كده كل الأجزاء دي كانت بتتحط بدون href خالص، يعني
  // مفيش طريقة ترجع لـ "Make Up" مثلاً وإنت واقف على "Maybelline".
  if (department) {
    const isLast = !category && !brand
    breadcrumbItems.push({
      label: toTitle(department),
      href: isLast ? undefined : `/shop?${buildQueryString({ department, page: 1 })}`,
    })
  }
  if (category) {
    const isLast = !brand
    breadcrumbItems.push({
      label: getCategoryLabel(category),
      href: isLast ? undefined : `/shop?${buildQueryString({ department, category, page: 1 })}`,
    })
  }
  if (brand) {
    // ⚡ البراند دايمًا آخر حلقة في السلسلة لو موجود (مفيش حاجة بعده
    // في التصنيف الهرمي بتاعنا)، فمالوش href خالص — هو الصفحة الحالية.
    breadcrumbItems.push({ label: toTitle(brand) })
  }
  if (onSale) {
    // ⚡ "Offers" (زرار "View All Offers" في الهوم) دايمًا آخر حلقة
    // لو موجودة — نفس منطق البراند فوق.
    breadcrumbItems.push({ label: 'Offers' })
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl italic text-ink md:text-4xl">{activeTitle}</h1>
          {!loading && pagination && (
            <p className="mt-1 text-sm text-ink/50">{pagination.totalItems} products</p>
          )}
        </div>
        {hasFilters && (
          <Link href="/shop" className="text-sm font-medium text-ink/60 underline underline-offset-4 hover:text-ink">
            Clear filters
          </Link>
        )}
      </div>

      <div className="mb-8">
        <PriceFilter />
      </div>

      {loading ? (
        <ShopSkeleton />
      ) : error ? (
        // ⚡ فشل الطلب (السيرفر واقع، الشبكة قطعت..) لازم يتفرّق بصريًا
        // عن "مفيش منتجات مطابقة" — التعامل واحد إن الرسالتين كانوا
        // بيظهروا بنفس الشكل بالظبط ("No products found") كان مضلل:
        // المستخدم يفتكر إن الفلتر بتاعه غلط والمشكلة أصلاً في السيرفر.
        <div className="rounded-3xl border border-berry/20 bg-berry/5 py-24 text-center">
          <p className="text-ink/70">Something went wrong loading products. Please try again.</p>
          <Link href="/shop" className="mt-3 inline-block text-sm font-semibold text-gold-dark">
            Back to all products →
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-ink/10 bg-surface py-24 text-center">
          <p className="text-ink/60">No products found for this filter yet.</p>
          <Link href="/shop" className="mt-3 inline-block text-sm font-semibold text-gold-dark">
            Browse all products →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              pagination={pagination}
              department={department}
              category={category}
              brand={brand}
              search={search}
              onSale={onSale}
              minPrice={minPrice}
              maxPrice={maxPrice}
            />
          )}
        </>
      )}
    </main>
  )
}

// ⚡ بيحسب ليستة الصفحات اللي هنعرضها كأرقام (مش كل الصفحات لو كانوا
// كتير زي 33 — هيبقى صف طويل قوي). بنعرض دايمًا أول صفحة وآخر صفحة،
// + شوية صفحات حوالين الصفحة الحالية، وأي فجوة بينهم بتتعوض بـ "…".
function getPageNumbers(current, total) {
  const delta = 1 // كام صفحة حوالين الصفحة الحالية نوريها
  const pages = new Set([1, total, current])
  for (let p = current - delta; p <= current + delta; p++) {
    if (p >= 1 && p <= total) pages.add(p)
  }
  const sorted = [...pages].sort((a, b) => a - b)

  const withGaps = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) withGaps.push('…')
    withGaps.push(sorted[i])
  }
  return withGaps
}

function Pagination({ pagination, department, category, brand, search, onSale, minPrice, maxPrice }) {
  const { page, totalPages } = pagination
  const router = useRouter()
  const [jumpValue, setJumpValue] = useState('')

  function hrefFor(p) {
    return `/shop?${buildQueryString({ department, category, brand, search, onSale, minPrice, maxPrice, page: p })}`
  }

  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  function handleJump(e) {
    e.preventDefault()
    const target = Math.min(totalPages, Math.max(1, Number(jumpValue) || page))
    router.push(hrefFor(target))
    setJumpValue('')
  }

  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={prevDisabled}
          tabIndex={prevDisabled ? -1 : 0}
          className={`rounded-full border border-ink/15 px-4 py-2 text-sm font-medium transition-colors ${
            prevDisabled ? 'pointer-events-none opacity-40' : 'hover:border-gold hover:text-gold-dark'
          }`}
        >
          Previous
        </Link>

        {getPageNumbers(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-2 text-sm text-ink/40">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={hrefFor(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-ink text-cream'
                  : 'border border-ink/15 hover:border-gold hover:text-gold-dark'
              }`}
            >
              {p}
            </Link>
          )
        )}

        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-disabled={nextDisabled}
          tabIndex={nextDisabled ? -1 : 0}
          className={`rounded-full border border-ink/15 px-4 py-2 text-sm font-medium transition-colors ${
            nextDisabled ? 'pointer-events-none opacity-40' : 'hover:border-gold hover:text-gold-dark'
          }`}
        >
          Next
        </Link>
      </div>

      {/* ⚡ قفزة مباشرة لصفحة معينة — مفيدة قوي لما عدد الصفحات كبير
          (33 صفحة زي دلوقتي)، بدل ما تدوس Next 20 مرة. */}
      {totalPages > 5 && (
        <form onSubmit={handleJump} className="flex items-center gap-2 text-sm text-ink/60">
          <span>Go to page</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            placeholder={String(page)}
            className="w-16 rounded-lg border border-ink/15 bg-white px-2 py-1 text-center text-sm outline-none focus:border-gold"
          />
          <button type="submit" className="rounded-lg border border-ink/15 px-3 py-1 hover:border-gold">
            Go
          </button>
        </form>
      )}
    </div>
  )
}

function ShopSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-[1.75rem] bg-ink/5" />
      ))}
    </div>
  )
}

// ⚡ useSearchParams() بيحتاج Suspense boundary لغاية ما Next.js يقدر
// يستاتيك-رندر أي حاجة برّه الجزء ده وقت الـ build — من غيرها بيرمي
// error وقت الـ build بيقول "useSearchParams() should be wrapped in
// a suspense boundary".
export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent />
    </Suspense>
  )
}