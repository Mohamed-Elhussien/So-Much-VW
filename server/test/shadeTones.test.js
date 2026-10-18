// تشغيل: node --test test/shadeTones.test.js   (من مجلد server)
const test = require('node:test')
const assert = require('node:assert/strict')
const { distinctTones, minDeltaE, POOL_SIZE } = require('../src/lib/shadeTones')

test('كل الألوان في المنتج مختلفة (مفيش تكرار) لأي عدد شيدات واقعي', () => {
  for (const n of [1, 2, 5, 17, 30, 60, 100]) {
    const tones = distinctTones(n)
    assert.equal(tones.length, n)
    assert.equal(new Set(tones).size, n, `n=${n}`)
    for (const t of tones) assert.match(t, /^#[0-9A-F]{6}$/)
  }
})

test('الألوان المتجاورة مختلفة بوضوح (ΔE في CIELAB): الضمان الأساسي', () => {
  // ΔE≈2.3 = أقل فرق العين بتلاحظه، 10+ = واضح، 20+ = مختلف جدًا
  assert.ok(minDeltaE(10) >= 30, `n=10: ${minDeltaE(10).toFixed(1)}`)
  assert.ok(minDeltaE(20) >= 22, `n=20: ${minDeltaE(20).toFixed(1)}`)
  assert.ok(minDeltaE(40) >= 15, `n=40: ${minDeltaE(40).toFixed(1)}`)
  assert.ok(minDeltaE(60) >= 12, `n=60: ${minDeltaE(60).toFixed(1)}`)
})

test('ثابتة (deterministic) ومستقرة: إضافة شيد ما بتغيّرش ألوان اللي قبله', () => {
  assert.deepEqual(distinctTones(17), distinctTones(17))
  assert.deepEqual(distinctTones(20).slice(0, 17), distinctTones(17))
})

test('مجموعة المرشّحين كبيرة كفاية', () => {
  assert.ok(POOL_SIZE >= 300, `POOL_SIZE=${POOL_SIZE}`)
})
