# 02. الـ Backend (Express + MongoDB)

**الكود:** `server/` &nbsp;|&nbsp; **التشغيل:** `npm run dev` (watch) / `npm start`

## ترتيب الـ middleware (`src/index.js`)
0. **معالجات الوقوع** (`uncaughtException`/`unhandledRejection`): بتكتب السبب في الترمنال **وفي `server/crash.log`** وتخرج بكود 1.
1. `trust proxy` (لو `TRUST_PROXY` مضبوط)
2. **`cors` أول middleware** بقايمة origins: `localhost:3000` و`127.0.0.1:3000` + `CLIENT_ORIGIN`. طلبات من غير origin (curl/سيرفر) مسموحة. الـ origin المرفوض **ما بيرميش error** (كان بيطلع 500 من غير headers فالمتصفح يعرضه "مشكلة اتصال")، بيتكتب مرة واحدة في اللوج: `[cors] ❌ origin مش مسموح`.
3. `helmet()`
4. `express.json({ limit: '20kb' })`
5. لوج `[http] METHOD URL origin=` لطلبات `/api/orders` (لو ما ظهرش سطر، الطلب ما وصلش السيرفر)
6. Routes: `/api/products` و`/api/orders` و`GET /api/health`
7. `errorHandler`: آخر واحد. أي خطأ غير متوقع = `500 {error: "Something went wrong on our end."}` (التفاصيل في اللوج فقط)

## الـ Endpoints
> **منتج سعره ≤ 0 مخفي من كل الـ endpoints** (القايمة والبحث وبالـ slug وبالـ id: بيرجّع 404): مفيش عميل المفروض يشوف "EGP 0" (راجع `12` A1).

### المنتجات (`routes/products.js`)
| الطلب | الوصف |
|---|---|
| `GET /api/products` | قايمة مع فلاتر وpagination |
| `GET /api/products/search?q=cyb&limit=6` | typeahead: prefix match على `nameLower` (أقصى 8 نتايج) |
| `GET /api/products/slug/:slug` | تفاصيل منتج كاملة (بيستخدمها `/product/[slug]`) |
| `GET /api/products/:id` | تفاصيل بالـ ObjectId |

**فلاتر `GET /api/products`:** `department`, `category`, `brand` (slug), `tag`, `search` (`$text`), `onSale=true`,
`minPrice`/`maxPrice` (على `effectivePrice`؛ لو min>max بيتبدلوا)، `page` (≥1)، `limit` (1–50، الافتراضي 20). الترتيب: `createdAt` تنازلي.

**الـ Response:** `{ data: [...], pagination: { page, limit, totalItems, totalPages } }`. القايمة بتستثني الحقول التقيلة:
`description, descriptionHtml, shortDescription, keyBenefits, howToUse, suitableFor, specifications, faq`.

### الأوردرات (`routes/orders.js`)
`POST /api/orders`: تفاصيله كاملة في [`04-orders-checkout.md`](04-orders-checkout.md).

## الـ Models
### `Product` (`models/Product.js`)
| الحقل | ملاحظات |
|---|---|
| `wooId` | رقم المنتج في WooCommerce. `unique + sparse`، مفتاح الـ upsert. منتجات الديمو القديمة مالهاش wooId |
| `name`, `nameLower` | `nameLower` للـ typeahead (indexed) |
| `slug` | بيتحسب في `pre('save')`: `slugify(name)` + `-wooId` لمنتجات WooCommerce (يضمن الفرادة) |
| `department`, `category` | `lowercase`, indexed. department = القسم العريض (`makeup`, `fragrance`, `hair-and-skin-care`, `leather`, `tools-nails-and-lashes`)، category = النوع الفرعي |
| `brand`, `brandSlug` | العرض + نسخة الفلترة (indexed) |
| `price`, `salePrice`, `effectivePrice` | `effectivePrice = salePrice ?? price` (indexed، عليه فلتر السعر) |
| `stock` | رقم. `0` = Sold Out، `1–5` = Almost Gone (virtual `tag`) |
| `images[]` | الأولى = الأساسية |
| `description` | نص عادي (للبحث والكروت) |
| `descriptionHtml`, `shortDescription` | HTML **منضّف** من الـ sync (راجع `03`) |
| `variants[]` | الشيدات: `colorName` (قد يكون ريحة/مقاس)، `tone` (لون تمييزي)، `image`، `available`، `price`/`salePrice`/`stock` الخاصة بالاختيار، `wooVariationId` |
| `customTag`, `customTagSlug` | badge يدوي (مثلاً Bestseller) |
| `keyBenefits, howToUse, suitableFor, specifications, faq` | من الديمو القديم، منتجات WooCommerce بتجيبهم جوه `descriptionHtml` |
| `tag` (virtual) | يتحسب من `stock` + `customTag`. **منطقه مكرر** في `frontend/lib/getProductTag.js`: لو غيّرت واحد غيّر التاني |

**Indexes:** text على `name+description`، compound على `{department, category}`، وindexes منفردة على الفلاتر.

### `Order` (`models/Order.js`)
سجل داخلي خفيف: `idempotencyKey` (unique)، `payloadHash`، `status` (`creating → created | failed | unknown`)،
`wooOrderId`, `orderNumber`, `total`, `items[]` (لقطة: منتج/شيد/كمية/سعر الوحدة)، `failureReason`.
**مفيهوش بيانات العميل عمدًا** (اسم/تليفون/عنوان)، وبيتمسح تلقائيًا بعد 180 يوم (TTL).

## الأمان
| الإجراء | التفاصيل |
|---|---|
| Validation على الحدود | `validators/orderInput.js`: الأسعار مبتجيش من العميل أبدًا |
| Rate limit على الأوردرات | 10 محاولات / 10 دقايق / IP (`express-rate-limit`) |
| حدّ حجم الـ body | 20KB |
| Regex آمن | البحث بيعمل `escapeRegex` للمدخل (منع ReDoS) |
| أخطاء عامة | مفيش تسريب لتفاصيل داخلية للعميل |
| الأسرار | `.env` خارج Git، مفاتيح WooCommerce على السيرفر بس |

## السكريبتات (`src/scripts/`)
| السكريبت | الغرض | بيكتب في الداتابيز؟ |
|---|---|---|
| **`sync-woocommerce-products.js`** | المزامنة الرئيسية (راجع `03`) | ✅ |
| `remove-demo-products.js` | يمسح كل منتج من غير `wooId` (الديمو). بيطلب تأكيد `yes` | ✅ (حذف) |
| `list-image-hosts.js` | يطبع دومينات الصور الفعلية لضبط `IMAGE_HOSTS` | ❌ |
| `verify-prices.js` | يقارن كل أسعار الموقع (والشيدات) بـ WooCommerce الحي، تقرير في `price-report.txt` | ❌ |
| `check-shade-tones.js` | يتأكد إن ألوان شيدات كل منتج مختلفة | ❌ |
| `find-product.js` | يدوّر على منتج في الداتابيز (من غير الـ API) ويقول حالته ولو مخفي لأن سعره 0 | ❌ |
| `test-woocommerce-connection.js` | اختبار مفاتيح الـ API | ❌ |
| `explore-woocommerce-products.js`, `dump-raw-product.js`, `dump-raw-description.js`, `inspect-variations.js` | استكشاف/تشخيص بيانات WooCommerce الخام | ❌ |
| `list-all-categories.js`, `analyze-uncategorized.js` | تحليل التصنيفات (بُنيت منهم جداول `wooCategoryMap`) | ❌ |
| `src/seed/seed.js` (`npm run seed`) | بيانات ديمو قديمة. **ما تشغّلوش** بعد تنضيف الديمو | ✅ |

## الاختبارات
**42 اختبار** بـ `node:test` (من غير مكتبات): `test/orders.test.js` (17: الأوردر)، `test/woo.test.js` (8: `woo.js` ضد سيرفر HTTP محلي)، `test/wooCategoryMap.test.js` (6)،
`test/priceCheck.test.js` (7)، `test/shadeTones.test.js` (4). الأوردرات بتتختبر بـ fakes عن Mongo وWooCommerce (dependency injection)، فـ **مفيش اختبار بـ Mongo حقيقي**.
تشغيل: `node --test test/orders.test.js test/woo.test.js ...` (Node 22: لازم أسماء الملفات).

## أخطاء شايعة
| العرض | السبب |
|---|---|
| `querySrv ECONNREFUSED` | مشكلة DNS محلية → `FORCE_GOOGLE_DNS=true` (محلي فقط) |
| `Origin ... not allowed by CORS` | دومين الفرونت مش في `CLIENT_ORIGIN` |
| 502 + `401/403` في لوج `/api/orders` | مفتاح WooCommerce Read فقط |
| كل الطلبات للسيرفر بتتقطع `ERR_CONNECTION_REFUSED` | السيرفر واقف. لو بتستخدم `npm run dev` (`--watch`) بيستنى تعديل ملف ومابيرجعش. شغّله بـ `npm start` وبص على `server/crash.log` (`12` B1) |
| `[cors] ❌ origin مش مسموح` في اللوج | الفرونت شغّال على origin تاني (مثلاً `localhost:3001`): ضيفه في `CLIENT_ORIGIN` |
