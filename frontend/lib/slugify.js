// ⚡ نفس المنطق بالظبط الموجود في server/src/lib/slugify.js — الاتنين
// لازم يطلعوا نفس القيمة بالظبط لأي اسم/براند/تصنيف، عشان الروابط
// اللي الفرونت بيبنيها (زي /shop?brand=cybele) تتطابق مع الـ
// brandSlug/customTagSlug المخزنين في الداتابيز.
export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
}
