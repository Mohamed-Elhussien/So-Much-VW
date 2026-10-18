'use client'

import { useState } from 'react'
import Image from 'next/image'

// ⚡ المكان الوحيد اللي بيقرر "إزاي نعرض صورة منتج" في الموقع كله —
// ProductCard وصفحة تفاصيل المنتج بينادوا عليه بدل ما كل واحد فيهم
// يكرر نفس منطق "لو في صورة اعرضها، لو مفيش ارجع للون" لوحده.
//
// ⚡ ليه next/image: بيعمل lazy-loading تلقائي (الصور برّه الشاشة
// ملهاش تحميل خالص لحد ما المستخدم يقرب منها)، وبيولّد أحجام مختلفة
// حسب الشاشة (مش هيحمّل صورة 2000px على موبايل شاشته 400px)، وبيحوّل
// الصيغة لـ WebP/AVIF تلقائيًا لو المتصفح بيدعمها. الفرق ده بيبقى
// ضخم بمجرد ما صور حقيقية (تقيلة) تتحط بدل السواتش اللوني الحالي.
//
// ⚡ ليه في fallback لصورة اللون: مش عارفين لسه شكل الداتا الحقيقية
// جاية إزاي بالظبط ولا لو كل الألوان هيكون ليها صور من أول يوم. لو
// أي منتج/لون جاله من غير image (null) أو الرابط باظ (404، دومين
// اتشال...)، المستخدم يشوف لون فلات نضيف بدل أيقونة "صورة متكسرة"
// قبيحة — أهم حاجة إن الموقع يفضل شغال ومظبوط بصريًا مهما كانت حالة
// الداتا الجاية.
export default function ProductImage({ src, alt, tone, sizes, className = '', imageClassName = '', priority = false }) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {showImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${imageClassName}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={`absolute inset-0 ${imageClassName}`} style={{ backgroundColor: tone }} />
      )}
    </div>
  )
}
