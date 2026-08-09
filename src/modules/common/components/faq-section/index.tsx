import { FaqEntry } from "@lib/constants/faq"

/**
 * The visible half of an FAQ. The structured data is emitted separately by the page, but it may
 * only describe questions that actually render here — FAQ markup for content a visitor cannot see
 * is invalid, and is treated as an attempt to mislead rather than an oversight.
 *
 * Built on <details>/<summary> so it expands with no JavaScript, stays keyboard operable for free,
 * and — the part that matters for answer engines — keeps every answer in the HTML whether or not
 * the section is open. An accordion that only renders its answer after a click puts the content
 * behind an interaction a crawler will not perform.
 */
export default function FaqSection({
  entries,
  title = "Common questions",
  className = "",
}: {
  entries: FaqEntry[]
  title?: string
  className?: string
}) {
  if (entries.length === 0) return null

  return (
    <section className={`content-container py-12 small:py-16 ${className}`} aria-labelledby="faq-heading">
      <h2
        id="faq-heading"
        className="cf-heading mb-6 text-2xl small:mb-8 small:text-3xl"
      >
        {title}
      </h2>

      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {entries.map((entry) => (
          <details
            key={entry.question}
            className="group rounded-xl border border-cf-purple-100 bg-white px-5 py-4 transition-colors hover:border-cf-purple-300"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-grey-90 marker:hidden">
              <h3 className="text-base font-semibold">{entry.question}</h3>
              <span
                aria-hidden="true"
                className="shrink-0 text-xl leading-none text-cf-purple-300 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-base-regular leading-relaxed text-grey-60">
              {entry.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
