# 07. دليل التشغيل (مهام متكررة)

كل أمر هنا بيتشغّل من المجلد المذكور. على PowerShell: مسارات فيها `[slug]` استخدم `-LiteralPath`.

## تشغيل المشروع محليًا
```bash
cd server   && npm install && npm run dev      # http://localhost:4000  (لازم تشوف "MongoDB connected")
cd frontend && npm install && npm run dev      # http://localhost:3000
```
تغيير في `.env.local` (`NEXT_PUBLIC_*`) محتاج إعادة تشغيل `npm run dev`.

## مزامنة المنتجات من WooCommerce
```bash
cd server
node src/scripts/sync-woocommerce-products.js
```
- مش لازم توقف السيرفر. بياخد دقايق (بيجيب variations كل منتج variable).
- في الآخر: ملخص (محتاج مراجعة / مستنتج) + ملف `server/sync-report.txt`.
- **متى تشغّله:** بعد أي تعديل في المنتجات/الأسعار/المخزون في WooCommerce، وبعد أي تعديل في `wooCategoryMap.js` أو `shadeTones.js`.
- **تأكد إن الشيدات اتحفظت صح:** افتح `http://localhost:4000/api/products/slug/<slug>` لمنتج بشيدات وابحث عن `wooVariationId` (لازم رقم) و`tone` (لون مختلف لكل شيد).

## إضافة براند / قاعدة تصنيف
1. عدّل `server/src/lib/wooCategoryMap.js` (الجدول المناسب: راجع جدول "إزاي توسّع الجداول" في `03`).
2. أضف حالة في `server/test/wooCategoryMap.test.js` للمنتج اللي كان بيفشل.
3. `node --test test/wooCategoryMap.test.js` ← أعد الـ sync ← راجع `sync-report.txt`.

## الاختبارات
```bash
cd server
node --test test/orders.test.js
node --test test/wooCategoryMap.test.js
node --test test/shadeTones.test.js
```
(Node 22: لازم اسم الملف، `node --test test/` بيعتبر `test/` ملف.)

## تجربة أوردر وفحصه في WooCommerce
1. الموقع: منتج بشيد ← Add to cart ← Checkout ← موبايل مصري (`01012345678`) ← Place Order ← **اكتب رقم الأوردر**.
2. `wp-admin` ← **WooCommerce ← Orders** ← ابحث بالرقم: Processing، Cash on delivery، الشيد صح، الشحن 60.
3. لو اختبار: غيّر الحالة لـ **Cancelled**.
4. لو فشل: ترمنال السيرفر فيه السبب. وفي المتصفح F12 ← Network ← `orders` ← Status (الجدول في `04`).

## التأكد إن الأسعار صح
```bash
cd server && node src/scripts/verify-prices.js
```
بيقارن كل منتج وشيد بسعر WooCommerce الحي (قراءة فقط، بياخد دقايق). `✅` = كله مطابق. غير كده: أول 15 مشكلة في الترمنال والباقي في `server/price-report.txt`. لو `price_mismatch`/`base_price_not_cheapest`: شغّل الـ sync وأعد الفحص.

## لو Place Order فشل
1. **WooCommerce ← Orders:** دور على اسمك. ممكن الأوردر اتعمل فعلاً (لو لقيته، الفرونت لازم يعرضه بعد التعديل).
2. **ترمنال السيرفر:** سطور `[orders] ...` (بتقول إمتى اتحجز، ومدة طلب WooCommerce، وأي خطأ).
3. **لو الطلب اتقطع بـ `ERR_CONNECTION_REFUSED` والسيرفر بيرجع يشتغل لوحده بعد ثواني:** السيرفر بيقع/بيتعمله restart وقت الأوردر. شغّله بـ `npm start` بدل `npm run dev` (من غير `--watch`) وجرّب تاني: لو وقع هيفضل واقف ويطبع سبب الوقوع في الترمنال (ابعته)، ولو الأوردر اشتغل يبقى الـ watcher هو اللي كان بيعيد التشغيل.
4. **المتصفح:** F12 ← Console (سطر `[checkout] request to ... failed before a response` بالسبب الفعلي) ثم Network ← `orders` ← الـ Status.
5. لو سجل `creating`/`sending` عالق: بيتعالج تلقائيًا بعد 60/120 ثانية، أو اعمل refresh للصفحة (مفتاح جديد).

## تنضيف منتجات الديمو (مرة واحدة)
```bash
cd server && node src/scripts/remove-demo-products.js    # بيطلب تكتب yes
```
مش بيمس غير المنتجات من غير `wooId`. **ما تشغّلش `npm run seed` بعده** (بيرجّع الديمو). منتجات الديمو مش بتتباع (`UNAVAILABLE`).

## ضبط دومينات الصور
```bash
cd server && node src/scripts/list-image-hosts.js
```
حط الناتج في `IMAGE_HOSTS` (`frontend/.env.local` وVercel).

## مسح السلة من المتصفح (للاختبار)
DevTools ← Application ← Local Storage ← احذف `somuch-cart` ثم refresh.

## تشغيل الإنتاج محليًا (قبل أي نشر)
```bash
cd server   && npm start                    # بدون --watch
cd frontend && npm run build && npm run start   # http://localhost:3000
```
`npm run start` مابيحدّثش نفسه: **أي تعديل في الكود = `npm run build` تاني.** صفحة المنتج في الـ build لازم تظهر `ƒ /product/[slug]`.
تأكيد الـ SSR: صفحة منتج ← `Ctrl+U` ← ابحث عن جزء من الوصف: لازم يكون موجود.

## صفحة منتج بتفتح 404 أو مخفية
- **404 افتراضي من Next (خلفية سودا):** المسار من غير `page.jsx`. اتأكد إن الملف اسمه `page.jsx` بالظبط (`08` P-32).
- **صفحة "المنتج مش موجود" بتاعتنا:** الـ API رد 404. شغّل `node src/scripts/find-product.js "جزء من الاسم"`: بيطبع الـ slug والسعر وهل المنتج مخفي لأن سعره 0.
- ترمنال الفرونت بيكتب `[getProduct] ...` بالسبب والرابط.

## التأكد من ألوان الشيدات
`node src/scripts/check-shade-tones.js` (كل المنتجات) أو `node src/scripts/check-shade-tones.js "اسم"` (منتج واحد).

## لما حاجة تبوّظ
| العرض | روح لـ |
|---|---|
| صور مكسورة | `IMAGE_HOSTS` (أعلاه) |
| رابط nav بيرجّع صفر منتجات | قيمة `department` في `data/nav.js` ≠ اللي الـ sync بيخزّنه (`08`: P-03) |
| `Element type is invalid ... undefined` | اسم ملف/export غلط، حروف كبيرة/صغيرة (`08`: P-21) |
| الوصف مسطّح أو فيه `&amp;` | الـ sync القديم (لسه ما اتشغّلش بالنسخة الجديدة) (`08`: P-13) |
| الأوردر بيرجّع `CATALOG_OUTDATED` | شغّل الـ sync (الشيدات ناقصها `wooVariationId`) |
| ألوان الشيدات متكررة | شغّل الـ sync بنسخة فيها `shadeTones.js` |
