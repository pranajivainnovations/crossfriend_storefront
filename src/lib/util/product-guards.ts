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

/** Get the occasion collection handles this product belongs to. */
export function getOccasions(product: PricedProduct): OccasionCollection[] {
  if (!product.collection) return []

  const handle = product.collection.handle?.toLowerCase()
  if (handle && (OCCASION_COLLECTIONS as readonly string[]).includes(handle)) {
    return [handle as OccasionCollection]
  }
  return []
}

/** Check if a product belongs to a specific occasion collection. */
export function isForOccasion(
  product: PricedProduct,
  occasion: OccasionCollection
): boolean {
  return getOccasions(product).includes(occasion)
}
