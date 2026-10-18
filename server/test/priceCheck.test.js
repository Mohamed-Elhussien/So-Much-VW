// تشغيل: node --test test/priceCheck.test.js   (من مجلد server)
const test = require('node:test')
const assert = require('node:assert/strict')
const { compareProduct } = require('../src/lib/priceCheck')

const simple = (o = {}) => ({ id: 1, type: 'simple', price: '200', on_sale: false, ...o })
const dbSimple = (o = {}) => ({ price: 200, salePrice: null, variants: [], ...o })
const variable = { id: 2, type: 'variable' }
const wv = (id, price, o = {}) => ({ id, price: String(price), on_sale: false, stock_status: 'instock', ...o })
const dv = (id, name, price, salePrice = null) => ({ wooVariationId: id, colorName: name, price, salePrice })

test('منتج بسيط مطابق: مفيش مشاكل', () => {
  assert.deepEqual(compareProduct(simple(), null, dbSimple()), [])
  // خصم فعّال: سعر WooCommerce الفعلي = سعر الخصم
  assert.deepEqual(compareProduct(simple({ price: '150', on_sale: true }), null, dbSimple({ salePrice: 150 })), [])
})

test('اختلاف السعر، منتج مش في الداتابيز، وسعر خصم مش فعّال', () => {
  assert.match(compareProduct(simple({ price: '250' }), null, dbSimple())[0], /^price_mismatch woo=250 db=200/)
  assert.deepEqual(compareProduct(simple(), null, null), ['missing_in_db'])
  // WooCommerce بيحتفظ بـ sale_price لعرض لسه ما بدأ (on_sale=false) وإحنا بنعرضه كخصم
  const issues = compareProduct(simple({ on_sale: false }), null, dbSimple({ salePrice: 150 }))
  assert.ok(issues.some((i) => i.startsWith('sale_shown_but_not_on_sale')))
})

test('سعر 0 أو فاضي في WooCommerce = مفيش سعر (مش "مطابق")', () => {
  assert.ok(compareProduct(simple({ price: '0' }), null, dbSimple({ price: 0 })).includes('woo_has_no_price'))
  assert.ok(compareProduct(simple({ price: '' }), null, dbSimple({ price: 0 })).includes('woo_has_no_price'))
  assert.ok(compareProduct(simple(), null, dbSimple({ price: 0 })).includes('db_price_missing'))
})

test('خصم مش أقل من الأصلي (تناقض في الداتابيز)', () => {
  const issues = compareProduct(simple({ price: '200', on_sale: true }), null, dbSimple({ salePrice: 200 }))
  assert.ok(issues.some((i) => i.startsWith('sale_not_lower')))
})

test('منتج بشيدات مطابق، والمنتج الأساسي = أرخص شيد متوفر بالسعر بعد الخصم', () => {
  const vars = [wv(11, 220), wv(12, 154, { on_sale: true }), wv(13, 100, { stock_status: 'outofstock' })]
  const doc = { price: 220, salePrice: 154, variants: [dv(11, 'A', 220), dv(12, 'B', 220, 154), dv(13, 'C', 100)] }
  assert.deepEqual(compareProduct(variable, vars, doc), []) // الشيد C أرخص بس مش متوفر: مش بيتحسب
})

test('المنتج الأساسي مش الأرخص (البق القديم) + شيد سعره صفر + شيد ناقص/زيادة', () => {
  const vars = [wv(11, 220), wv(12, 154, { on_sale: true }), wv(14, 0)]
  const oldDoc = { price: 220, salePrice: 198, variants: [dv(11, 'A', 220), dv(12, 'B', 220, 154), dv(99, 'Z', 50)] }
  const issues = compareProduct(variable, vars, oldDoc)
  assert.ok(issues.some((i) => i.startsWith('base_price_not_cheapest woo_min=154')))
  assert.ok(issues.some((i) => i.startsWith('variant_missing_in_db id=14')))
  assert.ok(issues.some((i) => i.startsWith('variant_not_in_woo "Z"')))
  const zero = compareProduct(variable, [wv(11, 0)], { price: 220, salePrice: null, variants: [dv(11, 'A', null)] })
  assert.ok(zero.some((i) => i.startsWith('variant_no_price_in_woo "A"')))
})

test('variable من غير variations', () => {
  assert.ok(compareProduct(variable, [], dbSimple()).includes('variable_without_variations'))
})
