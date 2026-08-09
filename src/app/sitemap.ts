import type { MetadataRoute } from "next"

import { listBakers } from "@lib/data/bakers"
import { getTaxonomy } from "@lib/data/taxonomy"
import { getProductsList } from "@lib/data"
import { BASE_URL } from "@lib/util/seo"

/**
 * The sitemap the site has never had. Built from live data rather than a hand-maintained list,
 * because the previous (never-running) next-sitemap config enumerated only static paths — it would
 * have shipped a sitemap containing no products and no bakers, which is close to shipping none.
 *
 * Regenerated hourly. Frequent enough that a baker's new product is discoverable the same day,
 * infrequent enough that a crawler cannot make the catalogue query run on every hit.
 */
export const revalidate = 3600

const STATIC_PATHS: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
}> = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/ai-cake-studio", priority: 0.9, changeFrequency: "weekly" },
  { path: "/store", priority: 0.9, changeFrequency: "daily" },
  { path: "/ready-to-order", priority: 0.8, changeFrequency: "daily" },
  { path: "/bakers", priority: 0.8, changeFrequency: "weekly" },
  { path: "/occasions", priority: 0.8, changeFrequency: "weekly" },
  // Legal pages carry little ranking weight but their absence is conspicuous to a reviewer
  // assessing whether a storefront is a real business.
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/shipping-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/food-safety", priority: 0.4, changeFrequency: "yearly" },
  { path: "/seller-terms", priority: 0.3, changeFrequency: "yearly" },
]

const PAGE_SIZE = 100

/**
 * Walks the whole catalogue.
 *
 * `pageParam` is an OFFSET in rows, not a page number — passing 1, 2, 3 would re-request almost
 * the same window every time and never terminate. It advances by PAGE_SIZE, and stops on the
 * `nextPage` the data layer already computes from the true `count`.
 */
async function collectProductEntries(now: Date): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
  const seen = new Set<string>()
  let offset: number | null = 0

  // A ceiling, not an expectation: it stops a broken pagination contract from looping forever.
  const MAX_REQUESTS = 50

  for (let request = 0; request < MAX_REQUESTS && offset !== null; request++) {
    const { response, nextPage } = await getProductsList({
      pageParam: offset,
      queryParams: { limit: PAGE_SIZE },
    })

    for (const product of response?.products ?? []) {
      if (!product.handle || seen.has(product.handle)) continue
      seen.add(product.handle)
      entries.push({
        url: `${BASE_URL}/products/${product.handle}`,
        // The preview shape carries created_at but not updated_at. An honest creation date beats
        // stamping every product with "now", which would tell crawlers the entire catalogue
        // changes on every fetch and devalue the signal.
        lastModified: product.created_at ? new Date(product.created_at) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    }

    offset = nextPage
  }

  return entries
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Independent sources, fetched together. Each is individually guarded below, because one
  // unavailable backend must not produce an empty sitemap for the entire site — an empty sitemap
  // is a positive statement that the site has no pages.
  const [productEntries, bakerResult, taxonomy] = await Promise.all([
    collectProductEntries(now).catch((error) => {
      console.error("[sitemap] product listing failed", error)
      return [] as MetadataRoute.Sitemap
    }),
    listBakers({ limit: 200 }).catch((error) => {
      console.error("[sitemap] baker directory failed", error)
      return null
    }),
    getTaxonomy().catch((error) => {
      console.error("[sitemap] taxonomy failed", error)
      return null
    }),
  ])

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })
  )

  const bakerEntries: MetadataRoute.Sitemap = (bakerResult?.bakers ?? [])
    .filter((baker) => Boolean(baker.slug))
    .map((baker) => ({
      url: `${BASE_URL}/bakers/${baker.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

  // Occasion and type pages are the taxonomy's whole reason for existing — they are the landing
  // pages for "birthday cake", which is what people actually search for.
  const occasionEntries: MetadataRoute.Sitemap = (taxonomy?.occasions ?? []).map((occasion) => ({
    url: `${BASE_URL}/occasions/${occasion.handle}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const typeEntries: MetadataRoute.Sitemap = (taxonomy?.types ?? []).map((type) => ({
    url: `${BASE_URL}/store?type=${encodeURIComponent(type.value)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [
    ...staticEntries,
    ...occasionEntries,
    ...typeEntries,
    ...bakerEntries,
    ...productEntries,
  ]
}
