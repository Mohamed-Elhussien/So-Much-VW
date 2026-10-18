// ⚡ عميل WooCommerce للـ API كتابة/قراءة (الأوردرات). المفاتيح بتتقرا من .env
// وقت الاستدعاء ومبتروحش للمتصفح أبدًا: الفرونت بيكلّم Express بس.
//
// err.kind بيفرّق بين أنواع الفشل (مهم لقرار "هل الأوردر اتعمل؟"):
//   'http'    → WooCommerce رد برفض صريح (err.status)
//   'timeout' → ماردّش في الوقت → ممكن يكون الأوردر اتعمل فعلاً (غموض)
//   'network' → الطلب ماوصلش/الاتصال قطع → برضه غموض
//   'config'  → .env ناقص
//   'invalid_response' → رد 2xx بس مش JSON مفهوم → الأوردر ممكن يكون اتعمل (غموض)
class WooError extends Error {
  constructor(message, { kind, status = null, code = null } = {}) {
    super(message)
    this.name = 'WooError'
    this.kind = kind
    this.status = status
    this.code = code
  }
}

// ⚡ مواقع WordPress كتير بترجّع تحذيرات/Notices من PHP (من plugin أو WP_DEBUG) مكتوبة **قبل** الـ JSON:
//   "<br /><b>Warning</b>: ... {"id":123,...}". ده بيكسر JSON.parse رغم إن الأوردر اتعمل فعلاً.
// بنحاول JSON عادي، وبعدين بنقصّ البداية لحد أول { أو [.
function parseJsonLenient(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    const start = text.search(/[{[]/)
    if (start <= 0) return null
    try {
      const parsed = JSON.parse(text.slice(start))
      console.warn('[woo] ⚠️ رد WooCommerce فيه نص قبل الـ JSON (تحذيرات PHP/WP_DEBUG؟). اتجاهله، لكن يستاهل تتصلّح في WordPress.')
      return parsed
    } catch {
      return null
    }
  }
}

async function wooRequest(method, path, { body, timeoutMs = 15000 } = {}) {
  const { WC_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET } = process.env
  if (!WC_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    throw new WooError('WC_URL / WC_CONSUMER_KEY / WC_CONSUMER_SECRET غير مضبوطين في .env', { kind: 'config' })
  }

  const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${WC_URL.replace(/\/$/, '')}${path}`, {
      method,
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    const text = await res.text()
    const data = parseJsonLenient(text)
    if (!res.ok) {
      throw new WooError(`WooCommerce ${method} ${path} → ${res.status} ${data?.code ?? ''} ${data?.message ?? ''}`.trim(), {
        kind: 'http',
        status: res.status,
        code: data?.code ?? null,
      })
    }
    // ⚡ رد ناجح (2xx) من غير JSON مفهوم: ما نعتبرهوش فشل مؤكد ولا نجاح: الأوردر ممكن يكون اتعمل،
    // فبنرمي kind='invalid_response' والـ orderService بيعامله كـ "unknown" (ما يتكررش).
    if (data === null || typeof data !== 'object') {
      throw new WooError(`WooCommerce ${method} ${path} → ${res.status} but the body is not valid JSON`, {
        kind: 'invalid_response',
        status: res.status,
      })
    }
    return data
  } catch (err) {
    if (err instanceof WooError) throw err
    if (err.name === 'AbortError') throw new WooError(`WooCommerce ${method} ${path} timed out`, { kind: 'timeout' })
    throw new WooError(`WooCommerce ${method} ${path} failed: ${err.message}`, { kind: 'network' })
  } finally {
    clearTimeout(timer)
  }
}

const woo = {
  createOrder: (body) => wooRequest('POST', '/wp-json/wc/v3/orders', { body }),
}

module.exports = { wooRequest, WooError, woo }
