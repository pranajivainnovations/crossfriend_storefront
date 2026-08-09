import Link from "next/link"

import { ENTITY, LEGAL_LAST_UPDATED, LEGAL_PAGES } from "@lib/constants/legal"

/**
 * Shared chrome for every legal document.
 *
 * These are read in two very different ways — skimmed by a customer looking for one answer, and
 * read closely by a payment gateway or a lawyer — so the page carries a sidebar of all six
 * documents and generous type. Nothing decorative: a policy page that looks designed reads as
 * marketing, which is the wrong register for a document that has to be relied upon.
 */

export function LegalShell({
  title,
  summary,
  children,
}: {
  title: string
  /** One plain sentence a customer can act on without reading the rest. */
  summary: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white">
      <div className="content-container py-10 small:py-14">
        <div className="grid gap-10 small:grid-cols-[220px_1fr] small:gap-14">
          {/* Sidebar — every document, always. Someone who lands on Refunds from a Google result
              needs to find Shipping without going back to the footer. */}
          <nav aria-label="Legal documents" className="small:sticky small:top-24 small:self-start">
            <p className="text-xs font-semibold uppercase tracking-widest text-grey-40">Legal</p>
            <ul className="mt-3 space-y-1">
              {LEGAL_PAGES.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className="block rounded-rounded px-2 py-1.5 text-sm text-grey-60 transition hover:bg-cf-warm hover:text-cf-orange"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <article className="max-w-2xl">
            <h1 className="cf-heading text-3xl text-grey-90 small:text-4xl">{title}</h1>
            <p className="mt-3 text-base-regular leading-relaxed text-grey-60">{summary}</p>
            <p className="mt-4 text-small-regular text-grey-40">
              Last updated {LEGAL_LAST_UPDATED} · {ENTITY.legalName}
            </p>

            <div className="mt-10 space-y-10">{children}</div>

            <div className="mt-14 rounded-large border border-cf-warm-dark bg-cf-warm/50 p-5">
              <p className="text-base-semi text-grey-90">Questions about this policy?</p>
              <p className="mt-1.5 text-base-regular text-grey-60">
                Email{" "}
                <a href={`mailto:${ENTITY.supportEmail}`} className="text-cf-orange underline">
                  {ENTITY.supportEmail}
                </a>{" "}
                or call{" "}
                <a href={`tel:${ENTITY.supportPhone.replace(/\s/g, "")}`} className="text-cf-orange underline">
                  {ENTITY.supportPhone}
                </a>
                .
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

/** A numbered section. Numbering is real here — these documents get cited by clause. */
export function Section({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl-semi text-grey-90">
        <span className="mr-2 font-normal text-grey-40 tabular-nums">{n}.</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-base-regular leading-relaxed text-grey-70">{children}</div>
    </section>
  )
}

/** Bulleted list with the spacing the rest of the document uses. */
export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="ml-5 list-disc space-y-2 marker:text-grey-30">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

/** For the things a reader must not skim past — allergens, cancellation windows, liability. */
export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-large border-l-4 border-cf-orange bg-cf-warm/60 px-4 py-3 text-base-regular text-grey-80">
      {children}
    </div>
  )
}
