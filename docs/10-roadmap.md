# 10. خريطة الطريق: اللي لسه ناقص

**آخر تحديث:** 2026-10-08. المصدر: التقرير الفني + الشغل الأخير.

## قبل النشر الأول (ضروري)
| # | المهمة | ملاحظة |
|---|---|---|
| 1 | تشغيل الـ sync بالنسخة الجديدة | `wooVariationId` + ألوان الشيدات + التصنيف |
| 2 | **أوردر تجريبي على الـ staging** | حاولت قبل كده وفشل الرد (`08` P-28). أعد التجربة بعد التعديلات وراجع لوج السيرفر. راجع `07` |
| 2b | `verify-prices.js` بعد الـ sync | `08` P-27 |
| 3 | `remove-demo-products.js` | مش بتتباع |
| 4 | تحويل صفحة المنتج لـ Server Component | `07`، واختبار `npm run build` |
| 5 | `list-image-hosts.js` ← `IMAGE_HOSTS` | وإلا الصور تبوّظ |
| 6 | `.gitignore` في الـ root + `git status` | `08` P-23 |
| 7 | تغيير مفاتيح WooCommerce/MongoDB لو الـ zip اتشارك | `08` P-24 |
| 8 | قرار استضافة الـ Express (Render/Railway/Fly) + دومين | `06` |

## بعد النشر
| المهمة | الأولوية | ملاحظة |
|---|---|---|
| **Webhooks** (منتج/مخزون/سعر ← MongoDB + `revalidateTag`) | عالية | المخزون أهم حاجة |
| معالجة المنتجات المحذوفة/المسحوبة في الـ sync | عالية | ⏳ مش موجود |
| حقل بريد إلكتروني اختياري في الـ checkout | متوسطة | تأكيد للعميل |
| الشحن بالمحافظة + مصدر واحد للقيمة | متوسطة | D-13 |
| فحص مخزون بالكمية (مش متاح/مش متاح بس) | متوسطة | مع الـ webhooks |
| `sitemap.xml` و`robots.txt` | متوسطة | SEO |
| حسابات العملاء (JWT على WordPress) | قرار | `/login` شكل فقط |
| بوابة دفع (Paymob/Fawry) | قرار تجاري | |

## تحسينات
- تنضيف WooCommerce: حقل Brands لكل منتج، أقسام hierarchical، حذف المنتجات التجريبية، إصلاح الأسماء التالفة (`R?my`)، منتجين variable من غير variations (`Luna Special Lip Moisturizer`, `Luna Nail Lacquer`).
- ألوان شيدات حقيقية من صور الـ variations (D-16).
- توحيد التصنيفات المستنتجة مع أقسام WooCommerce، وروابط الـ nav الفرعية (`cream` مثلًا) مع slugs اللي فعلاً في الداتا (`cream-face-hair-and-skin-care`).
- `ProductCard`: عرض أول N شيد + "+X" لما الشيدات كتير (17 شيد = صفين، وفيه منتج بـ **73 شيد** هيملا الكارت).
- تأكيد/معالجة تحذير hydration لعدّاد السلة (`05`).
- backends حقيقية لـ `/contact` والـ Newsletter و`UserMenu`.
- تحديث الـ README القديمة (`frontend/README.md`, `server/README.md`, `server/DATA_HANDOFF.md`)، وتجميع `server/docs/tasks/` تحت `docs/`.
