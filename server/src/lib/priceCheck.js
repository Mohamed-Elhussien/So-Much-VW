// ⚡ منطق مقارنة سعر المنتج في MongoDB بالسعر الحي في WooCommerce (بيستخدمه verify-prices.js).
// المعيار: سعر WooCommerce الفعلي (`price` للمنتج و`price` لكل variation) هو اللي العميل بيدفعه،
// ولازم يساوي اللي بنعرضه (salePrice لو موجود وإلا price).

const EPS = 0.001
const num = (v) => {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const pos = (n) => (n != null && n > 0 ? n : null) // 0 في WooCommerce = مفيش سعر
const eff = (x) => (x ? x.salePrice ?? x.price ?? null : null)
const differs = (a, b) => a == null || b == null || Math.abs(a - b) > EPS

/** بترجّع array فيه المشاكل (فاضي = سليم). woo: المنتج، variations: array (للـ variable)، doc: من MongoDB (lean). */
function compareProduct(woo, variations, doc) {
  if (!doc) return ['missing_in_db']
  const issues = []

  // تناسق داخلي في الداتابيز نفسها
  if (doc.salePrice != null && doc.price != null && doc.salePrice >= doc.price) issues.push(`sale_not_lower db=${doc.salePrice}>=${doc.price}`)
  if (!(doc.price > 0)) issues.push('db_price_missing')

  if (woo.type !== 'variable') {
    const wooPrice = pos(num(woo.price))
    if (wooPrice == null) issues.push('woo_has_no_price')
    else if (differs(wooPrice, eff(doc))) issues.push(`price_mismatch woo=${wooPrice} db=${eff(doc)}`)
    if (!woo.on_sale && doc.salePrice != null) issues.push('sale_shown_but_not_on_sale')
    return issues
  }

  const vars = variations || []
  if (vars.length === 0) return [...issues, 'variable_without_variations']

  for (const v of vars) {
    const dbV = (doc.variants || []).find((x) => x.wooVariationId === v.id)
    if (!dbV) {
      issues.push(`variant_missing_in_db id=${v.id}`)
      continue
    }
    const wooPrice = pos(num(v.price))
    if (wooPrice == null) issues.push(`variant_no_price_in_woo "${dbV.colorName}"`)
    else if (differs(wooPrice, eff(dbV))) issues.push(`variant_price_mismatch "${dbV.colorName}" woo=${wooPrice} db=${eff(dbV)}`)
    if (!v.on_sale && dbV.salePrice != null) issues.push(`variant_sale_shown_but_not_on_sale "${dbV.colorName}"`)
  }
  for (const dbV of doc.variants || []) {
    if (!vars.some((v) => v.id === dbV.wooVariationId)) issues.push(`variant_not_in_woo "${dbV.colorName}"`)
  }

  // سعر المنتج الأساسي (الكارت/فلتر السعر) = أرخص اختيار متوفر بالسعر الفعلي
  const inStock = vars.filter((v) => v.stock_status === 'instock')
  const pool = (inStock.length ? inStock : vars).map((v) => pos(num(v.price))).filter((p) => p != null)
  if (pool.length) {
    const wooMin = Math.min(...pool)
    if (differs(wooMin, eff(doc))) issues.push(`base_price_not_cheapest woo_min=${wooMin} db=${eff(doc)}`)
  }
  return issues
}

module.exports = { compareProduct }
