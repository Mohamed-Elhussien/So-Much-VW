// ⚡ مصدر واحد لمنطق "سعر الاختيار المحدد": لو الشيد/الاختيار ليه سعر خاص
// بنستخدمه، وإلا سعر المنتج الأساسي. بيستخدمه ProductMain (العرض) و
// ProductCard (إضافة للسلة) عشان ما يختلفوش (كان الكارت بيضيف السعر الأساسي
// حتى لو الشيد المختار أغلى).
export function resolvePricing(product, variant) {
  const price = variant?.price ?? product.price
  const salePrice = variant?.salePrice ?? (variant?.price != null ? null : product.salePrice ?? null)
  return { price, salePrice }
}
