import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

// ⚡ items: [{ label, href? }] — آخر عنصر عادةً من غير href (الصفحة
// الحالية نفسها، مش لينك).
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-ink/50">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={12} className="text-ink/25" />}
          {item.href ? (
            <Link href={item.href} className="uppercase tracking-wide transition-colors hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span className="uppercase tracking-wide text-ink/70">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
