'use client'

import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import * as Avatar from '@radix-ui/react-avatar'
import { User, LogOut, Package } from 'lucide-react'

// ⚡ ده stub دلوقتي — isLoggedIn وmockUser بيانات وهمية جوه الكومبوننت.
// لما الـ Auth الحقيقي (Express + JWT) يخلص، هنستبدل الـ useState دي
// بـ context/hook حقيقي بيرجع بيانات المستخدم الفعلية. شكل الكومبوننت
// من بره (الزرار، الصورة، القائمة) مش هيتغيّر خالص.
export default function UserMenu() {
  const [isLoggedIn] = useState(false)
  const mockUser = { name: 'Sarah Ahmed', avatarUrl: '' }

  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (!isLoggedIn) {
    return (
      <a
        href="/login"
        aria-label="Login or Register"
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-all duration-300 ease-out hover:bg-ink/5"
      >
        <User size={18} />
      </a>
    )
  }

  const initials = mockUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-ink/10 transition-shadow hover:ring-gold"
      >
        <Avatar.Root className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
          <Avatar.Image
            src={mockUser.avatarUrl}
            alt={mockUser.name}
            className="h-full w-full object-cover"
          />
          <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-gold/20 text-xs font-semibold text-gold-dark">
            {initials}
          </Avatar.Fallback>
        </Avatar.Root>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="glass-nav absolute right-0 mt-2 w-48 rounded-2xl border border-white/40 p-2 shadow-glow"
          >
            <div className="px-3 py-2 text-sm font-semibold text-ink">{mockUser.name}</div>
            <a
              href="#orders"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink/70 hover:bg-ink/5"
            >
              <Package size={15} /> My Orders
            </a>
            <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-berry hover:bg-berry/5">
              <LogOut size={15} /> Log Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
