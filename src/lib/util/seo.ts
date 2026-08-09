/**
 * One definition of where this site lives, plus the structured-data builders that depend on it.
 *
 * This file exists because of a real outage-grade bug: BASE_URL was defined inline in layout.tsx
 * as `process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"`, the variable was never set in
 * any environment, and so production served
 *
 *     <link rel="canonical" href="http://localhost:8000/products/…"/>
 *
 * on every page. A canonical pointing at an unreachable host tells Google the real address of the
 * content is somewhere it cannot go, which suppresses indexing for the whole site. It had been
 * live and silent because nothing about a wrong canonical is visible to a human using the site.
 *
 * The fix has two halves: set the variable, and make the fallback safe. A missing env var in
 * production now degrades to the production domain rather than to localhost — wrong-but-harmless
 * instead of wrong-and-fatal.
 */

const PRODUCTION_URL = "https://crossfriend.in"

function resolveBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (configured) return configured.replace(/\/$/, "")
  // Only development may fall back to localhost. In production a localhost canonical is worse
  // than a guessed-but-real domain, because it actively instructs crawlers to discard the page.
  return process.env.NODE_ENV === "production" ? PRODUCTION_URL : "http://localhost:8000"
}

export const BASE_URL = resolveBaseUrl()

/** Absolute URL for a site-relative path. Structured data must never contain relative URLs. */
export function absoluteUrl(path: string): string {
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export const ORGANIZATION_ID = `${BASE_URL}/#organization`
export const WEBSITE_ID = `${BASE_URL}/#website`

/**
 * Renders one JSON-LD block. Kept here so every call site escapes identically — `<` inside a
 * string would otherwise let a product title close the script tag.
 */
export function jsonLdScriptProps(data: unknown): {
  type: "application/ld+json"
  dangerouslySetInnerHTML: { __html: string }
} {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    },
  }
}

/** Strips HTML and collapses whitespace so a description reads as a sentence in a search result. */
export function plainText(value: string | null | undefined, limit = 300): string {
  if (!value) return ""
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text
}

/**
 * FAQPage markup.
 *
 * Only ever call this with entries that are also rendered on the page — Google's own guidance is
 * that FAQ structured data must describe content visible to the visitor, and answer engines quote
 * these strings directly to people who will never load the page.
 */
export function faqJsonLd(entries: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  }
}

export interface BreadcrumbEntry {
  name: string
  path: string
}

export function breadcrumbJsonLd(entries: BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path),
    })),
  }
}
