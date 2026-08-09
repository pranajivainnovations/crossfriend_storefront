/**
 * CrossFriend — Dynamic Data Layer
 *
 * Product types and occasions come from the CrossFriend taxonomy (OPS → Taxonomy), which is a
 * table with foreign keys rather than the JSON file + hardcoded map + frozen whitelist this used
 * to read. Categories still come from Medusa directly.
 *
 * Nothing is hardcoded. Adding a type or occasion in OPS makes it appear here within the cache
 * window, with no deploy — which was the point: the previous PRODUCT_TYPES whitelist lived in a
 * TypeScript array, so adding "Bouquets" required a code change, and the JSON silently discarded
 * any key that array did not already contain.
 *
 * Convention:
 * - Occasions     = crossfriend.occasions   (backed by a Medusa collection)
 * - Product types = crossfriend.product_types (backed by a Medusa product_type)
 * - Categories    = Medusa product_categories, filtered by metadata.brand
 */

import { cache } from "react"
import { ProductCollection } from "@medusajs/medusa"
import { getCollectionsList, listCategories } from "@lib/data"
import { getTaxonomy } from "@lib/data/taxonomy"

// ============================================
// Types
// ============================================

export interface DynamicOccasion {
  id: string
  slug: string
  label: string
  tagline: string
  emoji: string
  gradient: string
  /** Optional: ordering priority (lower = first). Defaults to 0. */
  priority: number
}

export interface DynamicProductType {
  id: string
  value: string
  label: string
  emoji: string
  href: string
  /** Optional: ordering priority (lower = first). Defaults to 0. */
  priority: number
}

export interface DynamicCategory {
  id: string
  handle: string
  name: string
  description: string | null
  parent_category_id: string | null
  category_children?: DynamicCategory[]
}

// ============================================
// Default emoji fallbacks (used when metadata doesn't have one)
// ============================================

const DEFAULT_EMOJIS: Record<string, string> = {
  cake: "🎂",
  cakes: "🎂",
  decor: "🎊",
  decoration: "🎊",
  decorations: "🎊",
  gift: "🎁",
  gifts: "🎁",
  costume: "🎭",
  costumes: "🎭",
  wellness: "🌿",
  premium: "✨",
  toys: "🧸",
  toy: "🧸",
  games: "🎮",
  balloons: "🎈",
  balloon: "🎈",
  flowers: "💐",
  flower: "💐",
  candles: "🕯️",
  candle: "🕯️",
  birthday: "🎂",
  anniversary: "💝",
  festival: "🪔",
  kids: "🎈",
  special: "✨",
  wedding: "💒",
  baby: "👶",
  graduation: "🎓",
  housewarming: "🏠",
  valentines: "❤️",
  christmas: "🎄",
  diwali: "🪔",
  holi: "🎨",
  newyear: "🎆",
  "new-year": "🎆",
}

const DEFAULT_GRADIENTS: string[] = [
  "from-cf-orange to-cf-coral",
  "from-cf-pink to-cf-purple",
  "from-cf-yellow to-cf-orange",
  "from-cf-purple to-cf-pink",
  "from-cf-coral to-cf-purple",
  "from-cf-orange to-cf-yellow",
]

function getDefaultEmoji(handle: string): string {
  const lower = handle.toLowerCase()
  for (const [key, emoji] of Object.entries(DEFAULT_EMOJIS)) {
    if (lower.includes(key)) return emoji
  }
  return "🎉"
}

function getDefaultGradient(index: number): string {
  return DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length]
}

// ============================================
// Occasions — the CrossFriend taxonomy is source of truth
// ============================================

/**
 * Active occasions, in the order set in OPS → Taxonomy.
 *
 * Only occasions registered AND active in crossfriend.occasions are returned — a Medusa collection
 * alone is not enough, which is what keeps Pranajiva's collections and CrossFriend's merchandising
 * collections (Love, Corporate Gifting) out of occasion navigation.
 */
export const getOccasions = cache(async function (): Promise<DynamicOccasion[]> {
  const { occasions } = await getTaxonomy()

  return occasions.map((o, index) => ({
    id: o.id,
    slug: o.handle,
    label: o.label,
    tagline: o.tagline ?? `Shop for your ${o.label.toLowerCase()} celebration`,
    emoji: o.emoji ?? getDefaultEmoji(o.handle),
    // Gradient is presentation the taxonomy may not carry for a newly added occasion; cycling the
    // house palette is better than a missing background.
    gradient: o.gradient ?? getDefaultGradient(index),
    priority: o.order,
  }))
})

/**
 * Get a single occasion by its slug (collection handle).
 */
export const getOccasionBySlug = cache(async function (
  slug: string
): Promise<DynamicOccasion | null> {
  const occasions = await getOccasions()
  return occasions.find((o) => o.slug === slug) ?? null
})

// ============================================
// Product Types — the CrossFriend taxonomy is source of truth
// ============================================

/**
 * Active product types, in the order set in OPS → Taxonomy.
 *
 * `href` points at /store?type=<value>, which filters the catalogue by that type. Every value here
 * is guaranteed to exist as a real Medusa product_type, because the registry holds a foreign key to
 * it — the previous config could name a type Medusa did not have, and five of six did.
 */
export const getProductTypes = cache(async function (): Promise<DynamicProductType[]> {
  const { types } = await getTaxonomy()

  return types.map((t) => ({
    id: t.id,
    value: t.value,
    label: t.label,
    emoji: t.emoji ?? getDefaultEmoji(t.value),
    href: `/store?type=${t.value}`,
    priority: t.order,
  }))
})

// ============================================
// Dynamic Categories
// ============================================

/**
 * Fetches all parent (top-level) categories.
 */
export const getParentCategories = cache(async function (): Promise<DynamicCategory[]> {
  try {
    const categories = await listCategories()
    if (!categories) return []

    return categories
      .filter((cat) => !cat.parent_category_id)
      .map((cat) => ({
        id: cat.id,
        handle: cat.handle,
        name: cat.name,
        description: cat.description ?? null,
        parent_category_id: null,
        category_children: cat.category_children?.map((child: any) => ({
          id: child.id,
          handle: child.handle,
          name: child.name,
          description: child.description ?? null,
          parent_category_id: child.parent_category_id,
        })) ?? [],
      }))
  } catch (error) {
    console.error("[CrossFriend] Failed to fetch categories:", error)
    return []
  }
})

/**
 * Fetches all collections (non-occasion).
 * These are regular product groupings (e.g. "Summer Sale", "Premium Picks")
 */
export const getRegularCollections = cache(async function (): Promise<ProductCollection[]> {
  try {
    const { collections } = await getCollectionsList(0, 100)
    if (!collections) return []

    // Exclude occasion collections
    return collections.filter(
      (col) => col.metadata?.is_occasion !== true && col.metadata?.is_occasion !== "true"
    )
  } catch (error) {
    console.error("[CrossFriend] Failed to fetch collections:", error)
    return []
  }
})

// `capitalizeFirst` lived here to invent a label when the config named a type Medusa did not have.
// The taxonomy always carries a real label, so there is nothing left to guess.
