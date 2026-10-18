'use client'

import { useMemo } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'

// ⚡ بنكرر مصفوفة البراندات مرتين عشان اللوب يبان متصل وسلس حتى لو
// عدد البراندات الأصلي قليل (4-5)، من غير فراغات واضحة في الدورة.
// useMemo هنا مهم: من غيره الأراي كانت بتتبني من جديد في كل render،
// وده بيخلي Embla (اللي بيراقب identity بتاع الأوبشنز/البلجنز)
// يعيد التهيئة (destroy + init) من غير داعي.
export default function BrandsCarousel({ brands }) {
  const looped = useMemo(() => [...brands, ...brands], [brands])

  const plugins = useMemo(
    () => [
      AutoScroll({
        speed: 0.6,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        // ⚡ بيوقف الحركة تلقائيًا لو المستخدم مفعّل "تقليل الحركة"
        // من إعدادات نظام التشغيل — نفس المبدأ المطبّق على باقي
        // أنيميشن الموقع في globals.css، بس هنا لازم نضبطه يدويًا
        // لأن AutoScroll بيتحرك بـ requestAnimationFrame مش CSS.
        playOnInit:
          typeof window === 'undefined' ||
          !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      }),
    ],
    []
  )

  const [emblaRef] = useEmblaCarousel({ loop: true, dragFree: true, align: 'start' }, plugins)

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div
        className="flex cursor-grab active:cursor-grabbing"
        role="list"
        aria-label="Brand partners"
      >
        {looped.map((brand, i) => {
          // ⚡ النص الأصلي (النص المكرر) لازم يتخفي عن screen readers —
          // من غيره أدوات القراءة الصوتية هتنطق كل اسم براند مرتين.
          const isDuplicate = i >= brands.length
          return (
            <div
              key={i}
              role={isDuplicate ? 'presentation' : 'listitem'}
              aria-hidden={isDuplicate || undefined}
              className="mx-8 flex flex-shrink-0 items-center py-2"
            >
              <span
                className={`select-none whitespace-nowrap text-lg text-ink/40 transition-colors hover:text-ink/70 ${brand.className ?? ''}`}
              >
                {brand.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
