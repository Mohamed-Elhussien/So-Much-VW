'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lock, Mail } from 'lucide-react'

// ⚡ ملحوظة صريحة: مفيش نظام Auth حقيقي في الـ backend لسه (مفيش
// /api/auth ولا users collection في server/src). الفورم دلوقتي شكل
// (UI shell) بس بحالة محلية، وبيوضح كده للمستخدم بدل ما يتظاهر بتسجيل
// دخول فعلي مش موجود — أهم من إننا نعمل حاجة "شكلها شغالة" وهي مش
// شغالة فعليًا.
export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [notice, setNotice] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setNotice(true)
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-5 pb-24 pt-32">
      <div className="text-center">
        <span className="font-display text-2xl italic text-ink">
          so much<span className="text-berry not-italic">.</span>
        </span>
        <h1 className="mt-4 font-display text-3xl italic text-ink">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          {mode === 'login' ? 'Log in to see your orders and saved shades.' : 'Save your shades, track orders, checkout faster.'}
        </p>
      </div>

      <div className="glass-card mt-8 rounded-3xl border border-white/50 p-8">
        {notice && (
          <div className="mb-5 rounded-2xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-ink/70">
            Accounts aren't connected yet — this is a preview of what login will look like.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink/70">Name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink/70">Email</span>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-ink/15 bg-surface py-3 pl-11 pr-4 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink/70">Password</span>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full rounded-2xl border border-ink/15 bg-surface py-3 pl-11 pr-4 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
          </label>

          <button
            type="submit"
            className="mt-2 rounded-full bg-ink px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-cream transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink/60">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => {
              setMode((m) => (m === 'login' ? 'register' : 'login'))
              setNotice(false)
            }}
            className="font-semibold text-gold-dark hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>

      <Link href="/shop" className="mt-6 text-center text-sm text-ink/50 hover:text-ink">
        ← Continue browsing without an account
      </Link>
    </main>
  )
}
