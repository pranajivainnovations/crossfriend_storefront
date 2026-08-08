import { cache } from "react"

import { medusaClient } from "@lib/config"
import { getCrossFriendSalesChannelId, getRegion } from "@lib/data"
import transformProductPreview from "@lib/util/transform-product-preview"
import { ProductPreviewType } from "types/global"

/**
 * Ready-to-Order marketplace data.
 *
 * Every filter here runs in Postgres against an index — sales channel and category are both
 * first-class Medusa relations. This replaces the old approach of fetching the entire catalogue and
 * filtering `metadata.brand` in JavaScript, which worked only because the catalogue was 56 products
 * and would have collapsed at the scale this is being built for: `limit` and `offset` against the
 * API meant nothing once the results were filtered afterwards, so pagination was already incorrect.
 *
 * Baker attribution costs no extra queries. `baker_name` and `baker_slug` are denormalised onto
 * product metadata when the product is created, precisely so a grid of 24 products does not become
 * 24 lookups. Those values are a read cache for rendering only — ownership is decided by
 * baker_network.baker_products and nothing here consults metadata for that.
 */

/** Handles of the Ready-to-Order tree, from CreateCrossFriendCatalogTaxonomy. */
export const MARKETPLACE_CATEGORIES = [
  { handle: "cakes", label: "Cakes" },
  { handle: "pastries", label: "Pastries" },
  { handle: "desserts", label: "Desserts" },
  { handle: "brownies", label: "Brownies" },
  { handle: "gifts", label: "Gifts" },
  { handle: "decor", label: "Decor" },
] as const

export type MarketplaceSort = "newest" | "price-asc" | "price-desc"

export interface MarketplaceProduct extends ProductPreviewType {
  bakerName?: string
  bakerSlug?: string
}

export interface MarketplaceResult {
  products: MarketplaceProduct[]
  count: number
  page: number
  limit: number
  hasMore: boolean
}

const EMPTY: MarketplaceResult = {
  products: [],
  count: 0,
  page: 1,
  limit: 24,
  hasMore: false,
}

/**
 * Resolves a category handle to its Medusa id.
 *
 * Ids are environment-specific, handles are stable and appear in our own URLs, so the storefront
 * routes on handles and translates once here. Cached for an hour — the taxonomy ships in a
 * migration and does not change at runtime.
 */
const getCategoryIdByHandle = cache(async function (handle: string): Promise<string | null> {
  try {
    const { product_categories } = await medusaClient.productCategories.list(
      { handle },
      { next: { revalidate: 3600, tags: ["categories"] } } as Record<string, unknown>
    )
    return product_categories?.[0]?.id ?? null
  } catch {
    return null
  }
})

export const listMarketplaceProducts = cache(async function listMarketplaceProducts(params: {
  categoryHandle?: string
  page?: number
  limit?: number
  sort?: MarketplaceSort
}): Promise<MarketplaceResult> {
  const limit = Math.min(Math.max(params.limit ?? 24, 1), 48)
  const page = Math.max(params.page ?? 1, 1)
  const offset = (page - 1) * limit

  const [region, salesChannelId] = await Promise.all([
    getRegion("in"),
    getCrossFriendSalesChannelId(),
  ])

  if (!region) return EMPTY

  // Without a channel we would fall back to the whole store, which on this install means showing
  // Pranajiva's wellness catalogue inside a cake marketplace. Returning nothing is the safer
  // failure: an empty grid is confusing, the wrong products are wrong.
  if (!salesChannelId) {
    console.error("[marketplace] crossfriend sales channel unresolved — refusing to list")
    return EMPTY
  }

  const categoryId = params.categoryHandle
    ? await getCategoryIdByHandle(params.categoryHandle)
    : null

  if (params.categoryHandle && !categoryId) {
    return { ...EMPTY, page, limit }
  }

  try {
    const { products, count } = await medusaClient.products.list(
      {
        sales_channel_id: [salesChannelId],
        ...(categoryId ? { category_id: [categoryId] } : {}),
        region_id: region.id,
        limit,
        offset,
        // Medusa can only order by its own columns; price sorting would need the calculated price,
        // which is computed per region after the query. Newest-first is honest and indexed.
        order: "-created_at",
      } as Record<string, unknown>,
      { next: { revalidate: 60, tags: ["products", "marketplace"] } } as Record<string, unknown>
    )

    const mapped: MarketplaceProduct[] = (products ?? []).map((product) => {
      const preview = transformProductPreview(product, region)
      const metadata = (product.metadata ?? {}) as Record<string, unknown>
      return {
        ...preview,
        bakerName: typeof metadata.baker_name === "string" ? metadata.baker_name : undefined,
        bakerSlug: typeof metadata.baker_slug === "string" ? metadata.baker_slug : undefined,
      }
    })

    return {
      products: mapped,
      count: count ?? mapped.length,
      page,
      limit,
      hasMore: offset + mapped.length < (count ?? 0),
    }
  } catch (error) {
    console.error("[marketplace] Failed to list products", error)
    return { ...EMPTY, page, limit }
  }
})
