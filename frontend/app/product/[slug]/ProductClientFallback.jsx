'use client'

import { useProduct } from '@/lib/useProducts'
import ProductView from './ProductView'
import { ProductSkeleton, ProductNotFound } from './ProductStates'

// بيشتغل بس لو fetch السيرفر فشل (شبكة). نفس سلوك الـ CSR القديم.
export default function ProductClientFallback({ slug }) {
  const { product, loading } = useProduct(slug)
  if (loading) return <ProductSkeleton />
  if (!product) return <ProductNotFound />
  return <ProductView product={product} />
}
