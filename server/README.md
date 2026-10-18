# SoMuch — Backend (Express + MongoDB)

مشروع منفصل تمامًا عن الفرونت إند (Next.js) - ليه package.json ومسار
نشر خاص بيه. السبب: خدمتين مختلفتين تمامًا (Node runtime مختلف،
dependencies مختلفة، ودورة نشر مستقلة)، فمش منطقي يتحطوا في نفس
المشروع.

## التشغيل محليًا

```bash
cd server
npm install
cp .env.example .env
# افتح .env واملأ MONGODB_URI بالبيانات الحقيقية بتاعتك من MongoDB Atlas
npm run seed   # يرفع المنتجات لقاعدة البيانات (مرة واحدة، أو كل ما تتغيّر البيانات)
npm run dev    # يشغّل السيرفر على http://localhost:4000
```

## الـ Endpoints

```
GET /api/products?category=lipstick&department=makeup&brand=cybele&tag=bestseller&onSale=true&minPrice=100&maxPrice=500&page=1&limit=20&search=matte
GET /api/products/slug/:slug   ← بتستخدمها صفحة تفاصيل المنتج (/product/[slug])
GET /api/products/:id
GET /api/health
```

## مثال Response

```json
{
  "data": [ { "_id": "...", "name": "...", "slug": "...", "brand": "Cybele", "tag": "Almost Gone", ... } ],
  "pagination": { "page": 1, "limit": 20, "totalItems": 12, "totalPages": 1 }
}
```

## ملاحظة مهمة عن الأداء

الـ `category`, `department`, `brandSlug`, `customTagSlug` عليهم index في
الـ Schema، والبحث بيستخدم Text Index. دول كلهم ضروريين عشان الفلترة/
البحث يفضلوا سريعين حتى لو الكتالوج وصل لآلاف المنتجات — مفيش أي فلتر
بيعتمد على regex أو collection scan.
