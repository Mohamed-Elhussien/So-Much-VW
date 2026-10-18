// ⚡ سلاج بسيط وموحّد — نفس المنطق بالظبط متكرر في الفرونت إند
// (frontend/lib/slugify.js) عشان الاتنين يطلعوا نفس القيمة بالظبط
// لأي اسم/براند/تاج، من غير ما نحتاج مكتبة package خارجية لحاجة
// بسيطة كده.
function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
}

module.exports = { slugify }
