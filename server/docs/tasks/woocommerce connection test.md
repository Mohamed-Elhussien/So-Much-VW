# اختبار الاتصال بـ WooCommerce REST API

**التاريخ:** 2026-09-20
**النوع:** بحث/تحليل + تجربة عملية (proof of concept)
**الحالة:** خلصت ✅

## الهدف
قبل ما نبني أي كود مزامنة حقيقي بين WooCommerce و MongoDB، لازم نتأكد إن
الاتصال الأساسي (authentication + endpoint صحيح) شغال فعلاً، بدل ما نكتشف
مشكلة في الاتصال بعد ما نكون بنينا منطق المزامنة كامل فوقه.

## السياق
البشمهندس بعت بيانات دخول staging site حقيقي (`test1.somuchstores.com`)
فيه WooCommerce مفعّل، بالإضافة لرابط الـ REST API الرسمي. القرار
المتفق عليه: WooCommerce هيفضل مصدر البيانات الأساسي (Method B)، وباك
إندنا هيكون طبقة مزامنة/cache فوقه.

## التكنولوجي/المصادر المستخدمة
- WooCommerce REST API official docs
- WooCommerce → Settings → Advanced → REST API (لوحة توليد المفاتيح)
- `fetch` المدمجة في Node.js (بدون أي مكتبة إضافية) لعمل الطلب

## الخطوات اللي اتعملت
1. سجّلنا دخول على `wp-admin` بالبيانات اللي بعتها البشمهندس.
2. ولّدنا API key جديدة من WooCommerce → Settings → Advanced → REST API،
   بصلاحية **Read/Write** (مش Read بس، لأننا هنحتاج write لإنشاء
   الأوردرات لاحقًا).
3. حطينا الـ Consumer Key/Secret في `.env` بمتغيرات:
   `WC_URL`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`.
4. كتبنا سكريبت اختبار مستقل (`server/src/scripts/test-woocommerce-connection.js`)
   بيعمل GET request لـ `/wp-json/wc/v3/products?per_page=1` باستخدام
   Basic Auth (base64 لـ `key:secret`).
5. شغّلنا السكريبت — رجع رد ناجح (200) فيه منتج حقيقي: `Tutti Frutti`
   (id: 51400, price: 89).

## القرارات المتخذة وليه
- استخدمنا **Basic Auth** (مش OAuth 1.0a) لأن الموقع HTTPS بالفعل —
  دي الطريقة الموصى بيها رسميًا في الحالة دي، وأبسط تنفيذًا.
- المفاتيح اتحطت في `.env` بس (مش في أي كود أو مكان تاني)، ومتعرفش
  تترجع تاني من لوحة WooCommerce لو ضاعت — لازم تتولد من جديد لو
  حصل كده.

## النتيجة
✅ الاتصال شغال 100%. الـ authentication صحيح، والـ endpoint بيرجع
بيانات حقيقية بالشكل المتوقع من قراءة الـ docs.

## أسئلة مفتوحة / الخطوة الجاية
- بناء سكريبت المزامنة الكامل: يجيب كل المنتجات (مش واحد بس)، ويعمل
  `upsert` في MongoDB بناءً على حقل `wooId` جديد في الـ Product schema.
- لسه محتاجين نعرف: هل فيه منتجات بـ variations (لون/مقاس) في المتجر
  ده؟ شكل الـ response بتاعهم مختلف عن المنتج البسيط.