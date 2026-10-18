import { Fraunces, Manrope } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata = {
  title: 'so much. — Makeup & Skincare, Undiluted',
  description: 'Curated makeup and skincare for real skin tones. No filters, no noise.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="font-body antialiased">
        <Navbar />
        {children}
        <Footer />
        <CartDrawer />
      </body>
    </html>
  )
}
