/**
 * Product Guard Utilities
 *
 * Type-safe accessors for product type, metadata, and collection membership.
 * Every component MUST use these instead of raw `product.type.value` or
 * `product.metadata.xxx` access. Guards return safe defaults when data is
 * missing or unexpected.
 */

import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"
import {
  PRODUCT_TYPES,
  ProductType,
  ProductMetadata,
  OCCASION_COLLECTIONS,
  OccasionCollection,
  TYPE_OCCASION_MAP,
} from "@lib/types/product-contract"

// --- Type Guards ---

/** Get the product type, or `undefined` if missing / not in the known set. */
export function getProductType(product: PricedProduct): ProductType | undefined {
  const raw = product.type?.value?.toLowerCase()
  if (raw && (PRODUCT_TYPES as readonly string[]).includes(raw)) {
    return raw as ProductType
  }
  return undefined
}

export function isCake(product: PricedProduct): boolean {
  return getProductType(product) === "cake"
}

export function isDecor(product: PricedProduct): boolean {
  return getProductType(product) === "decor"
}

export function isCostume(product: PricedProduct): boolean {
  return getProductType(product) === "costume"
}

export function isGift(product: PricedProduct): boolean {
  return getProductType(product) === "gift"
}

export function isWellness(product: PricedProduct): boolean {
  return getProductType(product) === "wellness"
}

// --- Metadata Guards ---

/** Safely read product metadata with defaults. */
export function getMetadata(product: PricedProduct): ProductMetadata {
  const raw = product.metadata as Record<string, unknown> | null | undefined
  if (!raw) return {}

  return {
    is_addon: raw.is_addon === true || raw.is_addon === "true",
    brand: typeof raw.brand === "string" ? raw.brand : undefined,
    kit_eligible: raw.kit_eligible === true || raw.kit_eligible === "true",
    occasions: typeof raw.occasions === "string" ? raw.occasions : undefined,
  }
}

export function isAddon(product: PricedProduct): boolean {
  return getMetadata(product).is_addon === true
}

export function isPranaJiva(product: PricedProduct): boolean {
  return getMetadata(product).brand?.toLowerCase() === "pranajiva"
}

export function isKitEligible(product: PricedProduct): boolean {
  return getMetadata(product).kit_eligible === true
}

// --- Collection Guards ---

/** Get the occasion collection handle this product is assigned to in Medusa. */
export function getOccasions(product: PricedProduct): OccasionCollection[] {
  if (!product.collection) return []

  const handle = product.collection.handle?.toLowerCase()
  if (handle && (OCCASION_COLLECTIONS as readonly string[]).includes(handle)) {
    return [handle as OccasionCollection]
  }
  return []
}

/**
 * Resolve the full list of occasions this product should appear on.
 *
 * Priority order:
 *   1. metadata.occasions  — per-product override set in Medusa Admin
 *                            (comma-separated, e.g. "special,anniversary")
 *   2. TYPE_OCCASION_MAP   — default rule for the product's type
 *   3. collection handle   — fallback: just the assigned collection
 */
export function getProductOccasions(product: PricedProduct): OccasionCollection[] {
  // 1. Per-product metadata override
  const metaOccasions = getMetadata(product).occasions
  if (metaOccasions) {
    return metaOccasions
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s): s is OccasionCollection =>
        (OCCASION_COLLECTIONS as readonly string[]).includes(s)
      )
  }

  // 2. Type-level default from TYPE_OCCASION_MAP
  const type = getProductType(product)
  if (type && TYPE_OCCASION_MAP[type]) {
    return TYPE_OCCASION_MAP[type]
  }

  // 3. Fallback: just the assigned collection
  return getOccasions(product)
}

/** Check if a product should appear on a specific occasion page. */
export function isForOccasion(
  product: PricedProduct,
  occasion: OccasionCollection
): boolean {
  return getProductOccasions(product).includes(occasion)
}

// --- Tag Guards ---

/**
 * Get all tag values on a product as a lowercase string array.
 * Always use this instead of raw product.tags access.
 */
export function getTags(product: PricedProduct): string[] {
  if (!product.tags || product.tags.length === 0) return []
  return product.tags.map((t) => t.value.toLowerCase())
}

/**
 * Check if a product has a specific tag (case-insensitive).
 *
 * Usage:
 *   hasTag(product, "rakhi")
 *   hasTag(product, "dance")
 *   hasTag(product, "independence-day")
 */
export function hasTag(product: PricedProduct, tag: string): boolean {
  return getTags(product).includes(tag.toLowerCase())
}

/**
 * Check if a product has ANY of the given tags.
 *
 * Usage:
 *   hasAnyTag(product, ["rakhi", "diwali", "holi"])
 */
export function hasAnyTag(product: PricedProduct, tags: string[]): boolean {
  const productTags = getTags(product)
  return tags.some((t) => productTags.includes(t.toLowerCase()))
}

/**
 * Check if a product has ALL of the given tags.
 *
 * Usage:
 *   hasAllTags(product, ["dance", "kids"])
 */
export function hasAllTags(product: PricedProduct, tags: string[]): boolean {
  const productTags = getTags(product)
  return tags.every((t) => productTags.includes(t.toLowerCase()))
}
