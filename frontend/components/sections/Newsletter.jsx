import Button from '@/components/ui/Button'

export default function Newsletter() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-2xl px-5">
        <div className="glass-card relative overflow-hidden rounded-[2rem] border border-white/50 px-6 py-14 text-center shadow-glow sm:px-14">
          <div className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-rose/40 blur-[90px]" />

          <div className="relative">
            <h2 className="font-display text-4xl italic text-ink md:text-5xl">
              Don't Miss a Drop
            </h2>
            <p className="mt-3 text-sm text-ink/60">
              New shades and quiet sales, before anyone else hears about them.
            </p>

            <form className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                required
                placeholder="Your email"
                className="w-full rounded-full border border-ink/15 bg-surface/80 px-5 py-3 text-sm text-ink outline-none transition-colors focus:border-gold sm:w-72"
              />
              <Button variant="gold" type="submit">
                Notify Me
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
