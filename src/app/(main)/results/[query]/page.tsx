import { Metadata } from "next"
import { notFound } from "next/navigation"

import SearchResultsTemplate from "@modules/search/templates/search-results-template"

import { search } from "@modules/search/actions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

/**
 * Search is off (`features.search: false` in store.config.json) and no MeiliSearch instance is
 * configured, so `search()` threw on every request and this route answered 500 — for any query
 * string, across an unbounded URL space. Verified in production: /results/cake and
 * /results/zzqxtest both returned 500. That is the "Server error (5xx)" Search Console reported.
 *
 * A 500 is the worst available answer here, because it tells Google the page exists and is
 * temporarily broken, so it keeps coming back. The page does not exist, so it now says 404 and the
 * crawler drops it. When search is switched back on the flag alone restores the route.
 */
const SEARCH_ENABLED = Boolean(process.env.FEATURE_SEARCH_ENABLED)

// Static, and identical on every /results/* URL — which is also why these pages read as duplicates
// of one another. Kept minimal since the route only renders at all when search is enabled.
export const metadata: Metadata = {
  title: "Search",
  description: "Explore all of our products.",
  robots: { index: false, follow: false },
}

type Params = {
  params: { query: string }
  searchParams: {
    sortBy?: SortOptions
    page?: string
  }
}

export default async function SearchResults({ params, searchParams }: Params) {
  const { query } = params
  const { sortBy, page } = searchParams

  if (!SEARCH_ENABLED) {
    notFound()
  }

  // Even with search enabled, an unreachable index must not become a 500 on a public, unbounded
  // URL space. Failing closed to a 404 keeps one broken dependency from generating crawl errors
  // without limit.
  const hits = await search(query).catch(() => null)

  if (!hits) {
    notFound()
  }

  const ids = hits
    .map((h) => h.objectID || h.id)
    .filter((id): id is string => {
      return typeof id === "string"
    })

  return (
    <SearchResultsTemplate
      query={query}
      ids={ids}
      sortBy={sortBy}
      page={page}
    />
  )
}
