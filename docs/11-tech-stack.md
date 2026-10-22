# 11. الأدوات والمكتبات (Tech Stack)

**آخر تحديث:** 2026-10-18. المصدر: `package.json` للمجلدين + اللي اتثبّت أثناء الشغل. الإصدارات الدقيقة في `package-lock.json` (هو المرجع).

## الصورة الكبيرة
| الطبقة | الاختيار | ليه |
|---|---|---|
| الواجهة | Next.js 14 (App Router) + React 18 | SSR/ISR للـ SEO، وتقسيم Server/Client Components |
| الـ API | Express 4 + Mongoose 8 | بسيط ومعروف، ومناسب لنسخة قراءة سريعة من WooCommerce |
| قاعدة البيانات | MongoDB Atlas | مرنة لمنتجات بشيدات/وصف HTML، وجاهزة على السحابة |
| مصدر الحقيقة | WooCommerce REST API v3 | صاحب المتجر متعوّد على لوحته (D-01) |
| الاستضافة (مخطط) | Vercel (الواجهة) + Render (الـ API) | D-15 |
| الكود | GitHub (Private) | مطلوب لـ Vercel وRender |

## الواجهة (`frontend/`)
| المكتبة | الإصدار (من `package.json`) | الاستخدام |
|---|---|---|
| `next` | ^14.2 (اتثبّت 14.2.35) | الإطار. ⚠️ الـ dev overlay قال إنه outdated: ترقية في الـ roadmap |
| `react`, `react-dom` | ^18.3 | |
| `zustand` | ^4.5 | السلة (`persist` على localStorage) |
| `tailwindcss` + `postcss` + `autoprefixer` | ^3.4 / ^8.4 / ^10.4 | التصميم (tokens في `tailwind.config.js`) |
| `framer-motion` | ^11 | حركات الكروت والأقسام. ⚠️ بيطلع تحذير `motion() is deprecated` في الـ Console (مش بيكسر حاجة) |
| `embla-carousel-react` + `auto-scroll` | ^8.1 | الـ carousels |
| `@radix-ui/react-navigation-menu`, `react-avatar` | ^1.2 | الـ Mega menu والـ avatar |
| `lucide-react` | ^0.383 | الأيقونات |
| `clsx`, `tailwind-merge` | ^2.1 / ^2.3 | دمج class names |
| الخطوط | Fraunces (عناوين) + Manrope (نص) | `font-display` / `font-body` |

السكريبتات: `dev`، `build`، `start`، `lint`. **وضع الإنتاج (`start`) مابيحدّثش نفسه: أي تعديل محتاج `build` جديد.**

## الـ Backend (`server/`)
| المكتبة | الإصدار | الاستخدام |
|---|---|---|
| `express` | ^4.19 | السيرفر. ⚠️ Express 4 مابيلقطش أخطاء الـ async handlers لوحده: كل handler بيستخدم `try/catch` + `next(err)` |
| `mongoose` | ^8.4 | الـ models |
| `cors` | ^2.8 | CORS بقايمة origins |
| `dotenv` | ^16.4 | `.env` |
| `helmet` | (اتثبّت لاحقًا) | security headers |
| `express-rate-limit` | v7 (اتثبّت لاحقًا) | حد على الأوردرات (10/10 دقايق) |
| `sanitize-html` | (اتثبّت لاحقًا) | تنضيف وصف المنتج HTML وقت الـ sync |
| `he` | (اتثبّت لاحقًا) | فك HTML entities (`&amp;`) |

السكريبتات: `dev` (`node --watch`)، `start` (`node src/index.js`)، `seed` (ديمو قديم، **لا تشغّله**).
**الاستضافة بتستخدم `start`.** (`--watch` للتطوير بس، وراجع `08` P-28.)

المتطلبات: **Node 22.x** (اتطوّر واتختبر عليه؛ بنعتمد على `fetch` المدمج و`node:test`). `engines` لازم تكون `22.x` مش `>=20`: `>=20` خلّت Render يختار Node 26 (`08` P-37).

## الخدمات الخارجية
| الخدمة | الاستخدام | ملاحظات |
|---|---|---|
| MongoDB Atlas | قاعدة البيانات | Network Access: IP allowlist. للاستضافات من غير IP ثابت بيحتاج `0.0.0.0/0` (قرار أمني في `13`) |
| WooCommerce REST API v3 | منتجات + variations + إنشاء أوردرات | staging: `test1.somuchstores.com`. مفتاح Read/Write |
| GitHub | الكود | Private + collaborators |
| Vercel / Render | النشر | ⏳ لسه ما اتنشرش |

## أدوات التطوير والاختبار
| الأداة | الاستخدام |
|---|---|
| VS Code + Git | التطوير، ورفع الكود من الـ Source Control |
| PowerShell (Windows) | الأوامر. ⚠️ `[slug]` محتاجة `-LiteralPath`، والعربي ممكن يظهر مبعثر (`chcp 65001`) |
| `node --test` (`node:test`) | **42 اختبار backend**: الأوردرات (17)، `woo.js` ضد سيرفر HTTP محلي (8)، التصنيف (6)، الأسعار (7)، ألوان الشيدات (4)، إلخ. من غير مكتبات |
| DevTools (Console/Network) | تشخيص الأوردر والـ CORS |
| سكريبتات التشخيص في `server/src/scripts/` | راجع `02` |

## اللي ما استخدمناهوش (وليه)
| بديل | ليه لأ حاليًا |
|---|---|
| TypeScript | المشروع JS من البداية. ممكن لاحقًا |
| zod (validation) | validation يدوي قصير ومختبَر (D-17) |
| اختبارات للواجهة (Jest/Playwright) | ⏳ **مش موجودة**: فجوة معروفة (`12`) |
| Redis لـ rate limit | الـ store في الذاكرة: مناسب لـ instance واحد |
| CI/CD (GitHub Actions) | ⏳ لسه: ممكن يشغّل `node --test` و`next build` على كل push |
| Docker | الاستضافات المختارة بتبني من الكود مباشرة |
| مكتبة بوابة دفع | COD فقط حاليًا |
