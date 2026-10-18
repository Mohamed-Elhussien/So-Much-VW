# SoMuch — نسخة تصميم أولى (Homepage)

## التشغيل محليًا
```bash
npm install
npm run dev
```
افتح http://localhost:3000

## البنية
- `data/products.json` — بيانات المنتجات (مؤقتة، تقدر تستبدلها بقاعدة بيانات حقيقية لاحقًا من غير ما تغيّر شكل الكومبوننتس).
- `store/useCartStore.js` — Zustand + persist (الكارت محفوظ في localStorage).
- `components/sections/*` — كل سكشن في الهوم بيدج لوحده، سهل تعدّل/تشيل/تضيف.
- `components/ui/*` — عناصر واجهة أساسية (Button, SwatchStrip) بأسلوب shadcn (كود مملوك، مش مكتبة تتحمل).

## ملاحظات
- الصور دلوقتي بديل مؤقت (سواتش لون المنتج نفسه) بدل صور فوتوغرافية حقيقية، لحد ما تتوفر صور المنتجات — وقتها هنستبدلها بـ `next/image` بسهولة.
- الموقع RTL بالكامل (`dir="rtl"` في الـ layout).
