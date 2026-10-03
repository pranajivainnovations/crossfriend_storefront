import { Metadata } from "next"

import { listMyOrders } from "@lib/data/orders-cart"
import MyOrders from "@modules/account/components/my-orders"

export const metadata: Metadata = {
  title: "Orders",
  description: "Your CrossFriend orders.",
}

/**
 * The customer's orders, from the pipeline that actually takes them.
 *
 * ── What changed ───────────────────────────────────────────────────────────────────────────────
 * This read Medusa orders through listCustomerOrders. Once checkout moved to orders.orders that
 * query stopped returning anything a customer had bought — so somebody could place an order, see a
 * confirmation, and find this page empty. It is not a 404 either, which is why it went unnoticed:
 * an empty list looks exactly like a new customer.
 *
 * ── Why there is no returns copy any more ──────────────────────────────────────────────────────
 * The old page offered returns and exchanges. There is no returns flow — Medusa's was never wired
 * up and the new pipeline has none — so the sentence promised something nobody could do. A cake is
 * also not a thing people return. Removed rather than reworded.
 */
export default async function Orders() {
  const orders = await listMyOrders()

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-2">
        <h1 className="text-2xl-semi">Orders</h1>
        <p className="text-base-regular text-ui-fg-subtle">
          Every order you have placed, and where it has got to.
        </p>
      </div>

      <MyOrders orders={orders} />
    </div>
  )
}
