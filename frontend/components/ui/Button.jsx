import Link from 'next/link'
import { cn } from '@/lib/utils'

const VARIANTS = {
  primary: 'bg-ink text-cream hover:bg-berry hover:shadow-glow',
  gold: 'bg-gold text-ink hover:bg-gold-dark hover:shadow-glow',
  outline: 'border border-ink/20 text-ink hover:border-gold bg-transparent',
  ghost: 'text-ink hover:bg-ink/5',
}

const SIZES = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  href,
  ...props
}) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
    VARIANTS[variant],
    SIZES[size],
    className
  )

  if (href) {
    // ⚡ رابط داخلي (بيبدأ بـ "/") → Next Link (انتقال سريع من غير
    // إعادة تحميل الصفحة كلها من الصفر). أي حاجة تانية (رابط خارجي
    // https://.. أو anchor زي #section) → <a> عادي، لأن Link مش
    // مصمم لده أصلاً.
    if (href.startsWith('/')) {
      return (
        <Link href={href} className={classes} {...props}>
          {children}
        </Link>
      )
    }
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
