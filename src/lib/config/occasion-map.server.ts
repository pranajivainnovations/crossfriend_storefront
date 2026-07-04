/**
 * Occasion Map — Server-Only Loader
 *
 * Reads type-occasion-map.json at runtime from the filesystem.
 * Falls back to the hardcoded TYPE_OCCASION_MAP in product-contract.ts
 * if the file is missing or contains invalid data.
 *
 * IMPORTANT: This file uses Node.js `fs` — never import it in client components.
 */

import fs from "fs"
import path from "path"
import {
  TYPE_OCCASION_MAP,
  PRODUCT_TYPES,
  OCCASION_COLLECTIONS,
  type ProductType,
  type OccasionCollection,
} from "@lib/types/product-contract"

const CONFIG_PATH = path.join(
  process.cwd(),
  "src/lib/config/type-occasion-map.json"
)

/**
 * Reads and validates type-occasion-map.json.
 * Unknown types or occasion values are silently ignored.
 * Falls back to the hardcoded TYPE_OCCASION_MAP on any error.
 */
export function loadOccasionMap(): Record<ProductType, OccasionCollection[]> {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return TYPE_OCCASION_MAP
    }

    const raw = fs.readFileSync(CONFIG_PATH, "utf-8")
    const parsed = JSON.parse(raw)

    // Start from hardcoded defaults, then apply overrides from JSON
    const result: Record<ProductType, OccasionCollection[]> = { ...TYPE_OCCASION_MAP }

    for (const [type, occasions] of Object.entries(parsed)) {
      // Skip comment/meta keys and unknown types
      if (type.startsWith("_")) continue
      if (!(PRODUCT_TYPES as readonly string[]).includes(type)) continue
      if (!Array.isArray(occasions)) continue

      // Strip any invalid occasion values
      const valid = (occasions as string[]).filter(
        (o): o is OccasionCollection =>
          (OCCASION_COLLECTIONS as readonly string[]).includes(o)
      )

      result[type as ProductType] = valid
    }

    return result
  } catch (err) {
    console.error("[CrossFriend] Failed to load type-occasion-map.json, using defaults:", err)
    return TYPE_OCCASION_MAP
  }
}

/**
 * Given an occasion slug (e.g. "anniversary"), returns the product type
 * values that should appear on that occasion page.
 *
 * Usage (server component only):
 *   const types = getOccasionTypes("anniversary")
 *   // → ["cake", "decor", "gift", "wellness"]
 */
export function getOccasionTypes(occasionSlug: string): ProductType[] {
  const map = loadOccasionMap()
  return (Object.entries(map) as [ProductType, OccasionCollection[]][])
    .filter(([, occasions]) =>
      occasions.includes(occasionSlug as OccasionCollection)
    )
    .map(([type]) => type)
}

/**
 * Returns the ordered list of occasion slugs from the JSON config's `_occasions` array.
 * Falls back to OCCASION_COLLECTIONS if the key is missing.
 */
export function loadConfiguredOccasions(): string[] {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return Array.from(OCCASION_COLLECTIONS)
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8")
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed._occasions) && parsed._occasions.length > 0) {
      return parsed._occasions as string[]
    }
  } catch {
    // fall through
  }
  return Array.from(OCCASION_COLLECTIONS)
}

/**
 * Returns the ordered list of product type values from the JSON config's `_types` array,
 * falling back to the non-underscore keys, then to PRODUCT_TYPES.
 */
export function loadConfiguredTypes(): string[] {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return Array.from(PRODUCT_TYPES)
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8")
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed._types) && parsed._types.length > 0) {
      return parsed._types as string[]
    }
    // Fall back to non-underscore keys
    const keys = Object.keys(parsed).filter((k) => !k.startsWith("_"))
    if (keys.length > 0) return keys
  } catch {
    // fall through
  }
  return Array.from(PRODUCT_TYPES)
}
