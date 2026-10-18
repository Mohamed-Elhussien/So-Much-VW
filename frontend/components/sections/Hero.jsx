'use client'

import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import SwatchStrip from '@/components/ui/SwatchStrip'
import VanityMirrorArt from '@/components/VanityMirrorArt'
import GrainOverlay from '@/components/GrainOverlay'

export default function Hero() {
  return (
    // ⚡ pt-28 هنا بيعوّض المساحة اللي كان بياخدها الـ Navbar وهو
    // جزء من التدفق الطبيعي، دلوقتي هو fixed (عايم) وطلع بره التدفق.
    <section id="top" className="relative overflow-hidden bg-cream pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full bg-gold/25 blur-[110px]" />
        <div className="absolute top-40 -right-24 h-[380px] w-[380px] rounded-full bg-rose/35 blur-[110px]" />
      </div>
      <GrainOverlay opacity={0.04} />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pt-6 pb-16 md:grid-cols-2 md:items-center md:gap-8 md:pb-24">
        {/* ===== Left: fluid editorial typography ===== */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
            <span className="eyeliner-rule" />
            Seasonal Edit
          </span>

          {/* Fluid type — بيتمدد بسلاسة بين الموبايل والشاشات الكبيرة */}
          <h1 className="mt-6 font-display italic leading-[1.03] text-ink text-[clamp(2.5rem,4.5vw+1rem,4.75rem)]">
            Beauty,
            <br />
            <span className="relative inline-block not-italic text-berry">
              on your terms.
              <svg
                className="absolute -bottom-2 left-0 w-full"
                height="12"
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 8 Q 75 -2, 150 6 T 298 5"
                  stroke="#C9A15B"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-relaxed text-ink/60">
            Makeup and skincare picked for real skin tones — not whatever's
            trending on a stranger's algorithm this week.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button variant="primary" size="lg" href="/shop">
              Start Shopping
            </Button>
            <a
              href="#offers"
              className="text-sm font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4"
            >
              See this week's steals
            </a>
          </div>

          <SwatchStrip className="mt-10 max-w-[200px]" />
        </motion.div>

        {/* ===== Right: glass showcase panel — micro-interaction (hover zoom) ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="group relative mx-auto w-full max-w-sm"
        >
          <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gold/20 blur-2xl transition-opacity duration-500 group-hover:opacity-80" />
          <div className="glass-card relative overflow-hidden rounded-[2.5rem] border border-white/50 p-8 shadow-glow transition-shadow duration-500 group-hover:shadow-glow-lg sm:p-10">
            <motion.div
              className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <VanityMirrorArt className="w-full" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Marquee — brand values on a loop, styled like a lip-swatch strip */}
      <div className="relative overflow-hidden border-y border-ink/10 bg-ink py-3">
        <motion.div
          className="flex whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 1].map((rep) => (
            <div key={rep} className="flex items-center">
              {[
                'CRUELTY-FREE',
                'SMALL-BATCH',
                'MADE FOR REAL SKIN',
                'NO FILTER NEEDED',
              ].map((word) => (
                <span
                  key={word}
                  className="mx-6 flex items-center gap-6 text-xs font-semibold uppercase tracking-[0.2em] text-cream/80"
                >
                  {word}
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
