import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPlacedOrder } from "@lib/data/orders-cart"
import OrderConfirmed from "@modules/order/order-confirmed"

export const metadata: Metadata = {
  title: "Order confirmed",
  description: "Your order is placed",
}

/**
 * The confirmation screen.
 *
 * ── Why there is no enrichment step ────────────────────────────────────────────────────────────
 * The order carries its own items, with the titles and specs frozen onto them at placement. The
 * version this replaces read a Medusa order and then looked its line items up against the product
 * service to recover what they were — necessary there because the items pointed at catalogue rows,
 * and because for a custom cake those rows were draft products invented for the purpose.
 *
 * Freezing is not only faster. A product edited or deleted afterwards cannot change what somebody
 * was told they bought.
 *
 * ── Not found covers not yours ─────────────────────────────────────────────────────────────────
 * The backend scopes the read to the signed-in customer, so somebody else's order simply is not
 * found. A 403 would confirm the id exists.
 */
export default async function OrderConfirmedPage({ params }: { params: { id: string } }) {
  const order = await getPlacedOrder(params.id)

  if (!order) return notFound()

  return <OrderConfirmed order={order} />
}
