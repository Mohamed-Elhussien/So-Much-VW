'use client'

import { useEffect, useState } from 'react'

function getTimeLeft(target) {
  const diff = Math.max(0, target - Date.now())
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  }
}

// ⚡ ملحوظة: الموعد النهائي هنا بيتحسب من لحظة فتح الصفحة (demo).
// في الموقع الحقيقي، غيّر ده لتاريخ/وقت ثابت جاي من الداتا (مثلاً
// campaignEndsAt في ملف العروض) عشان يفضل نفس الموعد لكل الزوار.
export default function CountdownTimer({ hours = 6, className = '' }) {
  const [target] = useState(() => Date.now() + hours * 3600000)
  const [time, setTime] = useState(() => getTimeLeft(target))

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="timer"
      aria-label="Offer ends in"
    >
      {[
        { label: 'HRS', value: time.h },
        { label: 'MIN', value: time.m },
        { label: 'SEC', value: time.s },
      ].map((unit) => (
        <div
          key={unit.label}
          className="flex flex-col items-center rounded-xl border border-cream/15 bg-cream/10 px-3 py-2 backdrop-blur-sm"
        >
          <span className="font-display text-xl text-cream tabular-nums">
            {pad(unit.value)}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-cream/50">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  )
}
