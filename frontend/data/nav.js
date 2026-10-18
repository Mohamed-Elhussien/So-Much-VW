// ⚡ مصدر بيانات القوائم — الـ Navbar بيقرأ من هنا بس، مش في JSX مكرر
// لكل مستوى. لما نبني الـ Express API بعدين، أسهل حاجة هي نستبدل
// المصفوفة دي بنتيجة fetch('/api/categories') من غير ما نلمس أي
// كومبوننت رندر خالص — الشكل (columns/links) هيفضل زي ما هو.
//
// ⚡ department/type الجداد دول هما اللي بيخلوا Navbar/MegaMenuPanel
// يقدروا يبنوا روابط /shop حقيقية (buildShopHref) بدل placeholders:
// - department على مستوى الـ NAV item نفسه: كل الأعمدة تحته بتنتمي
//   لنفس الـ department (زي Make Up، Hair And Skin Care، Fragrance).
// - department على مستوى العمود (column.department): لما عمود واحد
//   جوه نفس القايمة يمثّل department مختلف (زي "More" اللي بتجمع
//   Accessories/Leather/Tools مع بعض).
// - type: 'brand' على قايمة "Brands": هنا الـ heading نفسه هو
//   الـ department، والـ items هي أسماء براندات فعلية (مش تصنيفات
//   فرعية)، فلازم نميزها عشان نبني الرابط صح (?brand= بدل ?category=).
export const NAV = [
  { label: 'Home', href: '/', isHome: true },

  {
    label: 'Brands',
    type: 'brand',
    columns: [
      {
        heading: 'Make Up',
        department: 'makeup',
        items: ['Amanda', 'Flormar', 'Catrice', 'Cybele', 'Essence', 'Maybelline', 'Topface'],
      },
      {
        heading: 'Hair and Skin Care',
        // ⚡ لازم يطابق بالظبط القيمة اللي المزامنة الحقيقية بتحطها في
        // department (راجع DEPARTMENT_BY_SLUG في server/src/lib/wooCategoryMap.js)
        // — 'haircare' القديمة ماكانتش بتطابق حاجة فعلية، فكانت بترجع
        // صفر منتج دايمًا مهما كان عددهم الحقيقي.
        department: 'hair-and-skin-care',
        items: ['Bling Pop', 'Bobana', 'Care & More', 'Garnier', "L'Oreal Paris", 'Mood', 'Nutshell'],
      },
    ],
  },

  {
    label: 'Make Up',
    department: 'makeup',
    columns: [
      { heading: 'Eye', items: ['Dipliner', 'Eye Cream', 'Eyebrow', 'Eyeliner', 'Eyeshadow', 'Kohl', 'Mascara'] },
      {
        heading: 'Face',
        items: ['BB Cream', 'Blusher', 'Bronzer', 'Concealer', 'Contour', 'Corrector', 'Foundation', 'Fix Spray', 'Highlighter', 'Powder', 'Primer'],
      },
      { heading: 'Lip', items: ['Lip Gloss', 'Lip Liner', 'Lipstick', 'Liquid Lipstick'] },
      { heading: 'Nail Polish', items: [] },
      { heading: 'Nail Polish Remover', items: [] },
      { heading: 'Palettes', items: [] },
    ],
  },

  {
    label: 'Hair And Skin Care',
    department: 'hair-and-skin-care',
    columns: [
      {
        heading: 'Body',
        items: ['Cream', 'Hair Removal', 'Lotion', 'Scrub', 'Shower Gel', 'Soap', 'Wash For Sensitive Skin', 'Deodorant'],
      },
      { heading: 'Face', items: ['Cream', 'Eye', 'Mask', 'Eyebrow Gel', 'Lip Therapy', 'Makeup Remover', 'Serum'] },
      { heading: 'Hair', items: ['Coloring', 'Conditioner', 'Cream', 'Gel', 'Hair Perfume', 'Leave-In', 'Mask', 'Oil', 'Serum', 'Shampoo'] },
      { heading: 'Hand', items: ['Cream', 'Scrub', 'Lotion'] },
    ],
  },

  {
    label: 'Fragrance',
    department: 'fragrance',
    columns: [
      { heading: 'Body Splash', items: ['Men', 'Unisex', 'Women'] },
      { heading: 'Body Spray', items: [] },
    ],
  },

  {
    label: 'More',
    columns: [
      { heading: 'Accessories', department: 'accessories', items: ['Bracelet', 'Earring', 'Necklace'] },
      { heading: 'Leather', department: 'leather', items: ['Bags', 'Hat for kids', 'Hat for women', 'Wallets'] },
      { heading: 'Tools, Nails and Lashes', department: 'tools-nails-and-lashes', items: ['Comb', 'Face Brush', 'Hair Brush', 'Hair Clips', 'Lashes', 'Sharpener'] },
    ],
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
]