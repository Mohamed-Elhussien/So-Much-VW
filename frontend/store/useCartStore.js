import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_QTY = 99

// ⚡ هوية سطر السلة = المنتج + الشيد. من غير كده شيدين مختلفين من نفس المنتج
// كانوا بيتدمجوا في سطر واحد (الكمية بتزيد على الأول والتاني بيضيع).
const getLineId = (product) =>
  product.colorName ? `${product.id}:${product.colorName}` : String(product.id)

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // ⚡ qty parameter: استدعاء واحد = set واحد + كتابة واحدة في localStorage
      // (قبل كده صفحة المنتج كانت بتنادي addItem في loop بعدد الكمية).
      addItem: (product, qty = 1) =>
        set((state) => {
          const lineId = getLineId(product)
          const existing = state.items.find((i) => i.lineId === lineId)

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.lineId === lineId ? { ...i, qty: Math.min(MAX_QTY, i.qty + qty) } : i
              ),
              isOpen: true,
            }
          }

          // بنخزّن بس الحقول اللي السلة والـ checkout بتعرضها (مش المنتج كامل).
          const item = {
            lineId,
            id: product.id,
            name: product.name,
            slug: product.slug,
            colorName: product.colorName ?? null,
            price: product.price,
            salePrice: product.salePrice ?? null,
            tone: product.tone ?? null,
            image: product.image ?? null,
            qty: Math.min(MAX_QTY, qty),
          }
          return { items: [...state.items, item], isOpen: true }
        }),

      removeItem: (lineId) =>
        set((state) => ({ items: state.items.filter((i) => i.lineId !== lineId) })),

      updateQty: (lineId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.lineId !== lineId)
              : state.items.map((i) => (i.lineId === lineId ? { ...i, qty: Math.min(MAX_QTY, qty) } : i)),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'somuch-cart',
      version: 1,
      // ⚡ isOpen (حالة الـ UI) ماينفعش تتخزّن: كان الـ drawer ممكن يفتح لوحده بعد refresh.
      partialize: (state) => ({ items: state.items }),
      // سلات اتخزنت قبل lineId (version 0) تتحوّل بدل ما تبوّظ.
      migrate: (persisted, version) => {
        if (version < 1 && Array.isArray(persisted?.items)) {
          return {
            ...persisted,
            items: persisted.items.map((i) => ({
              ...i,
              lineId: i.lineId ?? String(i.id),
              colorName: i.colorName ?? null,
            })),
          }
        }
        return persisted
      },
    }
  )
)

// Selectors مشتقة — بنستخدمها في الكومبوننتس بدل ما نكرر الحساب
export const selectCartCount = (state) =>
  state.items.reduce((sum, i) => sum + i.qty, 0)

export const selectCartTotal = (state) =>
  state.items.reduce((sum, i) => sum + (i.salePrice ?? i.price) * i.qty, 0)
