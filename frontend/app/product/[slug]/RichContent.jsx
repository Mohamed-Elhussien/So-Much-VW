// ⚡ كل قسم بيختفي لوحده لو الحقل بتاعه فاضي — مش كل منتج لازم يكون
// عنده FAQ مثلاً.
export default function RichContent({ product }) {
  const hasSpecs = product.specifications?.length > 0
  const hasFaq = product.faq?.length > 0

  return (
    <>
      {/* HTML منضّف (sanitize-html وقت الـ sync) فآمن للعرض. فيه عناوينه الخاصة. */}
      {product.descriptionHtml ? (
        <section className="rich-text max-w-3xl" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
      ) : (
        product.description && (
          <section>
            <h2 className="font-display text-2xl italic text-ink">What is {product.name}?</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/70">{product.description}</p>
          </section>
        )
      )}

      {product.keyBenefits?.length > 0 && (
        <section>
          <h2 className="font-display text-2xl italic text-ink">Key Benefits</h2>
          <ul className="mt-3 space-y-2">
            {product.keyBenefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink/70">
                <span className="mt-0.5 text-gold-dark">✓</span> {b}
              </li>
            ))}
          </ul>
        </section>
      )}

      {product.howToUse?.length > 0 && (
        <section>
          <h2 className="font-display text-2xl italic text-ink">How to Use</h2>
          <ol className="mt-3 space-y-2">
            {product.howToUse.map((step, i) => (
              <li key={i} className="text-sm text-ink/70">
                {i + 1}. {step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {product.suitableFor?.length > 0 && (
        <section>
          <h2 className="font-display text-2xl italic text-ink">Suitable For</h2>
          <ul className="mt-3 space-y-2">
            {product.suitableFor.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-ink/70">
                <span className="text-gold-dark">✓</span> {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasSpecs && (
        <section>
          <h2 className="font-display text-2xl italic text-ink">Product Specifications</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10">
            <table className="w-full text-sm">
              <tbody>
                {product.specifications.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-ink/[0.02]' : ''}>
                    <td className="border-t border-ink/10 px-4 py-3 font-medium text-ink/70 first:border-t-0">{row.property}</td>
                    <td className="border-t border-ink/10 px-4 py-3 text-ink/60 first:border-t-0">{row.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {hasFaq && (
        <section>
          <h2 className="font-display text-2xl italic text-ink">FAQ</h2>
          <div className="mt-4 space-y-4">
            {product.faq.map((f, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-ink">Q: {f.question}</p>
                <p className="mt-1 text-sm text-ink/60">A: {f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
