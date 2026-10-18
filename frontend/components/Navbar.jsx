'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, Menu, X, Search, ChevronDown } from 'lucide-react'
import { useCartStore, selectCartCount } from '@/store/useCartStore'
import { NAV } from '@/data/nav'
import { buildShopHref } from '@/lib/buildShopHref'
import MegaMenuPanel from '@/components/MegaMenuPanel'
import SearchAutocomplete from '@/components/SearchAutocomplete'
import UserMenu from '@/components/UserMenu'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const count = useCartStore(selectCartCount)
  const openCart = useCartStore((s) => s.openCart)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSearchOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ⚡ اللوجو ولينك "Home" لازم يودّوا فعليًا لصفحة "/" من أي صفحة
  // تانية (كانوا قبل كده href="#top"، اللي شغال بس لو أنت أصلاً في
  // الهوم — من أي صفحة تانية مكانش بيعمل حاجة خالص). ولو المستخدم
  // أصلاً في الهوم، الأنسب إننا نطلعه لفوق بحركة ناعمة بدل ما نعمل
  // "navigation" لنفس الصفحة اللي هو فيها أصلاً (اللي مش هيغيّر حاجة).
  function handleHomeClick(e) {
    e.preventDefault()
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push('/')
    }
  }

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <div
        className={`glass-nav mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full border border-white/40 px-4 transition-shadow duration-300 sm:px-6 ${
          scrolled ? 'shadow-glow' : 'shadow-sm'
        }`}
      >
        <a href="/" onClick={handleHomeClick} className="font-display text-xl italic text-ink sm:text-2xl">
          so much<span className="text-berry not-italic">.</span>
        </a>

        {/* ===== Desktop nav — Radix NavigationMenu (accessible, keyboard-ready) ===== */}
        <NavigationMenu.Root className="relative hidden md:block">
          <NavigationMenu.List className="flex items-center gap-1">
            {NAV.map((item) => (
              // ⚡ position: relative هنا هو المفتاح — كل قايمة هتظهر تحت
              // الزرار بتاعها هي بالظبط (مش في مكان مشترك ثابت للشريط كله)
              <NavigationMenu.Item key={item.label} className="relative">
                {item.columns ? (
                  <>
                    <NavigationMenu.Trigger className="group flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-ink/70 outline-none transition-colors hover:bg-ink/5 hover:text-ink data-[state=open]:text-ink">
                      {item.label}
                      <ChevronDown
                        size={13}
                        className="transition-transform duration-200 group-data-[state=open]:rotate-180"
                      />
                    </NavigationMenu.Trigger>
                    <NavigationMenu.Content className="nav-content-motion nav-panel-solid absolute left-0 top-full mt-2 w-max overflow-hidden rounded-3xl shadow-glow">
                      <MegaMenuPanel
                        columns={item.columns}
                        navType={item.type}
                        parentDepartment={item.department}
                        shopAllHref={item.department ? buildShopHref({ department: item.department }) : null}
                      />
                      {item.links && (
                        <div className="flex flex-wrap gap-1 border-t border-ink/10 p-2">
                          {item.links.map((l) => (
                            <a
                              key={l.label}
                              href={l.href}
                              className="rounded-full px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-ink/5 hover:text-ink"
                            >
                              {l.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </NavigationMenu.Content>
                  </>
                ) : (
                  <NavigationMenu.Link
                    href={item.href}
                    onClick={item.isHome ? handleHomeClick : undefined}
                    className="block rounded-full px-3 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
                  >
                    {item.label}
                  </NavigationMenu.Link>
                )}
              </NavigationMenu.Item>
            ))}
          </NavigationMenu.List>
        </NavigationMenu.Root>

        <div className="flex items-center gap-2">
          <div className="hidden items-center sm:flex">
            <AnimatePresence initial={false}>
              {searchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-visible"
                >
                  <SearchAutocomplete variant="desktop" onNavigate={() => setSearchOpen(false)} />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setSearchOpen((o) => !o)}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              className="ml-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink transition-all duration-300 ease-out hover:bg-ink/5"
            >
              {searchOpen ? <X size={17} /> : <Search size={17} />}
            </button>
          </div>

          <UserMenu />

          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-all duration-300 ease-out hover:bg-ink/5"
          >
            <ShoppingBag size={18} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-berry text-[10px] font-bold text-cream shadow-sm">
                {count}
              </span>
            )}
          </button>

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-all duration-300 ease-out hover:bg-ink/5 md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ===== Mobile menu — قائمة مسطّحة (بدون flyout متعدد المستويات، أسهل للمس) ===== */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="nav-panel-solid mx-auto mt-2 max-h-[70vh] max-w-6xl overflow-y-auto rounded-3xl p-5 shadow-glow md:hidden"
          >
            <div className="mb-4">
              <SearchAutocomplete variant="mobile" onNavigate={() => setMenuOpen(false)} />
            </div>

            <div className="flex flex-col divide-y divide-ink/10">
              {NAV.map((item) => (
                <MobileNavItem key={item.label} item={item} onNavigate={() => setMenuOpen(false)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

// ⚡ في الموبايل مفيش داعي لفكرة الـ hover flyout خالص — أكورديون بسيط
// بيتفتح بالدوس (accordion) أسهل بكتير على اللمس من قايمة متعشعشة.
function MobileNavItem({ item, onNavigate }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  if (!item.columns) {
    function handleClick(e) {
      if (item.isHome) {
        e.preventDefault()
        onNavigate()
        if (pathname === '/') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          router.push('/')
        }
        return
      }
      onNavigate()
    }

    return (
      <a href={item.href} onClick={handleClick} className="block py-3 text-base font-medium text-ink">
        {item.label}
      </a>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3 text-base font-medium text-ink"
        aria-expanded={open}
      >
        {item.label}
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 pb-3 pl-3">
              {item.department && (
                <a
                  href={buildShopHref({ department: item.department })}
                  onClick={onNavigate}
                  className="text-sm font-semibold text-gold-dark"
                >
                  Shop all {item.label} →
                </a>
              )}

              {item.columns.map((col) => {
                const department = col.department ?? item.department
                return (
                  <div key={col.heading}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                      {col.heading}
                    </span>
                    <div className="mt-1 flex flex-col">
                      {col.items.length > 0 ? (
                        col.items.map((sub) => (
                          <a
                            key={sub}
                            href={
                              item.type === 'brand'
                                ? buildShopHref({ department: col.heading, brand: sub })
                                : buildShopHref({ department, category: sub })
                            }
                            onClick={onNavigate}
                            className="py-1.5 text-sm text-ink/70"
                          >
                            {sub}
                          </a>
                        ))
                      ) : (
                        // ⚡ عمود من غير عناصر فرعية (زي "Nail Polish") —
                        // الـ heading نفسه بقى اللينك النهائي
                        <a
                          href={
                            item.type === 'brand'
                              ? buildShopHref({ department: col.heading })
                              : buildShopHref({ department, category: col.heading })
                          }
                          onClick={onNavigate}
                          className="py-1.5 text-sm text-ink/70"
                        >
                          Shop all {col.heading}
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
              {item.links?.map((l) => (
                <a key={l.label} href={l.href} onClick={onNavigate} className="text-sm font-medium text-ink">
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
