import { Metadata } from "next"
import Link from "next/link"

import OrderCheckout from "@modules/checkout/order-checkout"
import { getOrderCart } from "@lib/data/orders-cart"
import { getCustomer } from "@lib/data"
import { realEmail } from "@lib/util/real-email"

export const metadata: Metadata = {
  title: "Checkout",
}

/**
 * Checkout, on our own pipeline.
 *
 * ── What this page no longer does ──────────────────────────────────────────────────────────────
 * Read a Medusa cart, enrich its line items against the product service, wrap the whole thing in a
 * payment provider context, and render a four-step form whose steps existed because Medusa's cart
 * needed a shipping method and a selected payment session before it could be completed.
 *
 * One cart read, one customer read, one screen.
 */
export default async function Checkout() {
  const [cart, customer] = await Promise.all([getOrderCart(), getCustomer()])

  if (!cart || cart.items.length === 0) {
    return (
      <div className="content-container flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Your cart is empty</h1>
        <p className="text-sm text-slate-600">
          Design a cake in the Studio and it will appear here.
        </p>
        <Link
          href="/ai-cake-studio"
          className="rounded-xl bg-gradient-to-r from-cf-purple-700 via-cf-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Design a cake
        </Link>
      </div>
    )
  }

  const shipping = customer?.shipping_addresses?.[0]

  return (
    <OrderCheckout
      cart={cart}
      signedIn={!!customer}
      prefill={{
        first_name: shipping?.first_name ?? customer?.first_name ?? "",
        last_name: shipping?.last_name ?? customer?.last_name ?? "",
        address_1: shipping?.address_1 ?? "",
        address_2: shipping?.address_2 ?? "",
        city: shipping?.city ?? "",
        province: shipping?.province ?? "",
        postal_code: shipping?.postal_code ?? "",
        phone: shipping?.phone ?? customer?.phone ?? "",
        /**
         * realEmail, not customer.email. Customers who signed in by OTP carry a synthetic address
         * that cannot receive mail, and prefilling it would quietly make it the address an order
         * confirmation is sent to. Left blank, the field simply reads as optional — which it is,
         * because the order updates go by SMS.
         */
        email: realEmail(customer?.email) ?? "",
      }}
    />
  )
}
