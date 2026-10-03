import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPlacedOrder } from "@lib/data/orders-cart"
import OrderConfirmed from "@modules/order/order-confirmed"

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const order = await getPlacedOrder(params.id)
  if (!order) notFound()

  return {
    title: `Order #${order.displayId}`,
    description: "Your order",
  }
}

/**
 * One order, opened from the account.
 *
 * ── Why this renders the confirmation screen ───────────────────────────────────────────────────
 * Because it is the same question. "Did that work?" straight after paying and "where is my order?"
 * a week later both want the items, the totals, the address and how far along it is — and keeping
 * one component means the timeline a customer saw at checkout is the timeline they come back to,
 * rather than two views that can disagree about an order's state.
 *
 * `celebrate` is off: the heading becomes the order number instead of congratulating somebody on a
 * purchase they made last Tuesday.
 *
 * Not found covers not yours — the backend scopes the read to the signed-in customer, so another
 * person's order simply is not found. A 403 would confirm the id exists.
 */
export default async function OrderDetailPage({ params }: Props) {
  const order = await getPlacedOrder(params.id)
  if (!order) notFound()

  return <OrderConfirmed order={order} celebrate={false} />
}
