/**
 * CrossFriend — Dynamic Data Layer
 *
 * This module fetches all "configuration" data dynamically from Medusa:
 * - Product types (cake, decor, gift, costume, wellness, toys, etc.)
 * - Occasion collections (birthday, anniversary, festival, etc.)
 * - Categories (parent & child)
 *
 * Nothing is hardcoded. Add/remove in Medusa admin and it appears/disappears
 * from the storefront automatically.
 *
 * Convention:
 * - Occasions = collections with metadata.is_occasion = true
 * - Product types = Medusa product_types
 * - Categories = Medusa product_categories
 */

import { cache } from "react"
import { ProductCollection } from "@medusajs/medusa"
import { medusaClient } from "@lib/config"
import { getCollectionsList, listCategories, getCategoriesList } from "@lib/data"
import { loadConfiguredOccasions, loadConfiguredTypes } from "@lib/config/occasion-map.server"

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
// Dynamic Occasions — JSON config is source of truth
// ============================================

/**
 * Returns occasions in the order defined by `_occasions` in type-occasion-map.json.
 * Medusa collections are fetched to enrich with title/emoji/tagline metadata.
 * If a slug has no matching Medusa collection, sensible defaults are used.
 *
 * No metadata required in Medusa Admin — just create the collection with the
 * correct handle (e.g. "birthday") and it will be picked up automatically.
 */
export const getOccasions = cache(async function (): Promise<DynamicOccasion[]> {
  try {
    const configuredSlugs = loadConfiguredOccasions()

    const { collections } = await getCollectionsList(0, 100)
    const collectionByHandle = new Map(
      (collections ?? []).map((col) => [col.handle.toLowerCase(), col])
    )

    return configuredSlugs.map((slug, index) => {
      const col = collectionByHandle.get(slug.toLowerCase())
      return {
        id: col?.id ?? slug,
        slug,
        label: col?.title ?? capitalizeFirst(slug),
        tagline:
          (col?.metadata?.tagline as string) ??
          `Shop for your ${(col?.title ?? slug).toLowerCase()} celebration`,
        emoji: (col?.metadata?.emoji as string) ?? getDefaultEmoji(slug),
        gradient: (col?.metadata?.gradient as string) ?? getDefaultGradient(index),
        priority: Number(col?.metadata?.priority) || index,
      }
    })
  } catch (error) {
    console.error("[CrossFriend] Failed to fetch occasions:", error)
    return []
  }
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
// Dynamic Product Types — JSON config is source of truth
// ============================================

/**
 * Returns product types in the order defined by `_types` in type-occasion-map.json.
 * Medusa product_types are fetched to enrich with emoji/label metadata.
 * If a value has no matching Medusa product type, sensible defaults are used.
 *
 * No metadata required in Medusa Admin — just create a product type whose
 * value matches a key in type-occasion-map.json (e.g. "cake").
 */
export const getProductTypes = cache(async function (): Promise<DynamicProductType[]> {
  try {
    const configuredValues = loadConfiguredTypes()

    const { product_types } = await medusaClient.productTypes.list(
      { limit: 100 },
      { next: { tags: ["product-types"] } }
    )

    const typeByValue = new Map(
      (product_types ?? []).map((pt: any) => [pt.value.toLowerCase(), pt])
    )

    return configuredValues.map((value, index) => {
      const pt = typeByValue.get(value.toLowerCase())
      return {
        id: pt?.id ?? value,
        value: value.toLowerCase(),
        label: (pt?.metadata?.label as string) ?? capitalizeFirst(value),
        emoji: (pt?.metadata?.emoji as string) ?? getDefaultEmoji(value),
        href: `/store?type=${value.toLowerCase()}`,
        priority: Number(pt?.metadata?.priority) || index,
      }
    })
  } catch (error) {
    console.error("[CrossFriend] Failed to fetch product types:", error)
    return []
  }
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

// ============================================
// Utilities
// ============================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
