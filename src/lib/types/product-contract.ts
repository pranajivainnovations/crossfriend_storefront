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
