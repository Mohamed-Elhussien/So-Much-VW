import Link from 'next/link'
import SwatchStrip from '@/components/ui/SwatchStrip'
import { Instagram, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-cream border-t border-ink/10">
      <div className="mx-auto max-w-6xl px-5 py-14 text-center">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="flex flex-col items-center">
            <span className="font-display text-2xl italic text-ink">
              so much<span className="text-berry not-italic">.</span>
            </span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/60">
              Curated makeup and skincare, no noise — so you pick what suits
              you, not what's selling the most this week.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <h4 className="mb-3 text-sm font-semibold text-ink">Shop</h4>
            <ul className="flex flex-col items-center gap-2 text-sm text-ink/60">
              <li><Link href="/shop" className="hover:text-ink">All Products</Link></li>
              {/*
                ⚡ Link مش <a> عادي، وHref فيه "/" في الأول عمدًا (مش
                "#offers" بس) — الفوتر ده ظاهر في كل صفحة في الموقع
                (شوف app/layout.jsx)، مش الهوم بس. لو كتبنا "#offers"
                عادي، وإنت في صفحة زي /shop، هيتحط في الرابط بس مش هيودّيك
                حته لأن مفيش عنصر بالـ id ده في نفس الصفحة اللي إنت فيها.
                "/#offers" بيخلي Next.js يوديك لصفحة الهوم الأول (لو مش
                فيها أصلاً)، وبعدين يعمل scroll للعنصر — وده شغال حتى لو
                إنت في الهوم نفسها.
              */}
              <li><Link href="/#offers" className="hover:text-ink">Offers</Link></li>
            </ul>
          </div>

          <div className="flex flex-col items-center">
            <h4 className="mb-3 text-sm font-semibold text-ink">Follow</h4>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-ink hover:border-gold"
              >
                <Instagram size={17} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-ink hover:border-gold"
              >
                <Facebook size={17} />
              </a>
            </div>
          </div>
        </div>

        <SwatchStrip className="mx-auto my-10 max-w-xs" />

        <p className="text-xs text-ink/40">
          © {new Date().getFullYear()} so much. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
