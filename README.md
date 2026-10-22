# SoMuch

متجر إلكتروني (مستحضرات تجميل وعناية وعطور): واجهة Next.js، وسيرفر Express وسيط، وWooCommerce كمصدر للمنتجات والأوردرات.

| الجزء | المكان |
|---|---|
| الواجهة (Next.js 14) | `frontend/` |
| الـ API (Express + MongoDB) | `server/` |
| التوثيق الكامل | [`docs/README.md`](docs/README.md) |

## تشغيل محلي
```bash
cd server   && npm install && cp .env.example .env            # املا القيم
npm start                                                      # http://localhost:4000

cd frontend && npm install && cp .env.local.example .env.local
npm run dev                                                    # http://localhost:3000
```
مزامنة المنتجات من WooCommerce: `cd server && node src/scripts/sync-woocommerce-products.js`
الاختبارات: `cd server && node --test test/orders.test.js` (وباقي ملفات `test/`).

