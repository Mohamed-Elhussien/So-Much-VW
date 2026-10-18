# 03. المزامنة مع WooCommerce والتصنيف

**الكود:** `server/src/scripts/sync-woocommerce-products.js` + `src/lib/wooCategoryMap.js` + `src/lib/shadeTones.js`
**التشغيل:** `node src/scripts/sync-woocommerce-products.js` (من `server`) &nbsp;|&nbsp; **الحالة:** يدوي، وWebhooks لسه ❌

## الفكرة
WooCommerce بيخزّن كل حاجة مسطّحة (القسم والنوع والبراند والجمهور كلهم في `categories` واحدة، والوصف HTML). الـ sync بيحوّل ده لـ schema مرتبة،
ومش بيخمّن بصمت: أي حاجة مش واثق منها بتتسجّل في تقرير.

## خطوات الـ sync
1. يجيب كل المنتجات (كل الصفحات، 100/صفحة). غير المنشورة بتتجاهل.
2. لكل منتج `mapWooProductToOurSchema`:
   - فك الـ HTML entities من الاسم وأسماء الـ categories والـ brands (`he.decode`): `Dolce &amp; Gabbana` ← `Dolce & Gabbana`.
   - `categorizeProduct` ← `department / category / brand` (تحت).
   - المنتجات `type=variable`: يجيب **كل** الـ variations (مش أرخص واحدة بس)، ولكل واحد سعره ومخزونه وصورته و`wooVariationId`.
     سعر المنتج الأساسي = أرخص اختيار متوفر (للكارت والفلتر).
   - ألوان الشيدات: `distinctTones(n)` (تحت).
   - الوصف: `description` (نص) + `descriptionHtml` + `shortDescription` (HTML منضّف).
3. Upsert بـ `wooId` (idempotent: تشغيله أكتر من مرة آمن). الـ slug بيتحسب في `pre('save')`.
4. يطبع ملخص ويكتب `server/sync-report.txt` (ما ترفعوش على Git).

## ربط الحقول
| WooCommerce | MongoDB | ملاحظة |
|---|---|---|
| `id` | `wooId` | مفتاح الـ upsert |
| `name` | `name` | بعد فك entities |
| `regular_price` / `sale_price` + `on_sale` / `stock_*` | `price` / `salePrice` / `stock` | `salePrice` بيتاخد بس لو `on_sale=true` وأقل من الأصلي (WooCommerce بيحتفظ بـ `sale_price` لعروض لسه ما بدأت أو خلصت). للـ variable: من **أرخص variation متوفرة بالسعر الفعلي (بعد الخصم)**؛ لو `stock_quantity` فاضي: `instock ? 1 : 0` |
| `images[].src` | `images[]` | |
| `description` | `description`, `descriptionHtml` | |
| `short_description` | `shortDescription` | |
| `variations[]` | `variants[]` | `attributes[0].option` ← `colorName` |
| `variation.id` | `variants[].wooVariationId` | لازم لإرسال الأوردر |

## حل `department / brand / category` (`wooCategoryMap.js`)
**الأولوية دايمًا لبيانات WooCommerce، والاستنتاج من الاسم fallback بس.**

| الحقل | الترتيب |
|---|---|
| **brand** | 1) حقل `brands` الرسمي ← 2) category اسمها براند معروف ← 3) علامة المتجر (باقات `Summer Bag` ← **So Much**) ← 4) مطابقة الاسم بـ `KNOWN_BRANDS`/`BRAND_ALIASES` ← 5) `Unbranded` + مراجعة |
| **department** | 1) category slug موجودة في `DEPARTMENT_BY_SLUG` ← 2) استنتاج من الاسم (`DEPARTMENT_NAME_RULES`) ← 3) قسم افتراضي للبراند (`BRAND_DEFAULT_DEPARTMENT`) ← 4) `uncategorized` + مراجعة |
| **category** | 1) category فرعية متبقية بعد استبعاد القسم/البراند (الأطول المتطابقة مع الاسم) ← 2) استنتاج من الاسم (`CATEGORY_NAME_RULES`) ← 3) `other` + مراجعة |

**التطبيع (`normalize`)**: lowercase، شيل الأكسنت (Rémy ← remy)، `&`/`&amp;`/`and` ← مسافة، شيل علامات الاقتباس (L'Oreal ← loreal)،
وأي رمز تاني ← مسافة. بكده `Dolce & Gabbana` = `dolce-gabbana`.

**مطابقة البراند من الاسم:** على حدود الكلمات + الأطول أولًا (`maison alhambra` قبل `alhambra`). البراندات اللي اسمها كلمة عادية
(`essence`, `mood`, `eva`, `luna`, `passport`, `korean`, `almas`) بتتطابق بس لو في **أول الاسم أو بعد `by`**
(عشان "Skin Relief **Essence**" ما يتحسبش منتج براند Essence).

**قواعد الاستنتاج** مبنية على تقسيم الـ nav عند صاحب المتجر (`frontend/data/nav.js`): مثلاً Body Splash/Spray تحت Fragrance، Deodorant تحت Skin Care.
الترتيب مهم (أول قاعدة تتطابق تكسب): العطر (EDP/EDT) ثم الأدوات (brush/comb) ثم العناية ثم الـ mist/splash ثم المكياج.
أمثلة: `Beter ... Shampoo Brush` ← tools (brush قبل shampoo)، `Underarm spray` ← skin care (مش fragrance).

### إزاي توسّع الجداول (في `wooCategoryMap.js`)
| عايز... | عدّل |
|---|---|
| براند جديد | `KNOWN_BRANDS` (slug بشرطات). لو فيه `&` أو أكسنت ضيفه في `BRAND_DISPLAY` |
| اسم بديل/typo/خط فرعي لبراند | `BRAND_ALIASES` (المفتاح بعد التطبيع: مثلاً `'victor rolf'`) |
| براند ملوش اسم في المنتج (باقات المتجر) | `OWN_LABEL_PATTERNS` |
| قسم افتراضي لبراند | `BRAND_DEFAULT_DEPARTMENT_RAW` |
| قاعدة قسم/نوع من الاسم | `DEPARTMENT_NAME_RULES` / `CATEGORY_NAME_RULES` (راعي الترتيب) |
| slug قسم من WooCommerce | `DEPARTMENT_BY_SLUG` |

بعد أي تعديل: `node --test test/wooCategoryMap.test.js` ثم أعد الـ sync وراجع `sync-report.txt`.

## الوصف المنسّق (HTML)
الوصف في WooCommerce HTML فيه عناوين وقوايم وجدول وFAQ. **مش بنفكّكه لحقول** (parsing بيتكسر لو القالب اتغيّر)، بنخزّنه منضّف:
`sanitize-html` بقايمة تاجات محدودة: `h2,h3,h4,p,br,strong,b,em,i,ul,ol,li,table,thead,tbody,tr,th,td,hr,a,span,div`،
روابط `http/https/mailto/tel` فقط، وكل `<a>` بياخد `rel="noopener noreferrer" target="_blank"`. مفيش `script/style/iframe/img` ولا event handlers.
وده اللي بيخلّي `dangerouslySetInnerHTML` في الفرونت آمن. التنسيق بيجي من `.rich-text` في `globals.css`.

## ألوان الشيدات (`shadeTones.js`)
WooCommerce مابيدّيش لون حقيقي للشيد (اسمه نص). القديم: 6 ألوان باستيل بـ hash على الاسم = تكرار حتمي في أي منتج فيه شيدات كتير.
الجديد: ترتيب ثابت من الألوان بخوارزمية **farthest-point** في فراغ CIELAB (الفرق الإدراكي): كل لون جديد أبعد ما يمكن عن كل اللي قبله.
- مفيش شيدين متشابهين: أقل ΔE ≈ **26** لـ 17 شيد، ≈ 24 لـ 20، ≈ 14 لـ 60 (العين بتلاحظ من ≈ 2).
- `distinctTones(n)` = أول n من نفس الترتيب ← إضافة شيد جديد ما بتغيّرش ألوان اللي قبله.
- نطاق "ناعم" (لا نيون ولا غامق) عشان يليق بتصميم الموقع. دي ألوان **تمييزية**، مش لون الشيد الحقيقي.

## التقارير
| القسم | المعنى | الإجراء |
|---|---|---|
| **محتاج مراجعة** | حاجة ناقصة فعلاً (مفيش براند/قسم/نوع، أو variable من غير variations) | تصليح يدوي في WooCommerce أو إضافة قاعدة |
| **مستنتج من الاسم** | الكود استنتج قسم/نوع من اسم المنتج | راجع عينة في `sync-report.txt` |

آخر تشغيل مسجّل: **1825 منتج، 20 محتاج مراجعة** (15 نوع، 6 براند، 3 قسم، 2 variable بلا variations)، 166 مستنتج (58 قسم، 156 نوع).
الباقي غالبًا: منتجات تجريبية (`whatsapp product`, `loli`, أسماء عربية)، `Jean Antoine Collection`, `Tutti Frutti`.

## بيانات WooCommerce اللي بتتعدّل في الـ sync
- **مخزون سالب** (backorder) ← 0.
- **شيد من غير سعر** (أو `purchasable=false`) ← غير متاح.
- **منتج سعره 0** ← بيتسجّل في "محتاج مراجعة" (`price: ...`).

## التحقق من الأسعار
`node src/scripts/verify-prices.js` (للقراءة فقط) بيقارن كل منتج وشيد في MongoDB بسعر WooCommerce الحي (`price` الفعلي) ويفحص التناسق الداخلي. التقرير: `server/price-report.txt`. المنطق في `lib/priceCheck.js` (مختبر). شغّله بعد أي sync كبير وقبل الإطلاق.

## حدود معروفة
- **يدوي**: التعديلات في WooCommerce مش بتظهر إلا بعد تشغيله (لحد الـ webhooks).
- **متسلسل**: منتج بمنتج (بيجيب variations كل منتج variable بطلب منفصل)، فبياخد دقايق للكتالوج كله.
- **الحذف**: ⏳ ما لقيتش في الكود منطق بيشيل/يخفي منتج اتحذف أو اتسحب من WooCommerce بعد ما اتزامن. تأكد قبل الاعتماد عليه.
- التصنيفات المستنتجة (`serum`, `sun-care`, `pads`, `sets`...) مش موجودة في WooCommerce، وممكن تتكرر مع slugs زي `cream-face-hair-and-skin-care`. الحل الأنضف: تنضيف الأقسام في WooCommerce.
- أسماء فيها `?` (`R?my`) تلف في المصدر: بتتطابق بـ alias لكن الاسم المعروض يفضل تالف لحد ما يتصلّح في WooCommerce.
