// رسمة فنية مرسومة بالكامل بـ SVG (مش صورة محملة) — عطر وروج بأسلوب
// فلات إديتوريال، عشان نتجنب مشاكل حقوق الصور ونقدر نستبدلها بصورة
// فوتوغرافية حقيقية بسهولة لاحقًا لما تتوفر (next/image بنفس المكان).
export default function BeautyHeroArt({ className = '' }) {
  return (
    <svg
      viewBox="0 0 900 1000"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Illustration of a perfume bottle and lipstick"
    >
      {/* Soft background blobs — عمق خفيف من غير مبالغة */}
      <circle cx="640" cy="300" r="260" fill="#E3C58A" opacity="0.25" />
      <circle cx="480" cy="680" r="230" fill="#E8B4B8" opacity="0.3" />

      {/* Smear stroke — خط سواتش قطري، نفس موتيف الموقع */}
      <path
        d="M 60 940 C 260 760, 380 560, 560 380 S 820 120, 860 60"
        stroke="#8C2F39"
        strokeWidth="46"
        strokeLinecap="round"
        fill="none"
        opacity="0.12"
      />

      {/* ===== Perfume bottle ===== */}
      <g transform="translate(520,300)">
        {/* body */}
        <rect x="-110" y="-60" width="220" height="340" rx="28" fill="#FFFDFB" stroke="#2B1B24" strokeWidth="3" />
        {/* neck */}
        <rect x="-18" y="-92" width="36" height="34" fill="#2B1B24" />
        {/* cap */}
        <rect x="-42" y="-148" width="84" height="58" rx="12" fill="#2B1B24" />
        {/* cap gem */}
        <polygon points="0,-172 16,-150 0,-134 -16,-150" fill="#C9A15B" />
        {/* label */}
        <rect x="-72" y="30" width="144" height="96" rx="8" fill="#C9A15B" opacity="0.22" stroke="#C9A15B" strokeWidth="1.5" />
        <rect x="-46" y="56" width="92" height="5" rx="2.5" fill="#2B1B24" opacity="0.45" />
        <rect x="-46" y="72" width="64" height="5" rx="2.5" fill="#2B1B24" opacity="0.3" />
        <rect x="-46" y="88" width="76" height="5" rx="2.5" fill="#2B1B24" opacity="0.3" />
      </g>

      {/* ===== Lipstick ===== */}
      <g transform="translate(300,640) rotate(-20)">
        {/* shadow under bullet */}
        <ellipse cx="0" cy="-4" rx="30" ry="10" fill="#2B1B24" opacity="0.15" />
        {/* tube */}
        <rect x="-34" y="0" width="68" height="210" rx="14" fill="#2B1B24" />
        {/* gold ring */}
        <rect x="-37" y="164" width="74" height="18" fill="#C9A15B" />
        {/* bullet (lipstick colour) */}
        <path
          d="M -28 0
             C -28 -40, -22 -70, -10 -96
             L -4 -112
             C -2 -118, 2 -118, 4 -112
             L 10 -96
             C 22 -70, 28 -40, 28 0
             Z"
          fill="#8C2F39"
        />
        {/* bullet sheen */}
        <path
          d="M -10 -30 C -10 -55, -6 -75, 2 -96"
          stroke="#E8B4B8"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
      </g>

      {/* Scattered accent dots — صدى لموتيف السواتش */}
      <circle cx="140" cy="200" r="10" fill="#C9A15B" opacity="0.5" />
      <circle cx="200" cy="160" r="6" fill="#E8B4B8" opacity="0.6" />
      <circle cx="740" cy="640" r="8" fill="#8C2F39" opacity="0.35" />
      <circle cx="800" cy="700" r="5" fill="#C9A15B" opacity="0.5" />
      <circle cx="120" cy="820" r="7" fill="#E3C58A" opacity="0.5" />
    </svg>
  )
}
