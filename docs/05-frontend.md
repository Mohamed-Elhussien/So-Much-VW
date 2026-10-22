# 05. الواجهة (Next.js)

**الكود:** `frontend/` &nbsp;|&nbsp; **التقنيات:** Next.js 14 (App Router)، React 18، Tailwind 3، Zustand 4، Framer Motion 11، Embla Carousel، Radix UI، lucide-react
**اللغة/الاتجاه:** إنجليزي، `dir="ltr"` (layout.jsx). الخطوط: Fraunces (عناوين، `font-display`) وManrope (نص، `font-body`).

## الصفحات
| المسار | النوع | البيانات | ملاحظات |
|---|---|---|---|
| `/` | Server Component يركّب أقسام Client | `useProducts` داخل الأقسام | Hero, Categories, Offers, CategorySection×4 (Make Up / Hair & Skin Care / Fragrance / Leather), WhyUs, Newsletter |
| `/shop` | Client | `useProducts` | صفحة واحدة لكل التصفح. فلاتر في الـ URL: `department, category, brand, search, onSale, minPrice, maxPrice, page` (24/صفحة، ترقيم مع ellipsis وخانة "go to page") |
| `/product/[slug]` | **Server Component** (ISR 5 دقايق، `ƒ` في الـ build) | `getProduct` (سيرفر) + `ProductMain`/`RelatedProducts` (عميل) | تفاصيل + شيدات + وصف منسّق + منتجات مشابهة. منتج سعره 0 ← 404 |
| `/checkout` | Client | السلة + `POST /api/orders` | راجع `04` |
| `/about` | Server (HTML ثابت) | : | |
| `/contact` | Client | : | **شكل فقط**: الإرسال بيعمل `setSubmitted(true)` ومفيش backend |
| `/login` | Client | : | **شكل فقط** (UI shell): مفيش `/api/auth` ولا users |

## صفحة المنتج: هيكل الملفات
`app/product/[slug]/`:
| الملف | الدور |
|---|---|
| `page.jsx` | **Server Component**: `generateMetadata` (title/description/OG/canonical) + JSON-LD (`Product`) + `notFound()` لـ 404 الحقيقي + fallback للـ CSR (`ProductClientFallback`) لو فشل fetch السيرفر بسبب الشبكة |
| ~~`page.server.jsx`~~ | **ما يتسمّاش كده**: Next بيعتبر أي ملف مش اسمه `page.jsx` مجرد ملف عادي، فالمسار بيطلع 404 افتراضي (`08` P-32) |
| `ProductView.jsx` | التركيب (Breadcrumbs + ProductMain + RichContent + RelatedProducts). بدون `'use client'` فبيتعرض من السيرفر والعميل |
| `ProductMain.jsx` | **الجزيرة التفاعلية الوحيدة** (`'use client'`): اختيار الشيد، الكمية، الإضافة للسلة. بتاخد product **مصغّر** (حقول لازمة بس) |
| `RichContent.jsx` | الأقسام (الوصف المنسّق + بقايا الأقسام القديمة)، بدون hooks |
| `RelatedProducts.jsx` | `'use client'`، تحت الـ fold |
| `ProductClientFallback.jsx`, `ProductStates.jsx`, `loading.jsx`, `not-found.jsx` | الحالات (skeleton / 404 / fallback) |
| `lib/getProduct.js` | fetch السيرفر بـ `status`: `ok / not-found / error` (يفرّق 404 عن فشل الشبكة). كاش 5 دقايق (`unstable_cache`) **للنجاح بس** (404 والأخطاء مابتتكاشش)، وفي التطوير من غير كاش. بيكتب في الترمنال الرابط والسبب |

**تاريخ:** الصفحة بدأت CSR (`useProduct`) بسبب قيد في بيئة التطوير (`08` P-01)، واتحوّلت لـ Server Component. التحويل = الملف اسمه **`page.jsx`** وفيه `generateMetadata` (من غير `'use client'`)، و`API_URL` مضبوط. باقي المكوّنات مبنية تصلح للاتنين.
الوصف: الهيرو بيعرض `shortDescription` (HTML منضّف)، والقسم تحت بيعرض `descriptionHtml`. لو الحقلين فاضيين (منتجات ديمو) بيرجع للنص القديم. التنسيق من `.rich-text` في `globals.css`.

## الـ Components
| المجموعة | الملفات |
|---|---|
| التنقل | `Navbar` (عايم/fixed)، `MegaMenuPanel` (روابط من `data/nav.js` عبر `buildShopHref`)، `SearchAutocomplete` (debounce 250ms، endpoint `/search`)، `UserMenu` (**stub** ببيانات وهمية) |
| المنتجات | `ProductCard` (شيدات + إضافة سريعة، **السعر والخصم من الشيد المختار** عبر `resolvePricing` زي صفحة المنتج)، `ProductImage` (**المكان الوحيد** لعرض الصور، يرجع للون لو الصورة فاضية/باظت)، `PriceFilter`، `Breadcrumbs` |
| السلة | `CartDrawer` |
| أقسام الهوم | `sections/Hero, Categories, Offers, CategorySection, WhyUs, Newsletter` (الـ Newsletter **شكل فقط**، `Offers/CountdownTimer` الموعد من لحظة فتح الصفحة = demo) |
| زخرفة | `BeautyHeroArt`, `VanityMirrorArt` (SVG)، `GrainOverlay`، `BrandsCarousel` (بيانات `mockBrands.js` وهمية)، `ui/SwatchStrip`, `ui/Button` |

## البيانات والـ state
- **`lib/useProducts.js`**: `useProducts(query)` و`useProduct(slug)`: fetch من المتصفح مع `AbortController` وكاش في الذاكرة. `API_URL` من `NEXT_PUBLIC_API_URL` (في dev الافتراضي localhost).
- **السلة**: Zustand، راجع `04`.
- **روابط `/shop`**: دايمًا عبر `lib/buildShopHref.js` (بيعمل `slugify` لكل جزء، ومفيش مكان يبني الـ query بإيده). `lib/slugify.js` لازم يطابق `server/src/lib/slugify.js`.
- **`lib/categories.js → getCategoryLabel`**: اسم مقروء للنوع: `CATEGORY_LABELS` للمخصص، وإلا بيحوّل الـ slug (ويشيل لاحقة القسم: `cream-face-hair-and-skin-care` ← "Cream Face"). تصنيف جديد من WooCommerce بيظهر صح من غير تعديل.
- **`lib/getProductTag.js`**: badge (Sold Out / Almost Gone / customTag). **منطق مكرر** مع virtual `tag` في السيرفر.

## الـ Navbar والتصنيفات (`data/nav.js`)
مصدر واحد للقوايم. قيم `department` فيها **لازم تطابق** اللي الـ sync بيخزّنه (`makeup`, `hair-and-skin-care`, `fragrance`, `leather`, `tools-nails-and-lashes`). أي اختلاف = الرابط يرجّع صفر منتجات
(حصل مرتين: `haircare` و`tools`، راجع `08`). ⏳ قسم `accessories` في الـ nav مفيش منتجات بيحمل القيمة دي حاليًا.

## الصور
`next/image` عبر `ProductImage`. `next.config.js`: دومينات مسموحة = الافتراضي (`somuchstores.com` و`**.somuchstores.com`) **+** أي دومينات في `IMAGE_HOSTS` (بتضيف على الافتراضي)، كاش 30 يوم، وheaders أمان بسيطة.
لو ظهرت صور مكسورة أو خطأ `hostname is not configured`: ضيف الدومين في `IMAGE_HOSTS` (شغّل `list-image-hosts.js` عشان تعرف الدومينات) وأعد تشغيل `npm run dev`.

## التصميم (`tailwind.config.js`)
| Token | القيمة |
|---|---|
| `cream` / `surface` / `ink` | `#FBF3F0` / `#FFFDFB` / `#2B1B24` |
| `gold` (+light/dark) | `#C9A15B` / `#E3C58A` / `#A67F3E` |
| `rose` (+light) / `berry` | `#E8B4B8` / `#F3D6D8` / `#8C2F39` |
| `screens` | xs 420، sm 640، md 768، lg 1024، xl 1280، 2xl 1536 |
| Animations | `swatch-in`, `pulse-glow`, `blob-pulse`, `shimmer`, `dust-float` |

## الـ SEO
`metadata` عام في `layout.jsx`، ولكل منتج: title/description/OG/canonical + JSON-LD (`Product`: اسم/صور/براند/سعر/توفر). ⏳ `sitemap.xml` و`robots.txt` لسه ❌ (`12` B14).

## نقاط انتباه
- أسماء الملفات **case-sensitive على Linux/Vercel**: `ProductView.jsx` مش `Productview.jsx` (ويندوز بيسامح).
- `useCartStore` بيتقرا من localStorage وقت التحميل: لو ظهر تحذير hydration في عدّاد الـ Navbar، الحل `skipHydration` + rehydrate في effect (⏳ لم يُلاحَظ/يُختبر).
