// مفيش 'use client' هنا: بيتعرض من السيرفر (الحالة العادية) ومن الـ client (الـ fallback).
import Breadcrumbs from '@/components/Breadcrumbs'
import { getCategoryLabel } from '@/lib/categories'
import { buildShopHref } from '@/lib/buildShopHref'
import { toTitle } from '@/lib/toTitle'
import ProductMain from './ProductMain'
import RichContent from './RichContent'
import RelatedProducts from './RelatedProducts'

// ⚡ بنبعت للـ client component الحقول اللي محتاجها بس. من غير كده كان
// descriptionHtml/faq/specifications كلهم هيتسلسلوا في payload الصفحة وملهمش لازمة.
function toMainProduct(p) {
  const desc = p.description || ''
  return {
    id: p.id ?? p._id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    department: p.department,
    category: p.category,
    price: p.price,
    salePrice: p.salePrice ?? null,
    stock: p.stock ?? null,
    tone: p.tone ?? null,
    customTag: p.customTag ?? null,
    image: p.images?.[0] ?? null,
    variants: p.variants ?? [],
    shortDescription: p.shortDescription ?? '',
    summary: desc.length > 160 ? `${desc.slice(0, 160).trim()}…` : desc,
  }
}

export default function ProductView({ product }) {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: toTitle(product.department), href: buildShopHref({ department: product.department }) },
          {
            label: getCategoryLabel(product.category),
            href: buildShopHref({ department: product.department, category: product.category }),
          },
          { label: product.brand, href: buildShopHref({ brand: product.brand }) },
          { label: product.name },
        ]}
      />

      <ProductMain product={toMainProduct(product)} />

      <div className="mt-20 space-y-14">
        <RichContent product={product} />
        <RelatedProducts department={product.department} category={product.category} slug={product.slug} />
      </div>
    </main>
  )
}
