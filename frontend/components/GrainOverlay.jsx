// طبقة تكستشر حبيبي خفيف — بتدي دفء وملمس بدل السطح الفلات
// الرقمي البارد. الفلتر SVG بيتولّد بالكود، مش صورة محملة.
export default function GrainOverlay({ className = '', opacity = 0.05, id = 'grain' }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity, mixBlendMode: 'multiply' }}
      aria-hidden="true"
    >
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  )
}
