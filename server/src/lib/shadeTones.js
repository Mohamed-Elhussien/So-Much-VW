// ⚡ ألوان الـ swatches (دواير الشيدات) في الكارت وصفحة المنتج.
//
// WooCommerce مابيدّيش لون حقيقي للشيد (ده اسم نصي: "Rose" أو "Tutti Frutti")، فبنولّد لون
// تمييزي لكل شيد. المشكلة القديمة: 6 ألوان باستيل بس موزعة بـ hash على الاسم = منتج فيه 17 شيد
// لازم ألوانه تتكرر (والـ 6 نفسهم كانوا متقاربين).
//
// الحل: ترتيب ثابت (deterministic) من الألوان بيتولّد مرة واحدة بخوارزمية "أبعد نقطة" (farthest-point):
// كل لون جديد بيتختار بحيث يبقى أبعد ما يمكن (في فراغ CIELAB، اللي مقاس للفرق الإدراكي الحقيقي بين الألوان)
// عن كل الألوان اللي اتختارت قبله. فـ:
//   - مفيش لونين متشابهين في نفس المنتج (أقل فرق مضمون، راجع test/shadeTones.test.js)
//   - distinctTones(n) هو أول n لون من نفس الترتيب → اللون ماله علاقة بعدد الشيدات: إضافة شيد جديد
//     في WooCommerce ما بتغيّرش ألوان الشيدات الموجودة (طالما ترتيبها ثابت)

// ---- تحويلات الألوان (D65) ----
const toRad = (deg) => (deg * Math.PI) / 180

function lchToLab(L, C, h) {
  return [L, C * Math.cos(toRad(h)), C * Math.sin(toRad(h))]
}

function labToSrgb([L, a, b]) {
  const fy = (L + 16) / 116
  const fx = fy + a / 500
  const fz = fy - b / 200
  const finv = (t) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787)
  const X = 0.95047 * finv(fx)
  const Y = finv(fy)
  const Z = 1.08883 * finv(fz)

  const lin = [
    3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z,
    -0.969266 * X + 1.8760108 * Y + 0.041556 * Z,
    0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z,
  ]
  const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.abs(c) ** (1 / 2.4) - 0.055)
  return lin.map(gamma) // قيم ممكن تطلع برّه [0,1] لو اللون برّه نطاق sRGB
}

const inGamut = (rgb) => rgb.every((c) => c >= -0.001 && c <= 1.001)
const toHex = (rgb) =>
  '#' +
  rgb
    .map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

const deltaE = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) // CIE76

// ---- مجموعة المرشّحين: ألوان مناسبة كـ swatch (مش غامقة جدًا ولا قريبة من الأبيض/الخلفية) ----
function buildCandidates() {
  const out = []
  for (let h = 0; h < 360; h += 5) {
    // ⚡ نطاق "ناعم": لا غامق جدًا ولا قريب من الأبيض (خلفية الموقع كريمي)، وchroma متوسط
    // عشان الألوان تبان مختلفة بس مش صارخة جنب تصميم الموقع الهادي.
    for (const L of [50, 62, 74, 83]) {
      for (const C of [20, 32, 44]) {
        const lab = lchToLab(L, C, h)
        const rgb = labToSrgb(lab)
        if (inGamut(rgb)) out.push({ lab, hex: toHex(rgb) })
      }
    }
  }
  return out
}

// ---- الترتيب الكامل: أبعد نقطة تدريجيًا ----
function buildSequence() {
  const candidates = buildCandidates()
  // نقطة بداية ثابتة: لون وردي/أحمر دافي (قريب من هوية الموقع)
  const seed = lchToLab(62, 44, 15)
  let first = 0
  candidates.forEach((c, i) => {
    if (deltaE(c.lab, seed) < deltaE(candidates[first].lab, seed)) first = i
  })

  const chosen = [candidates[first]]
  const minDist = candidates.map((c) => deltaE(c.lab, candidates[first].lab))
  minDist[first] = -1

  while (chosen.length < candidates.length) {
    let best = -1
    for (let i = 0; i < candidates.length; i++) {
      if (minDist[i] > (best === -1 ? -1 : minDist[best])) best = i
    }
    if (best === -1) break
    chosen.push(candidates[best])
    for (let i = 0; i < candidates.length; i++) {
      if (minDist[i] >= 0) minDist[i] = Math.min(minDist[i], deltaE(candidates[i].lab, candidates[best].lab))
    }
    minDist[best] = -1
  }
  return chosen
}

const SEQUENCE = buildSequence()

/** أول n لون تمييزي. لو n أكبر من المتاح (مئات) بيعيد من الأول (نادر جدًا، المنتجات عندنا أقل بكتير). */
function distinctTones(n) {
  return Array.from({ length: n }, (_, i) => SEQUENCE[i % SEQUENCE.length].hex)
}

/** أقل فرق لوني (ΔE) بين أي لونين من أول n لون: للاختبار/التشخيص. */
function minDeltaE(n) {
  let min = Infinity
  const k = Math.min(n, SEQUENCE.length)
  for (let i = 0; i < k; i++)
    for (let j = i + 1; j < k; j++) min = Math.min(min, deltaE(SEQUENCE[i].lab, SEQUENCE[j].lab))
  return min
}

module.exports = { distinctTones, minDeltaE, POOL_SIZE: SEQUENCE.length }
