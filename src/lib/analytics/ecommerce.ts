/**
 * Medusa objects → GA4 ecommerce items.
 *
 * Kept apart from the transport in index.ts because this is the part that gets a fact wrong quietly:
 * a mis-scaled price does not error, it just reports revenue a hundred times too high and nobody
 * notices until a monthly figure looks implausible.
 */

import type { LineItem, Order, Region } from "@medusajs/medusa"

import { noDivisionCurrencies } from "@lib/constants"
import type { AnalyticsItem } from "./index"

/**
 * Medusa stores money in minor units — 45000 is ₹450.00 — and GA4 expects major units. The divisor
 * rule is imported rather than restated: zero-decimal currencies (JPY and friends) are already
 * enumerated in @lib/constants and used by the price formatter, and a second copy of that list here
 * would be a silent drift waiting to happen the first time one is added.
 */
export function toMajorUnits(amount: number | null | undefined, currencyCode?: string): number {
  if (typeof amount !== "number" || Number.isNaN(amount)) return 0
  const divisor = noDivisionCurrencies.includes((currencyCode ?? "").toLowerCase()) ? 1 : 100
  // Rounded to the minor unit rather than left as a float: /3 splits produce values like 149.99999
  // that GA4 stores verbatim and then sums into revenue totals that never quite reconcile.
  return Math.round(amount) / divisor
}

interface ProductLike {
  id?: string | null
  title?: string | null
  handle?: string | null
  collection?: { title?: string | null } | null
  type?: { value?: string | null } | null
  variants?: { id?: string; title?: string | null }[] | null
}

/** One product, for view_item and select_item. */
export function productToItem(
  product: ProductLike,
  options: { price?: number; currencyCode?: string; listName?: string; index?: number } = {}
): AnalyticsItem {
  return {
    // The handle, not the internal id: it is what appears in URLs and in Search Console, so reports
    // can be read against the pages they describe without a lookup table.
    item_id: product.handle || product.id || "unknown",
    item_name: product.title || "Untitled",
    ...(product.collection?.title ? { item_category: product.collection.title } : {}),
    ...(product.type?.value ? { item_variant: product.type.value } : {}),
    ...(options.listName ? { item_list_name: options.listName } : {}),
    ...(typeof options.index === "number" ? { index: options.index } : {}),
    ...(typeof options.price === "number"
      ? { price: toMajorUnits(options.price, options.currencyCode) }
      : {}),
    quantity: 1,
  }
}

/** One cart or order line, for cart, checkout and purchase events. */
export function lineItemToItem(item: LineItem, currencyCode?: string): AnalyticsItem {
  return {
    item_id: (item.variant?.product?.handle as string | undefined) || item.variant_id || item.id,
    item_name: item.title || "Untitled",
    ...(item.variant?.title ? { item_variant: item.variant.title } : {}),
    // unit_price is the price actually charged for this line, discounts included — reporting the
    // list price here would overstate revenue on every promotion.
    price: toMajorUnits(item.unit_price, currencyCode),
    quantity: item.quantity ?? 1,
  }
}

export function lineItemsToItems(
  items: LineItem[] | null | undefined,
  currencyCode?: string
): AnalyticsItem[] {
  return (items ?? []).map((item) => lineItemToItem(item, currencyCode))
}

interface CartLike {
  items?: LineItem[] | null
  region?: Region | null
  total?: number | null
  subtotal?: number | null
}

/** A whole cart, for begin_checkout and the shipping/payment steps. */
export function cartToPayload(cart: CartLike): {
  currency: string
  value: number
  items: AnalyticsItem[]
} {
  const currency = (cart.region?.currency_code ?? "inr").toUpperCase()
  return {
    currency,
    value: toMajorUnits(cart.total ?? cart.subtotal ?? 0, currency),
    items: lineItemsToItems(cart.items, currency),
  }
}

/**
 * A completed order, for the purchase event.
 *
 * `transaction_id` is the order's display id where it has one. GA4 deduplicates purchases on this
 * field, which is what stops a customer refreshing the confirmation page from being counted as a
 * second sale — the client-side guard is a first line of defence, this is the one that holds.
 */
export function orderToPurchase(order: Order): {
  transaction_id: string
  currency: string
  value: number
  tax: number
  shipping: number
  items: AnalyticsItem[]
} {
  const currency = (order.region?.currency_code ?? order.currency_code ?? "inr").toUpperCase()
  return {
    transaction_id: String(order.display_id ?? order.id),
    currency,
    value: toMajorUnits(order.total, currency),
    tax: toMajorUnits(order.tax_total, currency),
    shipping: toMajorUnits(order.shipping_total, currency),
    items: lineItemsToItems(order.items, currency),
  }
}
