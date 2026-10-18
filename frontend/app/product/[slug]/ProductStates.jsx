import Link from 'next/link'

export function ProductSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-32" aria-hidden="true">
      <div className="h-4 w-64 animate-pulse rounded-full bg-ink/10" />
      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square w-full animate-pulse rounded-[1.75rem] bg-ink/5" />
        <div className="space-y-4">
          <div className="h-3 w-24 animate-pulse rounded-full bg-ink/10" />
          <div className="h-8 w-3/4 animate-pulse rounded-full bg-ink/10" />
          <div className="h-6 w-32 animate-pulse rounded-full bg-ink/10" />
        </div>
      </div>
    </main>
  )
}

export function ProductNotFound() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-32 text-center">
      <h1 className="font-display text-3xl italic text-ink">Product not found</h1>
      <p className="mt-3 text-sm text-ink/60">This product may have been removed or the link is incorrect.</p>
      <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream">
        Back to Shop
      </Link>
    </main>
  )
}
