'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2, Check } from 'lucide-react'
import ProductImage from '@/components/ProductImage'
import Breadcrumbs from '@/components/Breadcrumbs'
import { useCartStore, selectCartTotal } from '@/store/useCartStore'
import { API_BASE } from '@/lib/apiBase'

// ⚡ رسوم شحن ثابتة مؤقتًا — لحد ما يبقى عندنا مناطق/أسعار شحن حقيقية
// من صاحب الموقع، رقم واحد بسيط أوضح من غير أي رقم خالص (0 كان
// هيوهم إن الشحن مجاني فعليًا).
const SHIPPING_FEE = 60 // ⚠️ لازم يطابق SHIPPING_FEE في server/.env (مؤقتًا لحد مناطق الشحن الحقيقية)

// ⚡ رقم موبايل مصري بسيط (01 + 9 أرقام = 11 رقم إجمالي، أو +20 بدل
// الصفر الأول). مش عايزين نرفض أرقام صحيحة بمبالغة، بس نمسك أخطاء
// الكتابة الواضحة (حروف، رقم قصير جدًا) قبل ما نبعت الطلب.
const PHONE_PATTERN = /^(?:\+?20|0)?1[0-25]\d{8}$/

function formatEGP(amount) {
  // ⚡ toLocaleString بدل ما نلزق الرقم كـ string خام — يفصل الآلاف
  // بفاصلة (1,250 بدل 1250) ويمنع أي فاصلة عشرية غريبة لو السعر مش
  // رقم صحيح بالظبط.
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

class OrderRequestError extends Error {
  constructor(message, { status = null, code = null, fields = null, items = null } = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
    this.items = items
  }
}

// عشان الضغط المزدوج/إعادة المحاولة بعد انقطاع الشبكة ما يعملوش أوردرين: كل "محاولة"
// ليها مفتاح، والسيرفر بيرجّع نفس الأوردر لو المفتاح اتبعت تاني.
const newKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`

// ⚡ المكان الوحيد اللي بيبعت الأوردر. بنبعت id/الشيد/الكمية بس، مش الأسعار:
// السيرفر بيحسب من الداتابيز وWooCommerce هو اللي بيحسب الإجمالي النهائي.
async function submitOrder({ form, items, idempotencyKey }) {
  if (!API_BASE) throw new OrderRequestError('The store is not configured correctly. Please contact us.', { code: 'CONFIG' })

  let res
  try {
    res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey,
        customer: { name: form.name, phone: form.phone, city: form.city, address: form.address },
        items: items.map((i) => ({ id: i.id, colorName: i.colorName ?? null, qty: i.qty })),
      }),
    })
  } catch (cause) {
    // ⚠️ ده مش بالضرورة النت عندك: ممكن السيرفر وقع/اتعمله restart، أو CORS، أو الصفحة اتعملها reload.
    // والأهم: السيرفر ممكن يكون استلم الأوردر فعلاً والرد بس ضاع، فبنسأله (waitForOrder) قبل ما نقول فشل.
    console.error('[checkout] request to', `${API_BASE}/api/orders`, 'failed before a response:', cause)
    throw new OrderRequestError("We couldn't reach the store server.", { code: 'NETWORK' })
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new OrderRequestError(data?.error ?? 'Something went wrong placing your order. Please try again.', {
      status: res.status,
      code: data?.code ?? null,
      fields: data?.fields ?? null,
      items: data?.items ?? null,
    })
  }
  return { orderNumber: data.orderNumber }
}

// ⚡ لما الرد يضيع (NETWORK) أو السيرفر يقول "لسه بيتعالج" (IN_PROGRESS): بنسأل السيرفر عن حالة
// الأوردر بالمفتاح، بدل ما نقول للعميل "فشل" والأوردر يكون اتعمل فعلاً (أو ينضغط تاني ويتكرر).
// بيرجّع { orderNumber } لو اتعمل، أو null لو آمن نعيد المحاولة، أو بيرمي ORDER_UNCERTAIN.
async function waitForOrder(idempotencyKey) {
  for (let attempt = 0; attempt < 8; attempt++) {
    await new Promise((r) => setTimeout(r, 1500))
    try {
      const res = await fetch(`${API_BASE}/api/orders/status/${encodeURIComponent(idempotencyKey)}`)
      if (!res.ok) continue
      const data = await res.json()
      if (data.status === 'created') return { orderNumber: data.orderNumber }
      if (data.status === 'failed' || data.status === 'not_found') return null // آمن نعيد المحاولة
      if (data.status === 'unknown') {
        throw new OrderRequestError(
          "We couldn't confirm your order. Please contact us before ordering again, so you don't get charged twice.",
          { code: 'ORDER_UNCERTAIN' }
        )
      }
      // processing: نكمّل نسأل
    } catch (err) {
      if (err instanceof OrderRequestError) throw err
      // مشكلة اتصال في السؤال نفسه: نجرّب تاني
    }
  }
  return null
}

function describeUnavailable(list) {
  const names = list.map((i) => `${i.name ?? 'An item'}${i.colorName ? ` (${i.colorName})` : ''}`)
  return `Some items are no longer available: ${names.join(', ')}. Please remove them from your cart to continue.`
}

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const subtotal = useCartStore(selectCartTotal)

  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [orderNumber, setOrderNumber] = useState(null)
  const attemptRef = useRef({ sig: null, key: null })

  useEffect(() => {
    document.title = 'Checkout | so much.'
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    // ⚡ مسح رسالة الخطأ بتاعة الحقل ده أول ما المستخدم يبدأ يعدّله —
    // مش لازم تفضل ظاهرة لحد ما يدوس Place Order تاني.
    setErrors((err) => (err[name] ? { ...err, [name]: undefined } : err))
  }

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Please enter your full name.'
    if (!form.phone.trim()) {
      next.phone = 'Please enter a phone number.'
    } else if (!PHONE_PATTERN.test(form.phone.trim())) {
      next.phone = 'Please enter a valid Egyptian phone number.'
    }
    if (!form.city.trim()) next.city = 'Please enter your city.'
    if (!form.address.trim()) next.address = 'Please enter your address.'
    return next
  }

  async function handlePlaceOrder(e) {
    e.preventDefault()
    if (submitting) return // ⚡ منع الضغط المزدوج على "Place Order" أثناء ما الطلب بيتبعت

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // نفس البيانات = نفس المفتاح (إعادة محاولة آمنة). أي تعديل في الفورم/السلة = مفتاح جديد.
    const sig = JSON.stringify([form.name, form.phone, form.city, form.address, items.map((i) => [i.lineId, i.qty])])
    if (attemptRef.current.sig !== sig) attemptRef.current = { sig, key: newKey() }

    setSubmitting(true)
    setSubmitError(null)

    const key = attemptRef.current.key
    const finish = (newOrderNumber) => {
      setOrderNumber(newOrderNumber)
      attemptRef.current = { sig: null, key: null }
      clearCart()
    }

    try {
      const { orderNumber: newOrderNumber } = await submitOrder({ form, items, idempotencyKey: key })
      finish(newOrderNumber)
    } catch (err) {
      console.error('[checkout] failed to place order:', err)

      // الرد ضاع أو الأوردر لسه بيتعالج: نسأل السيرفر قبل ما نحكم إنه فشل.
      let finalError = err
      if (err.code === 'NETWORK' || err.code === 'IN_PROGRESS') {
        try {
          const done = await waitForOrder(key)
          if (done) {
            finish(done.orderNumber)
            return
          }
        } catch (uncertain) {
          finalError = uncertain
        }
      }

      if (finalError.fields) setErrors(finalError.fields) // أخطاء الحقول من السيرفر
      if (finalError.code === 'UNAVAILABLE' && finalError.items) {
        setSubmitError(describeUnavailable(finalError.items))
      } else if (finalError.code === 'NETWORK') {
        setSubmitError("We couldn't reach the store server. Your order was not placed, please try again in a moment.")
      } else {
        setSubmitError(finalError.message || 'Something went wrong placing your order. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (orderNumber) {
    return <OrderConfirmation orderNumber={orderNumber} />
  }

  if (items.length === 0) {
    return <EmptyCheckout />
  }

  const total = subtotal + SHIPPING_FEE

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-32">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: 'Checkout' }]} />
      <h1 className="font-display text-3xl italic text-ink md:text-4xl">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        {/* تفاصيل الشحن + الدفع */}
        <div className="flex flex-col gap-8">
          <div className="glass-card rounded-3xl border border-white/50 p-7">
            <h2 className="font-display text-xl text-ink">Shipping details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium text-ink/70">Full name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={`rounded-2xl border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold ${
                    errors.name ? 'border-berry' : 'border-ink/15'
                  }`}
                />
                {errors.name && (
                  <span id="name-error" className="text-xs text-berry">
                    {errors.name}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink/70">Phone</span>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="01xxxxxxxxx"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  className={`rounded-2xl border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold ${
                    errors.phone ? 'border-berry' : 'border-ink/15'
                  }`}
                />
                {errors.phone && (
                  <span id="phone-error" className="text-xs text-berry">
                    {errors.phone}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink/70">City</span>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  aria-invalid={Boolean(errors.city)}
                  aria-describedby={errors.city ? 'city-error' : undefined}
                  className={`rounded-2xl border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold ${
                    errors.city ? 'border-berry' : 'border-ink/15'
                  }`}
                />
                {errors.city && (
                  <span id="city-error" className="text-xs text-berry">
                    {errors.city}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium text-ink/70">Address</span>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  rows={3}
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={errors.address ? 'address-error' : undefined}
                  className={`rounded-2xl border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold ${
                    errors.address ? 'border-berry' : 'border-ink/15'
                  }`}
                />
                {errors.address && (
                  <span id="address-error" className="text-xs text-berry">
                    {errors.address}
                  </span>
                )}
              </label>
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-white/50 p-7">
            <h2 className="font-display text-xl text-ink">Payment method</h2>
            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold/5 px-4 py-3.5">
              <input type="radio" name="payment" defaultChecked readOnly className="accent-gold-dark" />
              <span className="text-sm font-medium text-ink">Cash on Delivery</span>
            </label>
            {/* ⚡ صراحة بدل ما نتظاهر إن في بوابة دفع شغالة — مفيش
                integration حقيقي مع أي payment gateway لسه. */}
            <p className="mt-2 text-xs text-ink/40">
              Online payment isn't connected yet — Cash on Delivery is the only option for now.
            </p>
          </div>
        </div>

        {/* ملخص الطلب */}
        <div className="glass-card h-fit rounded-3xl border border-white/50 p-7">
          <h2 className="font-display text-xl text-ink">Order summary</h2>

          <ul className="mt-5 flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.lineId} className="flex items-center gap-3">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-ink/10">
                  <ProductImage src={item.image} alt={item.name} tone={item.tone} sizes="56px" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm text-ink">{item.name}</span>
                  {item.colorName && <span className="text-xs text-ink/50">{item.colorName}</span>}
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(item.lineId, item.qty - 1)}
                      aria-label="Decrease quantity"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-xs text-ink/60">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.lineId, item.qty + 1)}
                      aria-label="Increase quantity"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15"
                    >
                      <Plus size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.lineId)}
                      aria-label="Remove from cart"
                      className="ml-auto text-ink/30 hover:text-berry"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <span className="flex-shrink-0 text-sm font-medium text-ink">
                  EGP {formatEGP((item.salePrice ?? item.price) * item.qty)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2 border-t border-ink/10 pt-5 text-sm">
            <div className="flex justify-between text-ink/60">
              <span>Subtotal</span>
              <span>EGP {formatEGP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink/60">
              <span>Shipping</span>
              <span>EGP {formatEGP(SHIPPING_FEE)}</span>
            </div>
            <div className="flex justify-between pt-2 font-display text-lg text-ink">
              <span>Total</span>
              <span>EGP {formatEGP(total)}</span>
            </div>
          </div>

          {submitError && (
            <p role="alert" className="mt-4 text-sm text-berry">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="mt-6 w-full rounded-full bg-ink px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-cream transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>
        </div>
      </form>
    </main>
  )
}

function EmptyCheckout() {
  return (
    <main className="mx-auto max-w-lg px-5 pb-24 pt-32 text-center">
      <h1 className="font-display text-3xl italic text-ink">Your bag is empty</h1>
      <p className="mt-3 text-sm text-ink/60">
        Add a few things you love, then come back here to check out.
      </p>
      <Link
        href="/shop"
        className="mt-6 inline-block rounded-full bg-ink px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-cream"
      >
        Browse Products
      </Link>
    </main>
  )
}

function OrderConfirmation({ orderNumber }) {
  return (
    <main className="mx-auto max-w-lg px-5 pb-24 pt-32 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
        <Check size={26} />
      </span>
      <h1 className="mt-5 font-display text-3xl italic text-ink">Order placed!</h1>
      <p className="mt-2 text-sm text-ink/60">
        Order <span className="font-semibold text-ink">#{orderNumber}</span> — we'll call you to confirm delivery.
      </p>
      <p className="mx-auto mt-4 max-w-sm text-xs text-ink/40">
        Payment is cash on delivery: you pay when your order arrives. Please keep your order number for reference.
      </p>
      <Link
        href="/shop"
        className="mt-6 inline-block rounded-full bg-ink px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-cream"
      >
        Continue Shopping
      </Link>
    </main>
  )
}
