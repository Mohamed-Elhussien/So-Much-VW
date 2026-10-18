import { Palette, Droplet, Sparkles, CircleDot, Wand2, Paintbrush } from 'lucide-react'
import { buildShopHref } from '@/lib/buildShopHref'

// ⚡ category هنا لازم يطابق نفس قيمة الـ category المخزنة في
// المنتج (lib/categories.js فيه نفس القاموس ده لعرض الاسم بالظبط
// عكسيًا في صفحة المنتج/الكارت).
const CATEGORIES = [
  { label: 'Lipstick', category: 'lipstick', icon: Sparkles, tone: '#8C2F39' },
  { label: 'Foundation', category: 'foundation', icon: Paintbrush, tone: '#D8B48A' },
  { label: 'Eyeshadow', category: 'eyeshadow', icon: Palette, tone: '#C9A15B' },
  { label: 'Skincare', category: 'skincare', icon: Droplet, tone: '#E3C58A' },
  { label: 'Blusher', category: 'blusher', icon: CircleDot, tone: '#E8B4B8' },
  { label: 'Mascara', category: 'mascara', icon: Wand2, tone: '#2B1B24' },
]

export default function Categories() {
  return (
    <section id="shop" className="py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex gap-6 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none md:grid md:grid-cols-6 md:gap-4 md:overflow-visible">
          {CATEGORIES.map(({ label, category, icon: Icon, tone }) => (
            <a
              key={label}
              href={buildShopHref({ category })}
              className="group flex flex-shrink-0 flex-col items-center gap-3"
            >
              <span
                className="flex h-20 w-20 items-center justify-center rounded-full text-ink shadow-sm ring-1 ring-inset ring-ink/5 transition-transform duration-300 group-hover:-translate-y-1"
                style={{ backgroundColor: `${tone}33` }}
              >
                <Icon size={24} style={{ color: tone }} />
              </span>
              <span className="text-xs font-medium text-ink/70">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
