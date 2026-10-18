import Link from 'next/link'
import SwatchStrip from '@/components/ui/SwatchStrip'
import { Heart, Leaf, Users } from 'lucide-react'

// ⚡ Server Component عادي (مفيش 'use client') — الصفحة دي كلها محتوى
// ثابت، مفيش أي تفاعل أو state، فمفيش أي داعي نبعت JS للمتصفح خالص
// عشانها. أسرع صفحة ممكنة (HTML جاهز من أول طلب، صفر JS إضافي).
//
// ⚡ ملحوظة: الصفحة دي مقصود تبقى بسيطة (wireframe) دلوقتي زي ما اتفقنا
// — بنفس ألوان وخطوط الموقع (font-display italic, ink/cream/gold)
// عشان تبقى محترمة ومتسقة، لحد ما نتفق على شكل نهائي أكتر تفصيلاً.

const VALUES = [
  {
    icon: Heart,
    title: 'Picked, not pushed',
    desc: "Every product earns its spot because it's genuinely good — not because a brand paid for the placement.",
  },
  {
    icon: Users,
    title: 'Real skin, real tones',
    desc: 'Shade ranges and recommendations built around how people actually look, not one narrow ideal.',
  },
  {
    icon: Leaf,
    title: 'No noise, no rush',
    desc: "We'd rather you buy one thing you'll finish than ten things you won't.",
  },
]

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-32 text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Our Story</span>
      <h1 className="mt-3 font-display text-4xl italic leading-tight text-ink md:text-5xl">
        Beauty, on your terms.
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink/60">
        so much. started from a simple frustration: most beauty shopping online means scrolling
        past whatever's trending on a stranger's algorithm this week. We wanted a place that felt
        curated by someone who actually knows the products — not just optimized to sell the most
        of whatever's in stock.
      </p>

      <SwatchStrip className="mx-auto my-12 max-w-xs" />

      <div className="grid gap-6 text-left md:grid-cols-3">
        {VALUES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="glass-card rounded-3xl border border-white/50 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/15 text-gold-dark">
              <Icon size={20} />
            </span>
            <h3 className="mt-4 font-display text-lg text-ink">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-14">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-cream transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Start Shopping →
        </Link>
      </div>
    </main>
  )
}
