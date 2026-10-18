// ⚡ تسميات التصنيفات (النوع الفرعي). الأولوية:
//   1) CATEGORY_LABELS: اسم متعمّد (override) لو عايز صياغة معيّنة
//   2) تحويل الـ slug لاسم مقروء (مع شيل لاحقة القسم)
// WooCommerce بيضيف لاحقة القسم للـ slug لما الاسم يتكرر ("cream-face-hair-and-skin-care")،
// فبنشيلها بدل ما تظهر للعميل زي ما هي. تصنيف جديد في WooCommerce يظهر صح من غير ما
// تعدّل هنا خالص.
export const CATEGORY_LABELS = {
  lipstick: 'Lipstick',
  foundation: 'Foundation',
  eyeshadow: 'Eyeshadow',
  skincare: 'Skincare',
  blusher: 'Blusher',
  mascara: 'Mascara',
  perfume: 'Perfume',
  bags: 'Bags',
  other: 'Other',
}

// لازم تطابق قيم department في server/src/lib/wooCategoryMap.js
const DEPARTMENT_SUFFIX = /-(hair-and-skin-care|tools-nails-and-lashes|fragrance|makeup|make-up)$/

const cache = new Map()

export function getCategoryLabel(category) {
  if (!category) return ''
  const cached = cache.get(category)
  if (cached) return cached

  const label =
    CATEGORY_LABELS[category] ??
    String(category)
      .replace(DEPARTMENT_SUFFIX, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())

  cache.set(category, label)
  return label
}
