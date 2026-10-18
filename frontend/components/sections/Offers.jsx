'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import ProductCard from '@/components/ProductCard'
import { useProducts } from '@/lib/useProducts'

const EASE = [0.22, 1, 0.36, 1]

// ⚡ عشان framer-motion يقدر يحرّك Link (اللي هو function component،
// مش عنصر DOM عادي زي button) لازم نلفّه بـ motion() الأول — بعد كده
// بيقبل نفس props الحركة (initial/whileInView/transition...) بالظبط
// زي ما كان بيقبلها الـ motion.button القديم.
const MotionLink = motion(Link)

// ⚡ نقط الدقة الذهبية (Gold Dust) — موزعة على كامل المساحة الأفقية والرأسية (X & Y)
const DUST = Array.from({ length: 32 }, (_, i) => ({
  left: `${(i * 31) % 100}%`,
  top: `${(i * 23) % 100}%`, // 🎯 انتشار رأسي كامل يمنع تكتل النقط في القاع
  size: 1.5 + ((i * 13) % 2.5),
  duration: 7 + ((i * 5) % 6),
  delay: -((i * 1.3) % 8), // تأخير بالسالب لبدء الحركة فور تحميل الصفحة
  drift: `${((i % 5) - 2) * 15}px`,
  opacity: 0.15 + ((i % 4) * 0.08),
}))

function GoldDust() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {DUST.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-gold animate-dust-float"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
            '--dust-drift': d.drift,
            '--dust-opacity': d.opacity,
          }}
        />
      ))}
    </div>
  )
}

export default function Offers() {
  const sectionRef = useRef(null)

  // ⚡ بقى بيسحب من نفس الداتابيز الحقيقية اللي صفحة /shop?onSale=true
  // بتعرضها بالظبط (مصدر بيانات واحد للموقع كله) — قبل كده كان بيسحب
  // من data/products.json الثابت، وكان ده سبب مشكلتين: (1) مش نفس
  // المنتجات اللي في صفحة العروض الحقيقية، (2) روابط المنتجات كانت
  // بتوصل لصفحة 404 لأن المنتجات دي مش موجودة في الداتابيز أصلاً.
  const { products: displayedProducts, loading } = useProducts('onSale=true&limit=4')

  // 🎯 تتبع حركة الماوس بتحديث CSS Variables مباشرة بدون Re-renders
  //
  // ⚡ الاعتمادية [loading] هنا مقصودة ومهمة، مش [] فاضية زي الأول.
  // أول ما الكومبوننت يترندر، loading=true وبيتعرض OffersSkeleton
  // (السكشن الحقيقي اللي عليه sectionRef لسه مش موجود في الـ DOM
  // خالص)، فـ sectionRef.current بيبقى null والـ effect كان بيرجع
  // فورًا (if (!section) return) من غير ما يعلّق أي listener. وبما
  // إن الاعتمادية كانت [] (تشتغل مرة واحدة بس عند أول mount)، لما
  // الداتا توصل وloading يبقى false ويظهر السكشن الحقيقي، الـ effect
  // مكانش بيتنفذ تاني خالص — يعني تأثير الماوس كان معطّل تمامًا من
  // غير أي خطأ ظاهر في الـ console. لما loading يتغيّر لـ false، الـ
  // effect دلوقتي بيتنفذ تاني ويلاقي sectionRef.current موجود فعليًا.
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    let rafId = null

    const handlePointerMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId)

      rafId = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        section.style.setProperty('--mx', `${x}px`)
        section.style.setProperty('--my', `${y}px`)
      })
    }

    section.addEventListener('pointermove', handlePointerMove)
    return () => {
      section.removeEventListener('pointermove', handlePointerMove)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [loading])

  if (loading) return <OffersSkeleton />
  if (displayedProducts.length === 0) return null

  return (
    <section
      ref={sectionRef}
      id="offers"
      className="relative overflow-hidden bg-ink py-28 lg:py-36"
    >
      <GoldDust />

      {/* خلفية التوهج الثابتة */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[10%] h-[600px] w-[600px] rounded-full bg-berry/10 blur-[150px] animate-blob-pulse" />
        <div
          className="absolute -bottom-40 right-[5%] h-[500px] w-[500px] rounded-full bg-gold/8 blur-[140px] animate-blob-pulse"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* 🌟 التوهج الذهبي التفاعلي مع حركة الماوس (Spotlight) */}
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(201,161,91,0.09), transparent 60%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <span className="mb-4 inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.3em] text-gold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_10px_rgba(201,161,91,0.5)]" />
              </span>
              Limited Time
            </span>
            <h2 className="font-display text-5xl italic leading-[0.95] text-cream md:text-6xl lg:text-7xl">
              This Week's{' '}
              <span className="bg-gradient-to-r from-gold via-amber-200 to-gold bg-[length:250%_auto] bg-clip-text text-transparent animate-shimmer">
                Steals
              </span>
            </h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-5 max-w-lg text-sm leading-relaxed text-cream/35"
            >
              Exclusive deals on premium beauty products. Hand-picked offers that
              refresh weekly — once they're gone, they're gone.
            </motion.p>
          </div>

          <MotionLink
            href="/shop?onSale=true"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className="group relative overflow-hidden rounded-full border border-gold/30
              bg-gold/5 px-8 py-3.5 text-sm font-bold tracking-widest uppercase
              text-gold backdrop-blur-md
              transition-all duration-300 ease-out
              hover:scale-[1.03] hover:border-gold/50
              hover:shadow-[0_0_40px_rgba(201,161,91,0.15)]
              active:scale-[0.97]"
          >
            <span className="relative z-10">View All Offers →</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          </MotionLink>
        </motion.div>

        {/* 📦 Cards Grid: 4 كروت فقط في شبكة متناسقة */}
        <div className="grid grid-cols-1 gap-6 xs:grid-cols-2 lg:grid-cols-4">
          {displayedProducts.map((product, index) => {
            const tone =
              product.variants?.find((v) => v.available)?.tone ||
              product.variants?.[0]?.tone ||
              product.tone ||
              '#C9A15B'

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 70, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, delay: 0.15 * index, ease: EASE }}
                className="group/card relative w-full"
              >
                <div className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:-translate-y-3">
                  <ProductCard product={product} dark className="w-full" />
                </div>

                {/* توهج ملون ورا الكارت وقت الـ Hover */}
                <div
                  className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                  style={{
                    background: `radial-gradient(circle at center, ${tone}25, transparent 70%)`,
                  }}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ⚡ سكيليتون بنفس خلفية الـ section الغامقة (bg-ink) وبنفس الأبعاد
// تقريبًا — عشان الصفحة ما "تقفزش" أو تفلاش لسكشن فاضي وهي لسه
// بتحمّل بيانات العروض من الـ API.
//
// ⚡ id="offers" لازم يكون موجود هنا كمان (مش بس في النسخة النهائية
// فوق) — بعد ما السكشن بقى بيجيب بياناته من الـ API (مش static import
// زي الأول)، بقى فيه لحظة loading قصيرة قبل ما العنصر الحقيقي يظهر.
// لو حد جاي من صفحة تانية بلينك "/#offers" (شوف Footer.jsx) في نفس
// اللحظة دي، Next.js هيحاول يعمل scroll لعنصر لسه مش موجود ويفشل
// بصمت — نفس الباگ اللي ظهر قبل كده في Bestsellers بالظبط.
function OffersSkeleton() {
  return (
    <section id="offers" className="relative overflow-hidden bg-ink py-28 lg:py-36" aria-hidden="true">
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="h-3 w-28 animate-pulse rounded-full bg-cream/10" />
            <div className="mt-4 h-12 w-64 animate-pulse rounded-full bg-cream/10" />
          </div>
          <div className="h-12 w-40 animate-pulse rounded-full bg-cream/10" />
        </div>
        <div className="grid grid-cols-1 gap-6 xs:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-[1.75rem] bg-cream/5" />
          ))}
        </div>
      </div>
    </section>
  )
}
