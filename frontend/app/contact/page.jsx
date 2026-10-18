'use client'

import { useState } from 'react'
import { Mail, Instagram, Facebook } from 'lucide-react'

// ⚡ 'use client' هنا ضروري (مش اختياري) لأن الفورم محتاج state
// للحقول ورسالة النجاح — عكس صفحة /about اللي كانت محتوى ثابت بس.
//
// ⚡ ملحوظة صريحة: مفيش backend endpoint حقيقي يستقبل الرسالة دي لسه
// (مفيش route زي /api/contact في server/src/routes). الفورم دلوقتي
// بيتصرف محليًا بس (يعرض حالة "تم الإرسال" وهمية) — أنضف من إننا
// نتظاهر إنه بيبعت الرسالة فعليًا لحد ما نضيف endpoint حقيقي ونربطه.
export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Get in Touch</span>
        <h1 className="mt-3 font-display text-4xl italic text-ink md:text-5xl">We'd love to hear from you</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink/60">
          Question about an order, a shade, or just want to say hi? Send us a message and we'll
          get back to you.
        </p>
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-[1.3fr_1fr]">
        <div className="glass-card rounded-3xl border border-white/50 p-8">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                <Mail size={22} />
              </span>
              <h2 className="mt-4 font-display text-2xl italic text-ink">Message received</h2>
              <p className="mt-2 max-w-sm text-sm text-ink/60">
                Thanks for reaching out — we'll be in touch soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
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
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-ink/70">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink/70">Message</span>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
                />
              </label>
              <button
                type="submit"
                className="rounded-full bg-ink px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-cream transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Send Message
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass-card rounded-3xl border border-white/50 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/15 text-gold-dark">
              <Mail size={18} />
            </span>
            <h3 className="mt-3 font-display text-base text-ink">Email us</h3>
            <p className="mt-1 text-sm text-ink/60">hello@somuch.example</p>
          </div>

          <div className="glass-card rounded-3xl border border-white/50 p-6">
            <h3 className="font-display text-base text-ink">Follow along</h3>
            <div className="mt-3 flex items-center gap-3">
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
      </div>
    </main>
  )
}
