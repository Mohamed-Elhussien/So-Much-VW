'use client'

import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import BrandsCarousel from '@/components/BrandsCarousel'
import { useProducts } from '@/lib/useProducts'
import { buildShopHref } from '@/lib/buildShopHref'

// ⚡ Client Component دلوقتي (مش Server Component زي الأول) — راجع
// التعليق في lib/useProducts.js لتفاصيل السبب (فشل fetch من جوه
// Server Component وقت الـ SSR في بيئة التشغيل الحالية، رغم إن نفس
// الـ API شغال 100% لما يتفتح من المتصفح مباشرة).
export default function CategorySection({
  title,
  categorySlug,
  brands = null,
  showBrands = false,
}) {
  const { products, loading } = useProducts(`department=${categorySlug}&limit=8`)

  if (loading) return <CategorySectionSkeleton showBrands={showBrands} />
  if (products.length === 0) return null

  return (
    <section id={categorySlug} className="py-16">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="text-center font-display text-3xl italic text-ink md:text-4xl">
          {title}
        </h2>

        {showBrands && brands?.length > 0 && (
          <div className="mt-8">
            <BrandsCarousel brands={brands} />
          </div>
        )}

        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            // ⚡ كان /category/[slug] — route ده مش موجود في المشروع
            // خالص (مفيش app/category مجلد أصلاً)، فكان دايمًا بيوديك
            // لصفحة 404. صفحة المنتجات الحقيقية الوحيدة هي /shop.
            href={buildShopHref({ department: categorySlug })}
            className="inline-block rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-gold hover:text-gold-dark"
          >
            View More
          </Link>
        </div>
      </div>
    </section>
  )
}

// ⚡ سكيليتون بسيط وقت التحميل — بيحافظ على نفس ارتفاع القسم تقريبًا
// عشان الصفحة ما "تقفزش" لما الداتا توصل وتحل محله.
function CategorySectionSkeleton({ showBrands }) {
  return (
    <section className="py-16" aria-hidden="true">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto h-8 w-40 animate-pulse rounded-full bg-ink/10" />

        {showBrands && (
          <div className="mx-auto mt-8 h-6 w-2/3 animate-pulse rounded-full bg-ink/5" />
        )}

        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-[1.75rem] bg-ink/5" />
          ))}
        </div>
      </div>
    </section>
  )
}
