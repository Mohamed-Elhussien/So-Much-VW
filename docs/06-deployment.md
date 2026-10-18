# 06. النشر (Vercel + استضافة الـ Express)

**الحالة:** ⏳ ملفات الإعداد جاهزة، **لم يتم نشر فعلي بعد**. أسماء خانات Render/Railway من المعرفة العامة: راجع واجهتهم وقت التنفيذ.

## 0) قبل أي حاجة، محليًا
1. من `frontend`: غيّر `page.jsx` لـ Server Component:
   - احذف `app/product/[slug]/page.jsx` الحالي (نسخة الـ CSR المؤقتة)
   - سمّي `page.server.jsx` ← `page.jsx`
2. حط الملفات الجديدة: `.gitignore` (في الـ root) و`next.config.js` و`.env.local.example` و`server/.env.example`.
3. شغّل `node src/scripts/list-image-hosts.js` (من `server`) وحط الناتج في `IMAGE_HOSTS` في `frontend/.env.local`.
4. من `frontend`: `npm run build` ثم `npm run start`، وافتح صفحة منتج. لو الـ build فشل، صلّحه هنا قبل أي رفع.
5. في `package.json` للمجلدين ضيف: `"engines": { "node": ">=20" }` (عشان الاستضافة تستخدم Node حديث، الكود بيعتمد على `fetch` المدمج).

## 1) MongoDB Atlas
- Network Access: الاستضافات اللي من غير IP ثابت محتاجة تسمح بـ `0.0.0.0/0`. ده بيفتح الباب لأي IP (الحماية بتبقى باليوزر/الباسورد)،
  فاستخدم باسورد قوي ويوزر بصلاحيات `readWrite` على الداتابيز دي بس، مش admin.
- `FORCE_GOOGLE_DNS` ما يتفعّلش في الاستضافة.

## 2) الـ Backend (Render/Railway)
- Root Directory: `server`
- Build Command: `npm install`  |  Start Command: `npm start`
- Health Check Path: `/api/health`
- Environment Variables (من `server/.env.example`): `MONGODB_URI`, `WC_URL`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`,
  `SHIPPING_FEE`, `WC_ORDER_STATUS`, `TRUST_PROXY=1`, و`CLIENT_ORIGIN` (بعد ما تعرف دومين Vercel، الخطوة 4).
- بعد النشر افتح `https://<backend>/api/health` ولازم يرد `{"status":"ok"}`،
  وبعدها `https://<backend>/api/products?limit=2` ولازم يرجّع منتجات.

## 3) الفرونت (Vercel)
- New Project ← اختار الريبو ← Root Directory: `frontend` (Framework: Next.js بيتعرّف تلقائيًا).
- Environment Variables:
  - `NEXT_PUBLIC_API_URL` = عنوان الـ backend (https، من غير `/` في الآخر)
  - `API_URL` = نفس العنوان
  - `IMAGE_HOSTS` = ناتج السكريبت
- Deploy.

## 4) اربط الاتنين
- ارجع للـ backend وحط `CLIENT_ORIGIN` = دومين Vercel بالظبط (`https://xxx.vercel.app`، ولو عندك دومين خاص ضيفه بفاصلة). Redeploy.
- ⚠️ كل Preview Deployment في Vercel بدومين مختلف، وملوش CORS مسموح. للاختبار استخدم دومين الـ production بس.

## 5) Smoke test على الموقع الحي
- [ ] الصفحة الرئيسية بتعرض منتجات وصور
- [ ] `/shop` بالفلاتر والـ pagination
- [ ] صفحة منتج: الوصف منسّق، والشيدات، وView Source فيه الوصف (يعني Server Component شغّال)
- [ ] إضافة للسلة بشيدين مختلفين = سطرين
- [ ] Checkout بأوردر تجريبي على الـ staging، وبعدين WooCommerce ← Orders وإلغاؤه (Cancelled)
- [ ] Network → مفيش أخطاء CORS ولا صور 400/403

## 6) أحكام لازم تعرفها
- الـ sync لسه يدوي: شغّله من جهازك (`node src/scripts/sync-woocommerce-products.js`)، بيكتب في نفس Atlas اللي الموقع بيقرا منه.
- المنتجات والأسعار ممكن تتأخر 5 دقايق عن WooCommerce (ISR). الـ webhooks هتشيل التأخير ده وتدّي المخزون لحظيًا.
- الاستضافات المجانية ممكن توقف السيرفر بعد فترة خمول (أول طلب بعدها بطيء). للمتجر الحقيقي استخدم خطة مدفوعة.
- لما تعدّي لـ production في WooCommerce: غيّر `WC_URL` والمفاتيح، أعد الـ sync، وحدّث `IMAGE_HOSTS` لدومين الصور الجديد.
