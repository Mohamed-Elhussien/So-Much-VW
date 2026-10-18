'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { buildShopHref } from '@/lib/buildShopHref'

// ⚡ الـ state هنا محلي جوه الكومبوننت بس (مش global) — كل قايمة
// بتفتح بتاخد نسخة جديدة من الحالة، فمفيش أي تسريب أو تعارض بين
// أكتر من قايمة مفتوحة في نفس الوقت.
//
// props:
// - columns: نفس شكل NAV[i].columns
// - navType: 'brand' لقايمة "Brands" (items بتاعتها أسماء براندات)،
//   undefined لأي حاجة تانية (items بتاعتها تصنيفات/categories)
// - parentDepartment: الـ department المشترك لكل الأعمدة، لو موجود
//   (Make Up/Hair And Skin Care/Fragrance). لو كل عمود ليه department
//   خاص بيه (زي "More")، بيتقرا من column.department بدل كده.
// - shopAllHref: رابط اختياري لـ "Shop all {Label}" بيتعرض فوق العمود
//   الأول — بيتحسب في Navbar.jsx مش هنا، عشان المكوّن ده يفضل بسيط.
export default function MegaMenuPanel({ columns, navType, parentDepartment, shopAllHref }) {
  // ⚡ null = مفيش عمود مفتوح افتراضيًا. العمود يفتح بس لما المستخدم
  // يحوّم فوقه فعليًا (onMouseEnter/onFocus تحت)، مش قيمة ابتدائية.
  const [activeIndex, setActiveIndex] = useState(null)
  const active = activeIndex !== null ? columns[activeIndex] : null

  return (
    <div>
      {shopAllHref && (
        <a
          href={shopAllHref}
          className="block border-b border-ink/10 px-4 py-2.5 text-sm font-semibold text-gold-dark transition-colors hover:bg-ink/5"
        >
          Shop all →
        </a>
      )}

      <div className="flex divide-x divide-ink/10">
        {/* العمود الأول — أسماء التصنيفات */}
        <ul className="flex w-52 flex-shrink-0 flex-col py-2">
          {columns.map((col, i) => {
            const department = col.department ?? parentDepartment
            const hasChildren = col.items.length > 0

            // ⚡ لو العمود مفهوش عناصر فرعية (زي "Nail Polish")، الـ
            // heading نفسه هو التصنيف النهائي — يبقى لينك حقيقي
            // بدل زرار hover مايودّيش لحته.
            const leafHref = !hasChildren
              ? navType === 'brand'
                ? buildShopHref({ department }) // مفيش براندات معروضة، فيرجع لكل قسم الـ department
                : buildShopHref({ department, category: col.heading })
              : null

            return (
              <li key={col.heading}>
                {leafHref ? (
                  <a
                    href={leafHref}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-ink/70 transition-colors duration-200 hover:bg-ink/5 hover:text-ink"
                  >
                    {col.heading}
                  </a>
                ) : (
                  <button
                    onMouseEnter={() => setActiveIndex(i)}
                    onFocus={() => setActiveIndex(i)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors duration-200 ${
                      i === activeIndex ? 'bg-ink/5 font-semibold text-ink' : 'text-ink/70 hover:bg-ink/5'
                    }`}
                  >
                    {col.heading}
                    <span className="text-ink/30">›</span>
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        {/* العمود الثاني — عناصر التصنيف النشط بس (لو فيه حاجة مختارة)،
            بيدخل ويخرج بحركة ناعمة بدل ما يظهر فجأة */}
        <AnimatePresence mode="wait">
          {active && active.items.length > 0 && (
            <motion.ul
              key={active.heading}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="grid w-56 grid-cols-1 gap-0.5 py-2"
            >
              {active.items.map((item) => {
                // ⚡ لازم نحسب الـ department بتاع العمود النشط هنا تاني
                // (بدل ما نستخدم متغير محسوب في scope تاني) — وأهم من
                // كده: لازم نستخدم قيمة الـ department الحقيقية
                // ("makeup") ولا أبدًا نص العرض الظاهر للمستخدم
                // ("Make Up") في بناء اللينك، وإلا الفلترة في صفحة
                // الـ shop هترجع "0 products" دايمًا (القيمة المخزنة
                // في المنتج مختلفة عن النص المعروض في القايمة).
                const department = active.department ?? parentDepartment
                const href =
                  navType === 'brand'
                    ? buildShopHref({ department, brand: item })
                    : buildShopHref({ department, category: item })

                return (
                  <li key={item}>
                    <a
                      href={href}
                      className="block px-4 py-2 text-sm text-ink/70 transition-colors duration-200 hover:bg-ink/5 hover:text-ink"
                    >
                      {item}
                    </a>
                  </li>
                )
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
