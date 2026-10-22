# 06. النشر (Vercel + استضافة الـ Express)

**الحالة:** ⏳ ملفات الإعداد جاهزة، **لم يتم نشر فعلي بعد**. أسماء خانات Render/Railway من المعرفة العامة: راجع واجهتهم وقت التنفيذ.

## 0) قبل أي حاجة، محليًا
1. ✅ صفحة المنتج Server Component (الملف اسمه `page.jsx`، راجع `08` P-32).
2. `.gitignore` في الـ root، و`next.config.js`، و`.env.local.example`، و`server/.env.example`.
3. `node src/scripts/list-image-hosts.js` (من `server`)، وحط أي دومين غير `somuchstores.com` في `IMAGE_HOSTS`.
4. من `frontend`: `npm run build` ✅ (نجح) ثم `npm run start`، وجرّب أوردر كامل. **أي تعديل بعدها يحتاج `build` جديد.**
5. `"engines": { "node": "22.x" }` في `package.json` للمجلدين. **مش `>=20`**: Render اختار أحدث Node متاح (ظهر 26.x في لوج الـ build) بدل اللي اتطوّرنا واتختبرنا عليه (22). تثبيت الـ major بيمنع مفاجآت.
6. السيرفر على الاستضافة بيتشغّل بـ **`npm start`** (مش `dev`). `index.js` بيسجّل أي وقوع في لوج الاستضافة (و`crash.log`).

## 0.5) GitHub
Render وVercel بيسحبوا الكود من GitHub. **Repo Private** (شبكة أمان لو سر اترفع بالغلط، والكود والتوثيق فيهم معلومات داخلية).
قبل الـ commit الأول: `git status` (ما يظهرش `.env*` ولا `node_modules` ولا `.next`) و`git grep --cached -n -E "ck_[a-f0-9]{20,}|cs_[a-f0-9]{20,}|mongodb\+srv://[^ ]+:[^ ]+@"` (لازم ما يرجّعش أي نتيجة).
المهندس المراجع: Settings ← Collaborators ← Add people (بيشوف الكود كله، وبصلاحية كتابة على repo شخصي. لو مش عايز كتابة: GitHub Organization بصلاحية Read). **مبنبعتش `.env` لأي حد، بنديه `.env.example`.**

## 1) MongoDB Atlas
- Network Access: الاستضافات اللي من غير IP ثابت محتاجة تسمح بـ `0.0.0.0/0`. ده بيفتح الباب لأي IP (الحماية بتبقى باليوزر/الباسورد)،
  فاستخدم باسورد قوي ويوزر بصلاحيات `readWrite` على الداتابيز دي بس، مش admin.
- `FORCE_GOOGLE_DNS` ما يتفعّلش في الاستضافة.

## 2) الـ Backend (Render)
- Root Directory: `server` | Build Command: `npm install` | Start Command: `npm start` | Health Check Path: `/api/health`
- **متغيرات البيئة (Environment):**

| المتغير | القيمة | ملاحظة |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://...` | **لازم تبدأ بـ `mongodb+srv://` بالظبط**: من غير علامات اقتباس، ولا مسافة قبلها، ولا `MONGODB_URI=` جوه القيمة |
| `WC_URL` | `https://test1.somuchstores.com` | بدون `/` في الآخر |
| `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET` | مفاتيح **جديدة** Read/Write | راجع `13` |
| `CLIENT_ORIGIN` | عنوان الموقع على Vercel بالظبط | `https://xxx.vercel.app` بدون `/` في الآخر |
| `TRUST_PROXY` | `1` | عشان الـ rate limit يشوف IP العميل الحقيقي |
| `SHIPPING_FEE` | `60` | لازم يطابق الـ checkout |
| `WC_ORDER_STATUS` | `processing` | |
| `NODE_VERSION` (اختياري) | `22` | بديل عن `engines` |
| **ما تضيفش** `PORT` | : | Render بيحطه لوحده والكود بيقراه (`process.env.PORT`) |
| **ما تضيفش** `FORCE_GOOGLE_DNS` | : | محلي فقط |

- بعد النشر افتح `https://<اسم-الخدمة>.onrender.com/api/health` ولازم يرد `{"status":"ok"}`، وبعدها `/api/products?limit=2`.
- الـ log بيقول `✅ MongoDB connected` و`🚀 Server running` لما ينجح. لو بيطلع `Exited with status 1` وبيعيد التشغيل كل شوية، دور على أول سطر ❌ في الـ log.
- ⚠️ **Vercel Hobby للاستخدام غير التجاري فقط** (حسب شروطهم). للمتجر الحقيقي: Pro (`16`).
- **الباقة المجانية** (من docs رندر `render.com/docs/free`): بتنيّم الخدمة بعد **15 دقيقة من غير طلبات** (أول طلب بعدها بياخد حوالي دقيقة)، و**750 ساعة تشغيل في الشهر** لكل الخدمات المجانية مع بعض (لو خلصت الخدمات بتتوقّف لحد أول الشهر)، و**Render ممكن يعيد تشغيل الخدمة المجانية في أي وقت**. مفيش تاريخ انتهاء للـ web service المجاني (الـ Postgres المجاني هو اللي بينتهي، وإحنا مش بنستخدمه: الداتابيز على Atlas). مناسبة للتجربة، **مش للإنتاج**: أوردر ممكن يتقطع لو الخدمة اتعمل لها restart، ومنتج يفتح بعد خمول ممكن يتأخر. قبل الإطلاق: instance مدفوع (راجع صفحة الأسعار الحالية).
- Atlas: Network Access لازم يسمح بالاتصال من Render (`0.0.0.0/0` للاستضافات من غير IP ثابت). من غيره بيطلع خطأ timeout بعد ما الـ URI يتصلّح.
- ⚠️ لوج الـ build بيطلع تحذير `npm audit` (vulnerabilities): شغّل `npm audit` محليًا (`12` B10).

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
