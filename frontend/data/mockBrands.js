// ⚡ شعارات وهمية (نص منسّق، مفيش صور) — سهل تستبدلها بصور حقيقية
// بعدين بس تضيف حقل logo: '/brands/xyz.png' وتعدّل BrandsCarousel
// يعرض <img> بدل النص. الأوزان/الخطوط المختلفة هنا بتدي إحساس
// تنوع بصري شبيه بلوجوهات حقيقية لحد ما تتوفر الصور الفعلية.
export const MOCK_BRANDS = {
  makeup: [
    { name: 'MAYBELLINE', className: 'font-sans font-bold tracking-widest' },
    { name: 'Flormar', className: 'font-display italic' },
    { name: 'CATRICE', className: 'font-sans font-semibold uppercase' },
    { name: 'AMANDA', className: 'font-serif font-bold text-berry/50' },
    { name: 'CYBÈLE', className: 'font-sans font-black uppercase' },
  ],
  haircare: [
    { name: 'NUTSHELL', className: 'font-sans font-bold uppercase' },
    { name: 'Palette', className: 'font-display italic' },
    { name: 'SHAAN', className: 'font-sans font-semibold uppercase underline decoration-berry/40' },
    { name: 'StarVille', className: 'font-sans font-medium' },
    { name: 'Beesline', className: 'font-serif' },
  ],
  fragrance: [
    { name: 'HUGO BOSS', className: 'font-sans font-bold tracking-widest' },
    { name: 'JAGUAR', className: 'font-sans font-black uppercase' },
    { name: 'Bodylicious', className: 'font-display italic' },
    { name: 'EVA COSMETICS', className: 'font-sans font-semibold' },
    { name: 'Alfred Dunhill', className: 'font-serif' },
  ],
}
