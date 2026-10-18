'use client'

import { useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import ProductImage from '@/components/ProductImage'
import { getCategoryLabel } from '@/lib/categories'
import { getProductTag } from '@/lib/getProductTag'
import { toTitle } from '@/lib/toTitle'
import { resolvePricing } from '@/lib/pricing'
import { useCartStore } from '@/store/useCartStore'

// الجزيرة التفاعلية الوحيدة (شيد/كمية/سلة). بتستقبل product "مصغّر" (راجع toMainProduct).
export default function ProductMain({ product }) {
  const addItem = useCartStore((s) => s.addItem)
  const variants = product.variants
  const tag = getProductTag(product)

  const firstAvailable = variants.find((v) => v.available) ?? {
    tone: product.tone,
    image: product.image,
    colorName: null,
    price: null,
    salePrice: null,
    stock: null,
  }
  const [selected, setSelected] = useState(firstAvailable)
  const [qty, setQty] = useState(1)

  // سعر الاختيار المحدد لو ليه سعر خاص، وإلا سعر المنتج الأساسي
  const { price: effectivePrice, salePrice: effectiveSalePrice } = resolvePricing(product, selected)
  const onSale = effectiveSalePrice != null
  const outOfStock = variants.length > 0 ? !selected.available : product.stock === 0

  function handleAddToCart() {
    if (outOfStock) return
    addItem(
      {
        ...product,
        tone: selected.tone,
        image: selected.image,
        colorName: selected.colorName ?? null,
        price: effectivePrice,
        salePrice: effectiveSalePrice,
      },
      qty
    )
  }

  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="relative aspect-square w-full overflow-hidden rounded-[1.75rem] border border-ink/10">
        <ProductImage
          src={selected.image}
          alt={`${product.name}${selected.colorName ? ` — ${selected.colorName}` : ''}`}
          tone={selected.tone}
          sizes="(min-width: 1024px) 50vw, 90vw"
          priority
        />
        {tag && (
          <span
            className={`absolute top-4 right-4 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${
              tag === 'Sold Out' ? 'bg-ink/80 text-cream' : 'bg-surface/90 text-ink'
            }`}
          >
            {tag}
          </span>
        )}
        {onSale && !outOfStock && (
          <span className="absolute top-4 left-4 rounded-full bg-berry px-3 py-1.5 text-xs font-semibold text-cream">
            {Math.round((1 - effectiveSalePrice / effectivePrice) * 100)}% off
          </span>
        )}
      </div>

      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">{product.brand}</span>
        <h1 className="mt-2 font-display text-3xl italic text-ink md:text-4xl">{product.name}</h1>

        <div className="mt-4 flex items-center gap-3">
          {onSale ? (
            <>
              <span className="text-xl font-semibold text-berry">EGP {effectiveSalePrice}</span>
              <span className="text-base text-ink/40 line-through">EGP {effectivePrice}</span>
            </>
          ) : (
            <span className="text-xl font-semibold text-ink">EGP {effectivePrice}</span>
          )}
        </div>

        {/* الوصف القصير (HTML منضّف وقت الـ sync). fallback: أول 160 حرف من النص العادي */}
        {product.shortDescription ? (
          <div
            className="rich-text mt-5 max-w-md text-ink/60"
            dangerouslySetInnerHTML={{ __html: product.shortDescription }}
          />
        ) : (
          product.summary && <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/60">{product.summary}</p>
        )}

        {variants.length > 0 && (
          <div className="mt-6">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">
              Shade: <span className="text-ink/70">{selected.colorName}</span>
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {variants.map((v, i) => {
                const isSelected = selected.colorName === v.colorName
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!v.available}
                    aria-pressed={isSelected}
                    onClick={() => v.available && setSelected(v)}
                    aria-label={v.available ? `Select ${v.colorName}` : `${v.colorName} — sold out`}
                    title={v.colorName}
                    className={`relative h-8 w-8 rounded-full transition-all ${
                      isSelected ? 'ring-2 ring-ink' : 'ring-1 ring-ink/15'
                    } ${!v.available ? 'cursor-not-allowed' : 'hover:ring-2 hover:ring-gold'}`}
                    style={{ backgroundColor: v.tone }}
                  >
                    {!v.available && (
                      <X size={14} strokeWidth={3} className="absolute inset-0 m-auto text-cream mix-blend-difference" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center gap-3">
          <div className="flex items-center rounded-full border border-ink/15">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="flex h-11 w-11 items-center justify-center text-ink/60 hover:text-ink"
            >
              <Minus size={14} />
            </button>
            <span className="w-6 text-center text-sm font-medium text-ink" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              aria-label="Increase quantity"
              className="flex h-11 w-11 items-center justify-center text-ink/60 hover:text-ink"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex-1 rounded-full bg-ink px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-cream transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            {outOfStock ? 'Sold Out' : 'Add to cart'}
          </button>
        </div>

        <dl className="mt-8 space-y-1.5 border-t border-ink/10 pt-6 text-sm">
          <div className="flex gap-2">
            <dt className="font-semibold text-ink">Categories:</dt>
            <dd className="text-ink/60">
              {product.brand}, {getCategoryLabel(product.category)}, {toTitle(product.department)}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold text-ink">Brand:</dt>
            <dd className="text-ink/60">{product.brand}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
