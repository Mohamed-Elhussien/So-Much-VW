// اختبار woo.js الحقيقي ضد سيرفر HTTP محلي بيحاكي WooCommerce (من غير شبكة ولا مكتبات).
// تشغيل: node --test test/woo.test.js   (من مجلد server)
const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const { wooRequest, WooError } = require('../src/lib/woo')

async function withFakeWoo(handler, fn) {
  const srv = http.createServer((req, res) => {
    req.resume()
    req.on('end', () => handler(req, res))
  })
  await new Promise((r) => srv.listen(0, '127.0.0.1', r))
  const prev = { ...process.env }
  process.env.WC_URL = `http://127.0.0.1:${srv.address().port}/`
  process.env.WC_CONSUMER_KEY = 'ck_test'
  process.env.WC_CONSUMER_SECRET = 'cs_test'
  try {
    return await fn()
  } finally {
    process.env = prev
    srv.closeAllConnections?.()
    srv.close()
  }
}

const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(body) }
const call = (opts) => wooRequest('POST', '/wp-json/wc/v3/orders', { body: { a: 1 }, ...opts })

test('نجاح: بيرجّع الـ JSON وبيبعت Basic auth', async () => {
  let auth
  await withFakeWoo((req, res) => { auth = req.headers.authorization; json(res, 201, '{"id":9,"number":"9","total":"510.00"}') }, async () => {
    assert.deepEqual(await call(), { id: 9, number: '9', total: '510.00' })
  })
  assert.equal(auth, 'Basic ' + Buffer.from('ck_test:cs_test').toString('base64'))
})

test('تحذيرات PHP قبل الـ JSON: بنقصّها ونكمّل (الأوردر اتعمل فعلاً)', async () => {
  const noisy = '<br />\n<b>Warning</b>: Undefined variable $x in /wp-content/plugins/foo.php on line 12<br />\n{"id":77,"number":"77","total":"240.00"}'
  await withFakeWoo((_req, res) => json(res, 201, noisy), async () => {
    const data = await call()
    assert.equal(data.id, 77)
  })
})

test('رد 2xx مش JSON خالص: invalid_response (مش نجاح ولا فشل مؤكد)', async () => {
  await withFakeWoo((_req, res) => json(res, 201, '<html>maintenance</html>'), async () => {
    await assert.rejects(call(), (e) => e instanceof WooError && e.kind === 'invalid_response' && e.status === 201)
  })
})

test('رفض صريح 4xx: kind=http مع الـ status والـ code', async () => {
  await withFakeWoo((_req, res) => json(res, 401, '{"code":"woocommerce_rest_cannot_create","message":"no"}'), async () => {
    await assert.rejects(call(), (e) => e.kind === 'http' && e.status === 401 && e.code === 'woocommerce_rest_cannot_create')
  })
})

test('5xx من صفحة HTML: kind=http status 500', async () => {
  await withFakeWoo((_req, res) => { res.writeHead(500); res.end('<html>fatal</html>') }, async () => {
    await assert.rejects(call(), (e) => e.kind === 'http' && e.status === 500)
  })
})

test('timeout: kind=timeout', async () => {
  await withFakeWoo(() => { /* ما بنردّش */ }, async () => {
    await assert.rejects(call({ timeoutMs: 150 }), (e) => e.kind === 'timeout')
  })
})

test('اتصال اتقطع: kind=network', async () => {
  await withFakeWoo((req) => req.socket.destroy(), async () => {
    await assert.rejects(call(), (e) => e.kind === 'network')
  })
})

test('.env ناقص: kind=config', async () => {
  const prev = { ...process.env }
  delete process.env.WC_URL
  try {
    await assert.rejects(call(), (e) => e.kind === 'config')
  } finally {
    process.env = prev
  }
})
