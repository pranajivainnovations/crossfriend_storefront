import { cache } from "react"

/**
 * Public baker directory data.
 *
 * Plain `fetch` against our own backend rather than the Medusa JS client, deliberately: these are
 * custom CrossFriend routes the SDK knows nothing about, and `fetch` actually participates in
 * Next's data cache — unlike the axios-based SDK, where the `next: { tags }` option is silently
 * ignored (which is why `revalidateTag` does nothing for cart/product reads elsewhere in this app).
 *
 * Wrapped in React `cache()` so a page that needs the same baker twice in one render — profile
 * header and product section, say — pays for one round trip, not two. That matters more than usual
 * here: the database sits a full network hop from the backend, so every avoided call is real time.
 */

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * Baker data is not cached, on either surface.
 *
 * This was 300s, then 30s, on the reasoning that directory membership changes rarely. Both were
 * wrong for the same reason. `revalidate` is stale-while-revalidate: once an entry is populated
 * while the directory is empty, every subsequent request keeps being served that empty answer while
 * a refresh happens behind it. Ops publishes a bakery, reloads the homepage repeatedly, and the
 * Local Bakers section stays missing — measured still absent 42 seconds after a 30s window.
 *
 * The homepage and the directory both show whether a bakery exists at all, which is precisely what
 * someone checks immediately after making one. One indexed query is the right price for that.
 *
 * If this ever needs caching for traffic reasons, the fix is OPS revalidating the `bakers` tag when
 * it flips `is_public` — not another blind window that hides the change for an unpredictable time.
 */

export interface BakerSummary {
  /** The human-readable Baker ID, e.g. CFB-00042. Stable for the life of the bakery. */
  id: string
  slug: string
  name: string
  city: string | null
  state: string | null
  bio: string | null
  photoUrl: string | null
  specialties: string[]
  rating: number | null
  reviewCount: number
  blueTick: boolean
  trustBadge: boolean
  productCount: number
}

export interface BakerProfile extends BakerSummary {
  pincode: string | null
  websiteUrl: string | null
  coverUrl: string | null
  turnaroundHours: number | null
}

export interface BakerListResult {
  bakers: BakerSummary[]
  pagination: { page: number; limit: number; total: number; hasMore: boolean }
}

const EMPTY_LIST: BakerListResult = {
  bakers: [],
  pagination: { page: 1, limit: 24, total: 0, hasMore: false },
}

export const listBakers = cache(async function listBakers(params: {
  q?: string
  city?: string
  page?: number
  limit?: number
}): Promise<BakerListResult> {
  const search = new URLSearchParams()
  if (params.q) search.set("q", params.q)
  if (params.city) search.set("city", params.city)
  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/bakers?${search}`, {
      cache: "no-store",
    })
    if (!res.ok) return EMPTY_LIST
    return (await res.json()) as BakerListResult
  } catch (error) {
    // A directory that throws takes a nav link down with it. An empty directory is also the honest
    // state of a marketplace with no public bakers yet, so degrade to that.
    console.error("[bakers] Failed to load directory", error)
    return EMPTY_LIST
  }
})

/**
 * One baker's profile and the products they have published.
 *
 * Deliberately NOT cached, unlike the directory above.
 *
 * This payload contains the list of published product ids, which changes the instant a baker hits
 * Publish in the portal. Caching it for even a short window produces the worst possible first
 * impression: the baker publishes, opens their own page to check, and sees "Nothing listed just
 * yet". Worse, the portal is a separate application on another domain, so it cannot invalidate this
 * cache — there is nothing the baker could do but wait without knowing why.
 *
 * The cost is one indexed query per profile view, which is the right trade for a page whose whole
 * job is to be an accurate shop window.
 */
export const getBakerBySlug = cache(async function getBakerBySlug(
  slug: string
): Promise<{ baker: BakerProfile; productIds: string[] } | null> {
  try {
    const res = await fetch(
      `${MEDUSA_BACKEND_URL}/store/bakers/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    )
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error(`[bakers] Failed to load baker "${slug}"`, error)
    return null
  }
})
