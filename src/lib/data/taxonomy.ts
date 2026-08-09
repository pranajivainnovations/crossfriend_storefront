import { cache } from "react"

/**
 * CrossFriend's navigation taxonomy — product types, occasions, and the matrix pairing them.
 *
 * ── What this replaces ──────────────────────────────────────────────────────────────────────────
 * The same relationship used to live in four places that had drifted apart: TYPE_OCCASION_MAP and
 * OCCASIONS[].sectionOrder in code, type-occasion-map.json on disk, and OCCASION_KITS as a second
 * hand-synced copy. They disagreed with each other and with the database — of six configured
 * product types only `cake` actually existed in Medusa, so five of six navigation chips filtered on
 * a value no product could carry, and nothing anywhere failed loudly.
 *
 * It is now one table with foreign keys, edited in OPS at /taxonomy, and read here.
 *
 * ── Why a bespoke backend route and not Medusa's own endpoints ─────────────────────────────────
 * /store/product-types and /store/collections return Pranajiva's rows too — the two brands share
 * one Medusa install — and neither has any notion of "active", display order, or the matrix. The
 * backend route is the filter; going direct would put wellness powders in CrossFriend navigation.
 *
 * ── Caching ─────────────────────────────────────────────────────────────────────────────────────
 * Plain `fetch`, so Next's data cache genuinely applies — the Medusa JS client uses axios, where
 * `next: { revalidate }` is silently ignored, which is why this deliberately does not go through
 * medusaClient. 60s means an OPS edit shows up on the storefront within a minute rather than at the
 * next deploy, and a burst of traffic still collapses onto one backend call.
 */

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9000"

export interface TaxonomyType {
  id: string
  value: string
  label: string
  emoji: string | null
  order: number
}

export interface TaxonomyOccasion {
  id: string
  handle: string
  label: string
  tagline: string | null
  emoji: string | null
  gradient: string | null
  order: number
}

export interface Taxonomy {
  types: TaxonomyType[]
  occasions: TaxonomyOccasion[]
  /** occasion handle -> product type values, already in section order. */
  matrix: Record<string, string[]>
}

const EMPTY: Taxonomy = { types: [], occasions: [], matrix: {} }

export const getTaxonomy = cache(async function getTaxonomy(): Promise<Taxonomy> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/crossfriend/taxonomy`, {
      next: { revalidate: 60, tags: ["taxonomy"] },
    })
    if (!res.ok) {
      console.error(`[taxonomy] backend responded ${res.status}`)
      return EMPTY
    }
    const data = (await res.json()) as Taxonomy
    return {
      types: data.types ?? [],
      occasions: data.occasions ?? [],
      matrix: data.matrix ?? {},
    }
  } catch (error) {
    // An unreachable backend must not take navigation down with it. Every consumer already renders
    // nothing for an empty list, which degrades to a plain header rather than a 500.
    console.error("[taxonomy] unreachable", error)
    return EMPTY
  }
})

/**
 * Which product types appear on this occasion's page, in section order.
 *
 * Returns type *values* (`cake`, `decor`) because that is what the product filter takes. An unknown
 * occasion returns an empty list rather than throwing — the page renders its hero and no sections,
 * which is the same thing it does for a real occasion with nothing mapped yet.
 */
export async function getOccasionTypeValues(occasionHandle: string): Promise<string[]> {
  const { matrix } = await getTaxonomy()
  return matrix[occasionHandle] ?? []
}
