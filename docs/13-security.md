# 13. الأمان

**آخر تحديث:** 2026-10-18. ⚠️ ده توثيق لللي عملناه، **مش مراجعة أمنية مستقلة**. ننصح بمراجعة مهندس قبل الإطلاق.

## الأسرار
| البند | الوضع |
|---|---|
| مكان الأسرار | `server/.env` (`MONGODB_URI`, `WC_CONSUMER_KEY/SECRET`)، و`frontend/.env.local` (عناوين بس، مفيش أسرار). على الاستضافة: Environment Variables |
| Git | `.gitignore` بيستثني `.env*` (ما عدا `*.example`)، و`sync-*.txt`، و`price-report.txt`، و`*.log` (فيها `crash.log`) |
| مفاتيح WooCommerce | **على السيرفر بس**، المتصفح مابيكلّمش WooCommerce أبدًا |
| ⚠️ **حادثة** | `server/.env` كان جوه zip اتبعت لأداة خارجية. **لازم يتغيّر المفتاحين قبل الإطلاق** (B19) |

**تغيير المفاتيح:**
- **WooCommerce:** Settings ← Advanced ← REST API ← Add key (Read/Write) ← حدّث `.env` ← `node src/scripts/test-woocommerce-connection.js` ← امسح القديم.
- **MongoDB Atlas:** Database Access ← Edit User ← Edit Password (Autogenerate، حروف وأرقام) ← حدّث `MONGODB_URI`. الأفضل يوزر منفصل للإنتاج بصلاحية `readWrite` على الداتابيز دي بس.

## حماية الـ API
| الحماية | التفاصيل |
|---|---|
| CORS | قايمة origins صريحة (`CLIENT_ORIGIN`). الـ origin المرفوض بيتسجّل في اللوج |
| Rate limiting | `POST /api/orders`: 10/10 دقايق/IP. `GET /api/orders/status/:key`: 60/دقيقة. ⚠️ في الذاكرة (instance واحد) |
| `helmet` | security headers |
| حد الـ body | 20KB |
| Validation | على الحدود (`validators/orderInput.js`): موبايل مصري، حدود الحقول، 99 كحد أقصى للكمية |
| الأسعار | **من السيرفر** (الداتابيز + WooCommerce)، العميل مابيبعتش سعر |
| منتج سعره ≤ 0 | الأوردر بيرفضه (`no_price`) |
| Idempotency | مفتاح عشوائي لكل محاولة، يمنع الأوردر المكرر (D-11) |
| أخطاء | `500` عام للعميل، التفاصيل في اللوج بس. الأخطاء المتوقعة برسائل واضحة |
| Regex في البحث | `escapeRegex` (منع ReDoS) |
| استعلام حالة الأوردر | بالمفتاح العشوائي الطويل (UUID)، والرد مفيهوش بيانات شخصية |

## الخصوصية
- سجل الأوردرات الداخلي **مفيهوش** اسم/تليفون/عنوان (D-12)، وبيتمسح بعد 180 يوم.
- بيانات العميل بتروح WooCommerce بس.
- لوج السيرفر بيسجّل أول 8 حروف من مفتاح الأوردر ورقمه، مش بيانات العميل. ⏳ ما اتعملتش مراجعة كاملة للوج.

## المحتوى (XSS)
- وصف المنتج HTML بيتنضّف وقت الـ sync (`sanitize-html`، قايمة تاجات محدودة، روابط `http/https/mailto/tel` بس، `rel="noopener noreferrer"`)، فـ `dangerouslySetInnerHTML` آمن. **ما تعرضش HTML خام من WooCommerce أبدًا.**
- JSON-LD في صفحة المنتج بيعمل escape لـ `<`.

## الواجهة
- `next/image` بدومينات مسموحة بس (`somuchstores.com` + `IMAGE_HOSTS`): بيمنع استغلال الـ image optimizer.
- headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.

## فجوات معروفة ⚠️
| الفجوة | الأثر |
|---|---|
| مفيش **Content-Security-Policy** | حماية XSS أضعف |
| مفيش Authentication (مفيش admin أصلاً، وكل الإدارة في WooCommerce) | مفيش سطح هجوم إداري على موقعنا، بس `/login` شكل فقط |
| Atlas Network Access `0.0.0.0/0` للاستضافات من غير IP ثابت | الحماية بالباسورد والصلاحيات بس |
| مفيش مراقبة/تنبيهات (monitoring) ولا سياسة backups موثّقة | ⏳ راجع إعدادات Atlas |
| `npm audit` ما اتشغّلش | ⏳ B10 |
| مفيش CAPTCHA/honeypot على الأوردر | الـ rate limit بس |
| rate limit في الذاكرة | لو أكتر من instance، كل واحد بعدّاده |
| الـ dev overlay قال Next.js outdated | ⏳ ترقية |
| مفيش اختبار اختراق | ❌ |

## قبل الإطلاق (Checklist)
- [ ] تغيير مفاتيح WooCommerce وMongoDB (B19)
- [ ] `git status` و`git grep --cached` بحثًا عن مفاتيح قبل أول commit
- [ ] الـ repo **Private**، والمراجع collaborator (مش `.env`)
- [ ] `npm audit` للمجلدين
- [ ] `CLIENT_ORIGIN` = دومين الإنتاج بالظبط
- [ ] `TRUST_PROXY=1` على الاستضافة
- [ ] يوزر MongoDB بصلاحيات `readWrite` فقط
- [ ] مراجعة مستقلة للأوردر والـ checkout
