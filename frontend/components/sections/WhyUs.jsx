import { Truck, ShieldCheck, RotateCcw } from 'lucide-react'

const POINTS = [
  {
    icon: Truck,
    title: 'Fast, Nationwide',
    desc: "On your doorstep in 2–4 days, with real tracking — not a promise.",
  },
  {
    icon: ShieldCheck,
    title: '100% Authentic',
    desc: 'Sourced from official distributors only. No dupes, no drama.',
  },
  {
    icon: RotateCcw,
    title: 'Easy Swaps',
    desc: "Wrong shade? Swap it within 14 days, no questions asked.",
  },
]

export default function WhyUs() {
  return (
    <section id="about" className="relative py-20">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-64 w-[70%] rounded-full bg-gold/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid gap-6 md:grid-cols-3">
          {POINTS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="glass-card group rounded-3xl border border-white/50 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/15 text-gold-dark transition-colors duration-300 group-hover:bg-gold/25">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-display text-lg text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
