'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { getCategoryLabel } from '@/lib/categories'
import { getProductTag } from '@/lib/getProductTag'
import { resolvePricing } from '@/lib/pricing'
import { slugify } from '@/lib/slugify'
import ProductImage from '@/components/ProductImage'

export default function ProductCard({ product, className = '', dark = false }) {
  const addItem = useCartStore((s) => s.addItem)
  const variants = product.variants ?? []
  const outOfStock = product.stock === 0

  // ⚡ product.slug بييجي جاهز من الـ API (Mongoose pre-save hook).
  // ⚡ fallback دفاعي بسيط لو أي مكان (حاليًا أو في المستقبل) مرر
  // منتج من غير slug جاهز — بيبنيه من الاسم بنفس منطق الباك إند
  // بالظبط. كل المنتجات الحقيقية من الـ API بيجيلها slug جاهز أصلاً.
  const productHref = `/product/${product.slug || slugify(product.name)}`

  // الـ tag بيتحسب دلوقتي، مش قيمة مخزّنة — نفس المنطق ده هيتكرر
  // كـ virtual field في الـ Mongoose Schema على الباك إند لاحقًا.
  const tag = getProductTag(product)

  // ⚡ لو المنتج مالوش variants (معظم منتجات WooCommerce الحقيقية)،
  // نرجع لأول صورة حقيقية في product.images (لو موجودة) بدل ما نفضل
  // نعرض مربع اللون بس دايمًا — الصورة الحقيقية أهم بصريًا من أي لون.
  const firstAvailable = variants.find((v) => v.available) ?? {
    tone: product.tone,
    image: product.images?.[0] ?? null,
  }
  const [selected, setSelected] = useState(firstAvailable)

  // ⚡ السعر والخصم بيتحسبوا من الشيد المختار (نفس المنطق بالظبط في صفحة المنتج: lib/pricing.js).
  // قبل كده الكارت كان بيعرض سعر المنتج الأساسي دايمًا، فالسعر برّه مختلف عن اللي جوه.
  const { price, salePrice } = resolvePricing(product, selected)
  const onSale = salePrice != null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative flex flex-col rounded-[1.75rem] p-3.5 transition-all duration-300 ${
        dark
          ? 'glass-card-dark hover:shadow-glow-dark'
          : 'glass-card hover:shadow-glow-lg'
      } hover:-translate-y-1 ${className}`}
    >
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-[1.25rem] border ${
          dark ? 'border-cream/10' : 'border-ink/10'
        }`}
      >
        {/* ⚡ الصورة نفسها هي اللي بتودّي لصفحة المنتج — الـ badges
            وزرار الإضافة للسلة سايبينهم برّه الـ Link (مش nested جواه)
            عشان مانحطش <button> جوه <a> (HTML غير صحيح + مشاكل
            accessibility)، فكل واحد فيهم شغال لوحده براحته. */}
        <Link href={productHref} className="absolute inset-0 z-0" aria-label={`View ${product.name}`}>
          <ProductImage
            src={selected.image}
            alt={`${product.name} — ${selected.colorName ?? ''}`}
            tone={selected.tone}
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
            imageClassName="transition-transform duration-500 ease-out group-hover:scale-110"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </Link>

        {tag && (
          <span
            className={`pointer-events-none absolute top-2.5 right-2.5 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm ${
              tag === 'Sold Out'
                ? 'bg-ink/80 text-cream'
                : 'bg-surface/90 text-ink'
            }`}
          >
            {tag}
          </span>
        )}
        {onSale && !outOfStock && (
          <span className="pointer-events-none absolute top-2.5 left-2.5 z-10 rounded-full bg-berry px-2.5 py-1 text-[10px] font-semibold text-cream">
            {Math.round((1 - salePrice / price) * 100)}% off
          </span>
        )}

        <button
          onClick={() => {
            if (outOfStock) return
            addItem({
              ...product,
              tone: selected.tone,
              image: selected.image,
              colorName: selected.colorName ?? null,
              price,
              salePrice,
            })
          }}
          disabled={outOfStock}
          aria-label={outOfStock ? 'Out of stock' : `Add ${product.name} to cart`}
          className="absolute bottom-2.5 left-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink shadow-md transition-transform duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
        >
          <Plus size={16} />
        </button>

        {!outOfStock && (
          <span className="pointer-events-none absolute bottom-3 right-3 z-10 hidden translate-y-1 text-[10px] font-semibold text-ink/70 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:inline">
            quick add →
          </span>
        )}
      </div>

      <div className="mt-3.5 flex flex-col gap-1.5 px-1 pb-1">
        <span className={`text-[10px] uppercase tracking-wider ${dark ? 'text-cream/50' : 'text-ink/50'}`}>
          {getCategoryLabel(product.category)}
        </span>
        <Link href={productHref}>
          <h3 className={`font-display text-[0.95rem] leading-snug line-clamp-2 min-h-[2.5em] transition-colors hover:text-gold ${dark ? 'text-cream' : 'text-ink'}`}>
            {product.name}
          </h3>
        </Link>

        <div className="flex min-h-[28px] flex-wrap items-center gap-1.5 py-0.5">
          {variants.map((v, i) => {
            const isSelected = selected.colorName === v.colorName
            return (
              <button
                key={i}
                disabled={!v.available}
                onClick={() => v.available && setSelected(v)}
                aria-label={v.available ? `Select ${v.colorName}` : `${v.colorName} — sold out`}
                title={v.colorName}
                className={`relative h-5 w-5 rounded-full transition-all ${
                  isSelected ? (dark ? 'ring-2 ring-cream' : 'ring-2 ring-ink') : 'ring-1 ring-ink/15'
                } ${!v.available ? 'cursor-not-allowed' : 'hover:ring-2 hover:ring-gold'}`}
                style={{ backgroundColor: v.tone }}
              >
                {!v.available && (
                  <X
                    size={12}
                    strokeWidth={3}
                    className="absolute inset-0 m-auto text-cream mix-blend-difference"
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-0.5 flex items-center gap-2">
          {onSale ? (
            <>
              <span className="font-semibold text-berry">EGP {salePrice}</span>
              <span className={`text-sm line-through ${dark ? 'text-cream/40' : 'text-ink/40'}`}>
                EGP {price}
              </span>
            </>
          ) : (
            <span className={`font-semibold ${dark ? 'text-cream' : 'text-ink'}`}>
              EGP {price}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}