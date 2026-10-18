'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Minus, Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import ProductImage from '@/components/ProductImage'
import {
  useCartStore,
  selectCartTotal,
} from '@/store/useCartStore'

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const total = useCartStore(selectCartTotal)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass-nav fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/50 shadow-glow-lg"
            role="dialog"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <h2 className="font-display text-xl text-ink">Your Bag</h2>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {items.length === 0 ? (
                <p className="mt-10 text-center text-sm text-ink/50">
                  Your bag's empty. Let's fix that.
                </p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {items.map((item) => (
                    <li
                      key={item.lineId}
                      className="glass-card flex gap-4 rounded-2xl border border-white/50 p-3"
                    >
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-ink/10">
                        <ProductImage src={item.image} alt={item.name} tone={item.tone} sizes="64px" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-ink">{item.name}</span>
                        {item.colorName && <span className="text-xs text-ink/50">{item.colorName}</span>}
                        <span className="text-xs text-ink/50">
                          EGP {(item.salePrice ?? item.price)}
                        </span>
                        <div className="mt-2 flex items-center gap-3">
                          <button
                            onClick={() => updateQty(item.lineId, item.qty - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.lineId, item.qty + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => removeItem(item.lineId)}
                            className="ml-auto text-ink/40 hover:text-berry"
                            aria-label="Remove from cart"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-ink/10 px-6 py-5">
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-ink/60">Total</span>
                  <span className="font-display text-lg text-ink">EGP {total}</span>
                </div>
                <Button variant="primary" href="/checkout" onClick={closeCart} className="w-full">
                  Checkout
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
