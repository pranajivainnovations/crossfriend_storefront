/**
 * CrossFriend Product Data Contract
 *
 * Every Medusa product in the storefront MUST conform to this contract.
 * Components MUST use the guard utilities in `product-guards.ts` instead of
 * raw metadata access, and MUST handle missing/unexpected values gracefully.
 */

// --- Product Types ---

export const PRODUCT_TYPES = ["cake", "decor", "costume", "gift", "wellness", "toys"] as const
export type ProductType = (typeof PRODUCT_TYPES)[number]

// --- Occasion Collections ---

export const OCCASION_COLLECTIONS = [
  "birthday",
  "anniversary",
  "festival",
  "kids",
  "special",
] as const
export type OccasionCollection = (typeof OCCASION_COLLECTIONS)[number]

// --- Type → Occasion Map ---

/**
 * Defines which occasions each product type appears on by default.
 *
 * HOW TO USE:
 *   - Add a new product type → add a row here listing its occasions.
 *   - Add a new occasion     → add it to the relevant type rows here.
 *   - Individual products can override this via metadata.occasions (Step 2).
 *
 * This is the ONLY place you need to change when the taxonomy grows.
 */
export const TYPE_OCCASION_MAP: Record<ProductType, OccasionCollection[]> = {
  cake:        ["birthday", "anniversary", "kids", "special", "festival"],
  decor:       ["birthday", "anniversary", "kids", "special", "festival"],
  costume:     ["kids", "festival", "special"],
  gift:        ["birthday", "anniversary", "festival", "special"],
  wellness:    ["anniversary", "festival", "special"],
  toys:        ["kids", "special"],
}

/**
 * Reverse lookup — given an occasion, which product types appear on it?
 * Derived automatically from TYPE_OCCASION_MAP. Never edit this directly.
 */
export const OCCASION_TYPE_MAP: Record<OccasionCollection, ProductType[]> = (() => {
  const map = {} as Record<OccasionCollection, ProductType[]>
  for (const occasion of OCCASION_COLLECTIONS) {
    map[occasion] = (Object.entries(TYPE_OCCASION_MAP) as [ProductType, OccasionCollection[]][])
      .filter(([, occasions]) => occasions.includes(occasion))
      .map(([type]) => type)
  }
  return map
})()

// --- Product Metadata ---

/**
 * Shape of `product.metadata` as stored in Medusa.
 * All fields are optional — components MUST handle missing values.
 */
export interface ProductMetadata {
  /** Whether this product is an add-on (e.g. candles, balloon bunch) */
  is_addon?: boolean
  /** Brand identifier (e.g. "pranajiva") */
  brand?: string
  /** Whether this product can be included in quick-add celebration kits */
  kit_eligible?: boolean
  /**
   * Optional per-product occasion override.
   * Comma-separated occasion slugs. When set, REPLACES the type-level default.
   * Set in Medusa Admin → Product → Metadata → occasions
   *
   * Example:  "special,anniversary"
   * Effect:   This product only appears on special and anniversary pages,
   *           regardless of what TYPE_OCCASION_MAP says for its type.
   */
  occasions?: string
}

// --- Delivery Configuration ---

export const DELIVERY_CUTOFF_HOUR = 17 // 5 PM IST — configurable
export const DELIVERY_TIME_SLOTS = [
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
  "6:00 PM - 8:00 PM",
] as const
export type DeliveryTimeSlot = (typeof DELIVERY_TIME_SLOTS)[number]

// --- Cake Line Item Metadata ---

/**
 * Extra fields stored in `line_item.metadata` for cake orders.
 */
export interface CakeLineItemMetadata {
  message?: string
  delivery_date?: string // ISO date string
  delivery_time_slot?: DeliveryTimeSlot
}
