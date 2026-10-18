// ⚡ الدالة دي هي "الحقيقة الوحيدة" لحساب الـ badge بتاع أي منتج.
// بتتستخدم دلوقتي في الفرونت (لحد ما نربط الـ API)، وبعدين هتتحول
// لـ virtual field في Mongoose Schema بنفس المنطق بالظبط، عشان
// الـ tag يفضل دايمًا مطابق للمخزون الفعلي لحظة بلحظة مش قيمة
// قديمة اتخزّنت وممكن تبقى غلط بعد ما المخزون يتغيّر.
export function getProductTag(product) {
  const { stock, customTag } = product

  if (stock === 0) return 'Sold Out'
  if (stock > 0 && stock <= 5) return 'Almost Gone'
  if (stock > 5) return customTag ?? null

  return null
}
