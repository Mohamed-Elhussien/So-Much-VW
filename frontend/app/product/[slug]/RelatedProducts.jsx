'use client'

import ProductCard from '@/components/ProductCard'
import { useProducts } from '@/lib/useProducts'

// تحت الـ fold وبيتحمّل بعد الصفحة، فمبيأخّرش الـ LCP.
export default function RelatedProducts({ department, category, slug }) {
  const { products } = useProducts(`department=${department}&category=${category}&limit=8`)
  const related = products.filter((p) => p.slug !== slug).slice(0, 4)

  if (related.length === 0) return null

  return (
    <section>
      <h2 className="font-display text-2xl italic text-ink">Related Products</h2>
      <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
