import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/getProduct'
import ProductView from './ProductView'
import ProductClientFallback from './ProductClientFallback'

// Server Component: الـ HTML (بالوصف المنسّق) بيتبعت جاهز لجوجل والمتصفح.
// Next بيعمل dedupe لنفس الـ fetch بين generateMetadata والصفحة.
export async function generateMetadata({ params }) {
  const result = await getProduct(params.slug)

  if (result.status === 'not-found') return { title: 'Product not found', robots: { index: false } }
  if (result.status !== 'ok') return {}

  const p = result.product
  const description = (p.description || '').slice(0, 155).trim() || undefined
  const image = p.images?.[0]

  return {
    title: p.name,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description, type: 'website', images: image ? [image] : undefined },
  }
}

export default async function ProductPage({ params }) {
  const result = await getProduct(params.slug)

  if (result.status === 'not-found') notFound()

  // فشل شبكي من السيرفر (زي مشكلة الـ sandbox القديمة) → نرجع للـ CSR زي ما كان شغال.
  if (result.status === 'error') return <ProductClientFallback slug={params.slug} />

  const p = result.product
  const price = p.salePrice ?? p.price
  const inStock = p.variants?.length ? p.variants.some((v) => v.available) : p.stock !== 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: (p.images || []).slice(0, 4),
    description: (p.description || '').slice(0, 300),
    brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EGP',
      price: String(price),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        // escape لـ "<" عشان أي نص في اسم/وصف المنتج ما يقفلش الـ script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ProductView product={p} />
    </>
  )
}
