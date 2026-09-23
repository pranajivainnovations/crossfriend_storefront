import { Metadata } from "next"

import OrderCartTemplate from "@modules/cart/order-cart"
import { getOrderCart } from "@lib/data/orders-cart"
import { getCustomer } from "@lib/data"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

/**
 * The cart page, on our own pipeline.
 *
 * ── What went away ────────────────────────────────────────────────────────────────────────────
 * Reading a Medusa cart, then enriching its line items against the product service to recover
 * titles and thumbnails the cart did not carry, then deriving a checkout step from how much of the
 * Medusa flow had been completed. All three existed because the cart was a catalogue construct and
 * the line items were pointers into it.
 *
 * Our cart arrives whole — titles, specs, totals and any credit already applied — in one response.
 * There is nothing to enrich and no step to infer.
 *
 * The customer lookup is still independent of the cart, so the two round trips still overlap.
 */
export default async function Cart() {
  const [cart, customer] = await Promise.all([getOrderCart(), getCustomer()])

  return <OrderCartTemplate cart={cart} signedIn={!!customer} />
}
