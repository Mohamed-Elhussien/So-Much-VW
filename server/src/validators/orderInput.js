// ⚡ Validation على حدود الـ API: مبنثقش في أي حاجة جاية من المتصفح. الـ items
// بتجيب id/colorName/qty بس، الأسعار بتتحسب من السيرفر (مش من العميل أبدًا).

const PHONE_PATTERN = /^(?:\+?20|0)?1[0-25]\d{8}$/ // نفس باترن الفرونت
const KEY_PATTERN = /^[A-Za-z0-9_-]{16,64}$/
const OBJECT_ID = /^[a-f0-9]{24}$/i
const MAX_LINES = 50
const MAX_QTY = 99

// شيل الـ control characters وكرّر المسافات
const clean = (v, { multiline = false } = {}) =>
  String(v ?? '')
    .replace(multiline ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, '')
    .replace(multiline ? /[ \t]+/g : /\s+/g, ' ')
    .trim()

function normalizePhone(raw) {
  const input = String(raw ?? '').replace(/[\s-]/g, '')
  if (!PHONE_PATTERN.test(input)) return null
  const digits = input.replace(/\D/g, '')
  return `0${digits.slice(-10)}` // 01XXXXXXXXX
}

function validateOrderInput(body) {
  const errors = {}
  const b = body && typeof body === 'object' ? body : {}
  const c = b.customer && typeof b.customer === 'object' ? b.customer : {}

  const name = clean(c.name)
  if (name.length < 2 || name.length > 100) errors.name = 'Please enter your full name.'

  const phone = normalizePhone(c.phone)
  if (!phone) errors.phone = 'Please enter a valid Egyptian phone number.'

  const city = clean(c.city)
  if (city.length < 2 || city.length > 60) errors.city = 'Please enter your city.'

  const address = clean(c.address)
  if (address.length < 5 || address.length > 300) errors.address = 'Please enter your address.'

  const note = clean(b.note, { multiline: true })
  if (note.length > 500) errors.note = 'Note is too long (500 characters max).'

  const idempotencyKey = typeof b.idempotencyKey === 'string' ? b.idempotencyKey : ''
  if (!KEY_PATTERN.test(idempotencyKey)) errors.idempotencyKey = 'Invalid request key.'

  // الأسطر: بندمج المكرر (نفس المنتج + نفس الشيد)
  const merged = new Map()
  const rawItems = Array.isArray(b.items) ? b.items : []
  if (rawItems.length === 0 || rawItems.length > MAX_LINES) {
    errors.items = rawItems.length === 0 ? 'Your cart is empty.' : `Too many items (max ${MAX_LINES}).`
  } else {
    for (const it of rawItems) {
      const id = typeof it?.id === 'string' ? it.id : String(it?.id ?? '')
      const qty = Number(it?.qty)
      const colorName = it?.colorName == null ? null : clean(it.colorName)
      if (!OBJECT_ID.test(id) || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY || (colorName && colorName.length > 100)) {
        errors.items = 'One of the cart items is invalid.'
        break
      }
      const key = `${id}\u0000${colorName ?? ''}`
      const prev = merged.get(key)
      merged.set(key, { id, colorName: colorName || null, qty: Math.min(MAX_QTY, (prev?.qty ?? 0) + qty) })
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const items = [...merged.values()].sort((a, z) => (a.id + (a.colorName ?? '')).localeCompare(z.id + (z.colorName ?? '')))
  return { ok: true, data: { idempotencyKey, customer: { name, phone, city, address }, note, items } }
}

const isValidKey = (k) => typeof k === 'string' && KEY_PATTERN.test(k)

module.exports = { validateOrderInput, normalizePhone, isValidKey }
