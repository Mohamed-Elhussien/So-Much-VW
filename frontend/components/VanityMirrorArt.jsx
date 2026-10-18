// مرآة تواليت بيضاوية — العنصر السردي المركزي للهيرو الجديد.
// بدل ما نعرض المنتجات "عايمة" في الفراغ، بنحطها جوه إطار مرآة
// زي لو العميلة واقفة قدام طاولة التواليت بتاعتها، وده بيدي
// إحساس "بيت"/دفء أكتر من مجرد رسمة منتجات.
export default function VanityMirrorArt({ className = '' }) {
  return (
    <svg
      viewBox="0 0 400 540"
      className={className}
      role="img"
      aria-label="Illustration of a vanity mirror reflecting a perfume bottle and lipstick"
    >
      {/* Stand / pedestal */}
      <path d="M170 420 L230 420 L248 500 L152 500 Z" fill="#C9A15B" opacity="0.9" />
      <rect x="140" y="500" width="120" height="18" rx="9" fill="#C9A15B" />

      {/* Mirror glass */}
      <ellipse cx="200" cy="220" rx="152" ry="196" fill="#FFFDFB" />

      {/* Reflection glow inside glass */}
      <ellipse cx="200" cy="220" rx="152" ry="196" fill="url(#mirrorGlow)" />
      <defs>
        <radialGradient id="mirrorGlow" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#F3D6D8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F3D6D8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ===== Reflected perfume bottle (scaled down, centered-right) ===== */}
      <g transform="translate(232,230) scale(0.5)">
        <rect x="-110" y="-60" width="220" height="340" rx="28" fill="#FFFFFF" stroke="#2B1B24" strokeWidth="4" />
        <rect x="-18" y="-92" width="36" height="34" fill="#2B1B24" />
        <rect x="-42" y="-148" width="84" height="58" rx="12" fill="#2B1B24" />
        <polygon points="0,-172 16,-150 0,-134 -16,-150" fill="#C9A15B" />
        <rect x="-72" y="30" width="144" height="96" rx="8" fill="#C9A15B" opacity="0.25" />
      </g>

      {/* ===== Reflected lipstick (scaled down, tilted, left) ===== */}
      <g transform="translate(160,300) rotate(-18) scale(0.46)">
        <ellipse cx="0" cy="-4" rx="30" ry="10" fill="#2B1B24" opacity="0.15" />
        <rect x="-34" y="0" width="68" height="210" rx="14" fill="#2B1B24" />
        <rect x="-37" y="164" width="74" height="18" fill="#C9A15B" />
        <path
          d="M -28 0 C -28 -40, -22 -70, -10 -96 L -4 -112 C -2 -118, 2 -118, 4 -112 L 10 -96 C 22 -70, 28 -40, 28 0 Z"
          fill="#8C2F39"
        />
      </g>

      {/* Mirror frame (drawn last so it sits on top of the glass edges) */}
      <ellipse cx="200" cy="220" rx="152" ry="196" fill="none" stroke="#C9A15B" strokeWidth="14" />
      <ellipse cx="200" cy="220" rx="152" ry="196" fill="none" stroke="#2B1B24" strokeWidth="1.5" opacity="0.4" />

      {/* Hand-highlight arc — hint of light catching the glass */}
      <path
        d="M 100 100 A 150 190 0 0 1 190 32"
        stroke="#FFFDFB"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />

      {/* Little sparkle accents around the mirror */}
      <g fill="#C9A15B">
        <polygon points="70,90 74,102 86,106 74,110 70,122 66,110 54,106 66,102" opacity="0.8" />
        <polygon points="330,150 332,158 340,160 332,162 330,170 328,162 320,160 328,158" opacity="0.7" />
      </g>
    </svg>
  )
}
