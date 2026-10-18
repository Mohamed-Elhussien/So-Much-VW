// شريط الألوان اللي بيتكرر كموتيف بصري في الموقع كله — مستوحى من
// شكل "سواتش" اختبار لون المكياج الحقيقي. بنستخدمه كديفايدر بديل
// عن الخطوط العادية، وكمؤشر تقدم أحيانًا.
export default function SwatchStrip({
  colors = ['#8C2F39', '#C9A15B', '#E8B4B8', '#2B1B24'],
  className = '',
}) {
  return (
    <div className={`swatch-strip ${className}`} role="presentation">
      {colors.map((c, i) => (
        <span key={i} style={{ backgroundColor: c }} />
      ))}
    </div>
  )
}
