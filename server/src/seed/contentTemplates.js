// ⚡ بدل ما نكتب Key Benefits/How to Use/FAQ يدويًا لكل منتج لوحده
// (16 منتج × 5 حقول = 80 حقل مكرر تقريبًا)، عندنا قالب واحد لكل
// تصنيف عريض (category) بيتطبّق على كل منتجات نفس التصنيف. أي منتج
// جديد يتضاف بنفس الـ category هياخد نفس المحتوى تلقائيًا من غير ما
// حد يفتكر يكتبه من الصفر — ده اللي بيخلي الداتا متسقة (consistent)
// وسهل الصيانة.
const TEMPLATES = {
  lipstick: {
    keyBenefits: [
      'Rich, highly pigmented formula',
      'Comfortable wear all day',
      'Wide shade range to suit every mood',
      'Smooth application & non-drying formula',
    ],
    howToUse: [
      'Prep your lips with a balm or scrub for smooth application.',
      'Apply directly from the bullet or with a lip brush.',
      'Blot gently with tissue for extra staying power.',
    ],
    suitableFor: ['Everyday makeup looks', 'Bold evening styles', 'All skin tones'],
    specifications: [
      { property: 'Format', details: 'Lipstick' },
      { property: 'Texture', details: 'Creamy & comfortable' },
      { property: 'Skin Type', details: 'All' },
    ],
    faq: [
      { question: 'Does it dry out the lips?', answer: 'No, the creamy texture is designed to keep lips comfortable all day.' },
      { question: 'Is it transfer-proof?', answer: 'It is long-lasting but may transfer slightly, especially with eating or drinking.' },
      { question: 'Can it be layered for more intensity?', answer: 'Yes, it builds up smoothly without looking cakey.' },
    ],
  },

  foundation: {
    keyBenefits: [
      'Buildable, natural-looking coverage',
      'Lightweight feel that never cakes',
      'Long-wearing formula for busy days',
      'Blends seamlessly with fingers, brush, or sponge',
    ],
    howToUse: [
      'Start with clean, moisturized skin.',
      'Apply a small amount to the center of the face and blend outward.',
      'Build coverage in thin layers where needed instead of one heavy coat.',
    ],
    suitableFor: ['Daily wear', 'Combination & oily skin', 'All skin tones'],
    specifications: [
      { property: 'Format', details: 'Liquid foundation' },
      { property: 'Finish', details: 'Natural, buildable' },
      { property: 'Skin Type', details: 'All' },
    ],
    faq: [
      { question: 'Will it feel heavy on my skin?', answer: 'No, the formula is lightweight and breathable, even when built up for more coverage.' },
      { question: 'Does it control shine?', answer: 'Yes, it is designed to keep oiliness in check through the day.' },
      { question: 'Can I mix shades?', answer: 'Yes, adjacent shades blend easily to match your exact tone.' },
    ],
  },

  eyeshadow: {
    keyBenefits: [
      'Richly pigmented, blendable shades',
      'Mix of matte and shimmer finishes',
      'Long-wearing formula that resists creasing',
      'No fallout during application',
    ],
    howToUse: [
      'Prime lids for smoother blending and longer wear.',
      'Apply lighter shades to the lid and deeper tones to the crease.',
      'Blend edges with a fluffy brush for a seamless finish.',
    ],
    suitableFor: ['Everyday looks', 'Evening & event makeup', 'All eye shapes'],
    specifications: [
      { property: 'Format', details: 'Pressed powder palette' },
      { property: 'Finish', details: 'Matte & shimmer mix' },
      { property: 'Skin Type', details: 'All' },
    ],
    faq: [
      { question: 'Does it crease?', answer: 'The formula is built to resist creasing through a full day of wear.' },
      { question: 'Is there fallout when applying?', answer: 'The pigments are pressed to minimize fallout under the eyes.' },
      { question: 'Can shades be worn wet for more intensity?', answer: 'Yes, wetting the brush intensifies the shimmer shades.' },
    ],
  },

  blusher: {
    keyBenefits: [
      'Natural, lit-from-within flush',
      'Blendable formula, hard to overdo',
      'Buildable from a subtle to a bold flush',
      'Comfortable, non-cakey finish',
    ],
    howToUse: [
      'Smile softly to find the apples of your cheeks.',
      'Apply with fingertips or a brush, blending in small circles.',
      'Build up gradually — a little goes a long way.',
    ],
    suitableFor: ['Everyday makeup looks', 'Natural, no-makeup makeup looks', 'All skin tones'],
    specifications: [
      { property: 'Format', details: 'Cream or powder blush' },
      { property: 'Finish', details: 'Natural flush' },
      { property: 'Skin Type', details: 'All' },
    ],
    faq: [
      { question: 'Will it look too bold?', answer: 'It is buildable, so you can keep it subtle or layer it for more color.' },
      { question: 'How long does it last?', answer: 'It is designed to hold its color through a full day of wear.' },
      { question: 'Can it double as a lip color?', answer: 'Cream formulas can be dabbed on the lips for a matching flush.' },
    ],
  },

  mascara: {
    keyBenefits: [
      'Noticeable volume from the first coat',
      'Lengthens without clumping',
      'Smudge-resistant, all-day wear',
      'Easy to build without flaking',
    ],
    howToUse: [
      'Wiggle the wand at the base of lashes, then sweep upward.',
      'Apply a second coat to outer lashes for extra definition.',
      'Comb through with a clean spoolie to separate lashes.',
    ],
    suitableFor: ['Everyday wear', 'Sensitive eyes', 'Contact lens wearers'],
    specifications: [
      { property: 'Format', details: 'Mascara' },
      { property: 'Finish', details: 'Volumizing & lengthening' },
      { property: 'Skin Type', details: 'All' },
    ],
    faq: [
      { question: 'Does it flake by the end of the day?', answer: 'No, the formula is built to stay put without flaking.' },
      { question: 'Is it easy to remove?', answer: 'Yes, it comes off easily with a gentle makeup remover.' },
      { question: 'Will it clump my lashes together?', answer: 'The brush is designed to separate lashes and prevent clumping.' },
    ],
  },

  skincare: {
    keyBenefits: [
      'Visible results with consistent use',
      'Lightweight, fast-absorbing texture',
      'Formulated for daily use',
      'Layers well with the rest of your routine',
    ],
    howToUse: [
      'Apply to clean, slightly damp skin.',
      'Smooth a small amount evenly over the face and neck.',
      'Follow with moisturizer (and SPF in the morning).',
    ],
    suitableFor: ['Daily routines', 'Sensitive skin', 'All skin types'],
    specifications: [
      { property: 'Format', details: 'Serum / cream' },
      { property: 'Texture', details: 'Lightweight, fast-absorbing' },
      { property: 'Skin Type', details: 'All' },
    ],
    faq: [
      { question: 'How soon will I see results?', answer: 'Most people notice a difference in texture and tone within a few weeks of daily use.' },
      { question: 'Can I use it with other actives?', answer: 'Yes, it layers well with the rest of a normal skincare routine.' },
      { question: 'Is it safe for sensitive skin?', answer: 'Yes, it is formulated to be gentle enough for daily use.' },
    ],
  },

  perfume: {
    keyBenefits: [
      'Long-lasting scent that evolves through the day',
      'Balanced blend of top, heart, and base notes',
      'Non-overpowering, office-friendly projection',
      'Elegant bottle designed to last on a vanity or in a bag',
    ],
    howToUse: [
      'Spray on pulse points — wrists, neck, and inner elbows.',
      "Hold the bottle 10-15cm from skin for even coverage.",
      'Avoid rubbing wrists together, which can break down the scent.',
    ],
    suitableFor: ['Daily wear', 'Evening occasions', 'Layering with matching body products'],
    specifications: [
      { property: 'Format', details: 'Eau de Parfum' },
      { property: 'Longevity', details: 'Long-lasting' },
      { property: 'Concentration', details: 'Eau de Parfum (EDP)' },
    ],
    faq: [
      { question: 'How long does the scent last?', answer: 'As an Eau de Parfum, it is designed to last through most of the day.' },
      { question: 'Is it suitable for sensitive skin?', answer: 'It is safe for most skin types, but a patch test is recommended if you have very sensitive skin.' },
      { question: 'Can it be layered with body lotion?', answer: 'Yes, layering with a matching scented body product helps it last longer.' },
    ],
  },

  bags: {
    keyBenefits: [
      'Durable materials built for daily use',
      'Practical compartments for everyday essentials',
      'Versatile design that pairs with most outfits',
      'Comfortable strap for all-day wear',
    ],
    howToUse: [
      'Adjust the strap to your preferred length.',
      'Use the interior compartments to keep essentials organized.',
      'Store stuffed with paper when not in use to help it keep its shape.',
    ],
    suitableFor: ['Daily use', 'Travel', 'Everyday essentials'],
    specifications: [
      { property: 'Format', details: 'Bag' },
      { property: 'Closure', details: 'Zip / magnetic snap' },
      { property: 'Care', details: 'Wipe clean with a soft, dry cloth' },
    ],
    faq: [
      { question: 'How much can it hold?', answer: 'It comfortably fits everyday essentials like a phone, wallet, and small pouch.' },
      { question: 'Is it water-resistant?', answer: 'It can handle light drizzle, but is not designed for heavy rain.' },
      { question: 'How do I clean it?', answer: 'Wipe with a soft, dry cloth — avoid harsh chemicals or soaking.' },
    ],
  },
}

// ⚡ Fallback عام لأي category جديدة لسه معملهاش قالب مخصص — أحسن
// من صفحة فاضية تمامًا، وسهل بعدين تضيف قالب مخصص أدق ليها.
const DEFAULT_TEMPLATE = {
  keyBenefits: ['Carefully selected for quality and everyday use.'],
  howToUse: ['Follow the instructions on the packaging for best results.'],
  suitableFor: ['Everyday use'],
  specifications: [{ property: 'Format', details: 'Standard' }],
  faq: [],
}

function getContentByCategory(category) {
  return TEMPLATES[category] ?? DEFAULT_TEMPLATE
}

module.exports = { getContentByCategory }
