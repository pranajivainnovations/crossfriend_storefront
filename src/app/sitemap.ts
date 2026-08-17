import type { MetadataRoute } from "next"

import type { StoreGetProductsParams } from "@medusajs/medusa"

import { listAllBakersOrThrow } from "@lib/data/bakers"
import { getTaxonomy } from "@lib/data/taxonomy"
import {
  getCollectionsList,
  getProductsList,
  listCategories,
  resolveProductTypeId,
} from "@lib/data"
import { BASE_URL } from "@lib/util/seo"

/**
 * The sitemap the site has never had. Built from live data rather than a hand-maintained list,
 * because the previous (never-running) next-sitemap config enumerated only static paths — it would
 * have shipped a sitemap containing no products and no bakers, which is close to shipping none.
 *
 * Generated at runtime and held in memory for 15 minutes. Frequent enough that a baker's new
 * product is discoverable the same day, infrequent enough that a crawler cannot make the full
 * catalogue walk run on every hit.
 */
/**
 * Generated per request, never at build time.
 *
 * This was `export const revalidate = 3600`, which let Next prerender the sitemap during
 * `npm run build` inside the Docker image. MEDUSA_BACKEND_URL does not exist at build time — it is
 * supplied by compose when the container starts — so all three data fetches fell back to
 * http://localhost:9000, failed, hit their catch blocks, and a sitemap containing only the 13
 * static paths was baked into the image and served with `x-nextjs-cache: HIT` from then on.
 * Products, bakers, occasions and type pages were all silently absent from what Google was told.
 *
 * It is the same class of bug as the localhost canonical: a value that only exists at runtime being
 * read during the build. Rather than pass the backend URL as a build arg — which would make every
 * image build depend on the production API being reachable, and fail just as silently when it is
 * not — the route is simply excluded from static generation. A sitemap is fetched by crawlers a
 * handful of times a day, so per-request generation costs almost nothing and cannot go stale.
 */
export const dynamic = "force-dynamic"

/**
 * force-dynamic keeps the route out of the build, but on its own it also means a full catalogue
 * walk on every hit — and the sitemap is a public URL anyone can request in a loop. This module
 * cache keeps the two properties apart: generation always happens at runtime with real env, and
 * repeated requests inside the window are served from memory.
 *
 * In-memory and per-container by design. There is one container, the payload is small, and a cache
 * that disappears on restart is exactly right for something derived entirely from upstream data.
 */
const CACHE_TTL_MS = 15 * 60 * 1000
let cached: { at: number; entries: MetadataRoute.Sitemap } | null = null

/** Paths that must never appear: private, infinite, or a redirect. Kept next to robots.ts intent. */
const FORBIDDEN_SEGMENTS = [
  "/account",
  "/cart",
  "/checkout",
  "/order/confirmed",
  "/search",
  "/results/",
  "/design-your-cake",
]

/**
 * Last line of defence before the file is published.
 *
 * Every failure it checks for has actually happened in this project or is one edit away: a
 * localhost URL from a build-time env miss, a duplicate from two sources emitting the same page, a
 * redirect entry from someone adding a path without checking where it goes. A sitemap is trusted
 * far more literally than a page, so it is worth refusing to serve a bad one.
 */
function validate(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>()
  const deduped: MetadataRoute.Sitemap = []

  for (const entry of entries) {
    const url = entry.url

    // Only fatal in production. In development BASE_URL is http://localhost:8000 by design, and a
    // dev sitemap full of localhost URLs is correct — it is never published. Guarding on NODE_ENV
    // rather than on the string alone keeps the check meaningful where it matters and silent where
    // it would just break local work.
    if (
      process.env.NODE_ENV === "production" &&
      (url.includes("localhost") || url.includes("127.0.0.1"))
    ) {
      throw new Error(`[sitemap] refusing to publish a localhost URL: ${url}`)
    }
    if (!url.startsWith(BASE_URL)) {
      throw new Error(`[sitemap] refusing to publish an off-site URL: ${url}`)
    }

    const path = url.slice(BASE_URL.length)
    const forbidden = FORBIDDEN_SEGMENTS.find((segment) => path.startsWith(segment))
    if (forbidden) {
      throw new Error(`[sitemap] refusing to publish a private or redirecting URL: ${url}`)
    }

    // Duplicates are dropped rather than thrown on: two sources legitimately describing the same
    // page is a modelling overlap, not corruption, and the first one wins deterministically.
    if (seen.has(url)) continue
    seen.add(url)
    deduped.push(entry)
  }

  return deduped
}

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
  // A tool page rather than a product page, but it is the entry point for a whole class of
  // informational queries, so it is ranked with the commercial pages rather than the legal ones.
  { path: "/cake-size-calculator", priority: 0.7, changeFrequency: "monthly" },
  // Original designs with original images — the one kind of page nobody else can publish.
  { path: "/ai-cake-studio/gallery", priority: 0.8, changeFrequency: "daily" },
  // Listing pages for the two browse hierarchies. Their individual pages are enumerated below.
  { path: "/categories", priority: 0.7, changeFrequency: "weekly" },
  { path: "/collections", priority: 0.7, changeFrequency: "weekly" },
  // NOT listed: /design-your-cake redirects to /ai-cake-studio, and a sitemap entry that redirects
  // wastes crawl budget and reports as an error in Search Console. /search, /cart, /account and
  // /results/[query] are excluded for the same class of reason — private, or infinite URL space.
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
 * How many CrossFriend products match a filter.
 *
 * `limit: 1` because only the count is wanted — Medusa computes it server-side over the whole
 * result set, so this costs one row rather than a page. Deliberately routed through
 * getProductsList rather than the Medusa client directly, so it inherits the sales-channel filter:
 * counting the raw catalogue would count Pranajiva's wellness products and declare a CrossFriend
 * page populated on the strength of another brand's stock.
 */
async function countProducts(queryParams: StoreGetProductsParams): Promise<number> {
  const { response } = await getProductsList({
    queryParams: { ...queryParams, limit: 1 },
  })
  return response.count
}

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

/**
 * Builds the entry list. Throws if any upstream source ERRORS.
 *
 * The distinction that matters is error versus legitimately empty. A marketplace with no products
 * yet should publish a sitemap of its real pages — that is honest. A marketplace whose backend is
 * down must publish nothing at all, because a 200 response listing 16 URLs tells Google those are
 * the only pages that exist, and Google acts on it. A 500 is simply retried later.
 *
 * So nothing here is wrapped in a catch that substitutes an empty array. Failures propagate.
 */
async function buildEntries(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const [productEntries, bakers, taxonomy, collectionResult, categoryResult] =
    await Promise.all([
      collectProductEntries(now),
      listAllBakersOrThrow(),
      getTaxonomy(),
      // Both are filtered to metadata.brand === "crossfriend" by the data layer, so Pranajiva's
      // collections and categories cannot leak into this site's sitemap.
      getCollectionsList(0, PAGE_SIZE),
      listCategories(),
    ])

  // Verified against production: collections count 13, categories count 27, and the API honours
  // limit=100 for both. Neither is near the ceiling, but silence at the boundary is how the baker
  // truncation went unnoticed, so say something rather than nothing.
  if (collectionResult.count > PAGE_SIZE) {
    console.error(
      `[sitemap] ${collectionResult.count} collections exceeds the ${PAGE_SIZE} fetched — sitemap is truncated, add pagination`
    )
  }
  if (categoryResult.length >= PAGE_SIZE) {
    console.error(
      `[sitemap] category fetch hit the ${PAGE_SIZE} limit — crossfriend categories may be missing, add pagination`
    )
  }

  /**
   * Only pages that have something on them get submitted.
   *
   * Search Console reported 218 URLs "Crawled — currently not indexed" against a catalogue of one
   * product. The cause was this file: it enumerated every collection, category, occasion, type and
   * baker that EXISTS, not every one that has stock. Google fetched /collections/birthday, found an
   * empty grid, and declined to index it — and that judgement is sticky, so a page can go on being
   * skipped after it fills up. Submitting an empty page is worse than not submitting it.
   *
   * Type counts are resolved first because they are needed twice: once for the /store?type= entries
   * and once to decide which occasions have anything to show. Every count runs in parallel, and the
   * whole result is held by the 15-minute cache above, so a crawl costs one round of counting.
   */
  const typeCounts = new Map<string, number>()
  await Promise.all(
    (taxonomy?.types ?? []).map(async (type) => {
      const typeId = await resolveProductTypeId(type.value)
      typeCounts.set(type.value, typeId ? await countProducts({ type_id: [typeId] }) : 0)
    })
  )

  const collections = (collectionResult?.collections ?? []).filter((c) => Boolean(c.handle))
  const collectionCounts = await Promise.all(
    collections.map((collection) => countProducts({ collection_id: [collection.id] }))
  )
  const populatedCollections = collections.filter((_, index) => collectionCounts[index] > 0)

  // Top-level only, for the reason given at categoryEntries below.
  const categories = (categoryResult ?? []).filter(
    (category) => Boolean(category.handle) && !category.parent_category_id
  )
  const categoryCounts = await Promise.all(
    categories.map((category) => countProducts({ category_id: [category.id] }))
  )
  const populatedCategories = categories.filter((_, index) => categoryCounts[index] > 0)

  /**
   * An occasion page is not backed by a collection — it renders one section per product type mapped
   * to it in the taxonomy matrix, and each section falls back to every product of that type when
   * the occasion has no curated picks (see OccasionSection). So it has content whenever any mapped
   * type has stock, which is a different question from whether a collection of the same name does.
   */
  const populatedOccasions = (taxonomy?.occasions ?? []).filter((occasion) =>
    (taxonomy?.matrix?.[occasion.handle] ?? []).some((value) => (typeCounts.get(value) ?? 0) > 0)
  )

  // productCount comes from the directory API, which already counts only published products.
  const populatedBakers = bakers.filter((baker) => baker.productCount > 0)

  /**
   * Say what was withheld, and why.
   *
   * A sitemap that silently shrinks is indistinguishable from one that broke — exactly the failure
   * this file has already had twice. These lines make "12 pages held back because they are empty"
   * a thing you can read in the logs rather than infer from a URL count.
   */
  const withheld = [
    ["collections", collections.length - populatedCollections.length],
    ["categories", categories.length - populatedCategories.length],
    ["occasions", (taxonomy?.occasions ?? []).length - populatedOccasions.length],
    [
      "types",
      (taxonomy?.types ?? []).length -
        Array.from(typeCounts.values()).filter((n) => n > 0).length,
    ],
    ["bakers", bakers.length - populatedBakers.length],
  ].filter(([, n]) => (n as number) > 0)

  if (withheld.length > 0) {
    console.info(
      `[sitemap] withholding empty pages — ${withheld
        .map(([kind, n]) => `${n} ${kind}`)
        .join(", ")}. They return once they have products.`
    )
  }

  // No lastModified. These change only when the site is redeployed, and there is no per-path date
  // to report; stamping "now" would tell crawlers every page changed on every fetch, which is both
  // untrue and self-defeating — a lastModified that is always current carries no information.
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}${path}`,
      changeFrequency,
      priority,
    })
  )

  // The baker payload carries no created_at or updated_at — confirmed against the live API — so
  // lastModified is omitted rather than faked.
  const bakerEntries: MetadataRoute.Sitemap = populatedBakers.map((baker) => ({
    url: `${BASE_URL}/bakers/${baker.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  // Occasion and type pages are the taxonomy's whole reason for existing — they are the landing
  // pages for "birthday cake", which is what people actually search for. The taxonomy payload is
  // presentation data (handle, label, emoji, order) with no timestamps, so again no lastModified.
  const occasionEntries: MetadataRoute.Sitemap = populatedOccasions.map((occasion) => ({
    url: `${BASE_URL}/occasions/${occasion.handle}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  // Collection pages are the "birthday cakes", "chocolate cakes" landing pages — the phrases people
  // actually type. Higher intent than a product page and far more durable, since a collection
  // outlives any individual product in it.
  const collectionEntries: MetadataRoute.Sitemap = populatedCollections
    .map((collection) => ({
      url: `${BASE_URL}/collections/${collection.handle}`,
      // Real updated_at, verified present on the live API. This is the one signal here worth
      // sending, so it is sent honestly rather than defaulted to now.
      ...(collection.updated_at ? { lastModified: new Date(collection.updated_at) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

  // Top-level categories only. The route is a catch-all ([...category]) where a child lives at
  // /categories/parent/child, and emitting a guessed path that 404s is worse than omitting it —
  // Search Console reports it as an error and it burns crawl budget. /categories/<handle> is the
  // form the mega-menu already links, so these URLs are known to resolve.
  const categoryEntries: MetadataRoute.Sitemap = populatedCategories
    .map((category) => ({
      url: `${BASE_URL}/categories/${category.handle}`,
      ...(category.updated_at ? { lastModified: new Date(category.updated_at) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

  /**
   * These parameterised URLs are intentional, indexable pages — not an oversight.
   *
   * `generateMetadata` in app/(main)/store/page.tsx sets `canonical: /store?<params>` for exactly
   * this shape, deliberately: the filtered views were previously six URLs sharing one title, one
   * description and no canonical, competing with each other as duplicates. Sort and page are
   * excluded from that canonical, and are excluded here too, so the sitemap and the canonical agree
   * on precisely one URL per filter.
   *
   * URLSearchParams and encodeURIComponent agree for every current type value (cake, decor, gift,
   * …). If a value ever contains a character they encode differently, this and the canonical would
   * disagree and the page would be self-referentially non-canonical.
   */
  const typeEntries: MetadataRoute.Sitemap = (taxonomy?.types ?? [])
    .filter((type) => (typeCounts.get(type.value) ?? 0) > 0)
    .map((type) => ({
      url: `${BASE_URL}/store?type=${encodeURIComponent(type.value)}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))

  // Order is not a ranking signal, but it makes the file readable when someone opens it to check
  // whether the dynamic sections are populated — the failure mode this sitemap has actually had.
  return validate([
    ...staticEntries,
    ...occasionEntries,
    ...collectionEntries,
    ...categoryEntries,
    ...typeEntries,
    ...bakerEntries,
    ...productEntries,
  ])
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.entries
  }

  try {
    const entries = await buildEntries()
    cached = { at: Date.now(), entries }
    return entries
  } catch (error) {
    // Serving the previous good sitemap through a brief backend blip is strictly better than
    // serving a truncated one, and better than a 500 Google might interpret as the file being gone.
    if (cached) {
      console.error("[sitemap] build failed — serving last known good sitemap", error)
      return cached.entries
    }

    // Nothing cached and the backend is unreachable. Rethrowing produces a 5xx, which Google treats
    // as "try again later" and leaves the existing index untouched. The alternative — returning the
    // static paths alone — is a 200 that positively asserts this site has 16 pages.
    console.error("[sitemap] build failed with no cached fallback — returning 5xx", error)
    throw error
  }
}
