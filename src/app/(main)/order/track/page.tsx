import { Metadata } from "next"
import Link from "next/link"

import { getCustomer } from "@lib/data"
import { listMyOrders } from "@lib/data/orders-cart"
import { getSiteSettings, whatsappUrl } from "@lib/data/site-settings"
import MyOrders from "@modules/account/components/my-orders"

export const metadata: Metadata = {
  alternates: { canonical: "/order/track" },
  title: "Track your order",
  description: "See where your CrossFriend order has got to.",
}

/**
 * Where is my order.
 *
 * ── What was here before ───────────────────────────────────────────────────────────────────────
 * A mock. A hardcoded order id, a fixed "Today, 4:00 PM - 6:00 PM" delivery window, and a search
 * box wired to nothing — its own comment said "in production, this would fetch from API". Anybody
 * who typed their real order number watched the same invented order come back, which is worse than
 * a page that admits it cannot help.
 *
 * ── Why there is no search box now ─────────────────────────────────────────────────────────────
 * An order number alone must not open an order: they are sequential, so a box that accepts one is a
 * box that reads other people's addresses and phone numbers by counting. The backend scopes every
 * order read to the signed-in customer for that reason, and the honest front door is therefore the
 * customer's own list rather than a field. Signing in is the one step, and it is the OTP they
 * already used to order.
 */
export default async function OrderTrackPage() {
  const [customer, settings] = await Promise.all([
    getCustomer().catch(() => null),
    getSiteSettings(),
  ])

  const orders = customer ? await listMyOrders() : []
  const live = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled")

  return (
    <div className="content-container mx-auto max-w-2xl py-12">
      <h1 className="cf-heading mb-2 text-center text-2xl small:text-3xl">
        Track your <span className="gradient-cf-text">order</span>
      </h1>

      {!customer ? (
        <>
          <p className="mb-8 text-center text-sm text-ui-fg-muted">
            Sign in with the mobile number you ordered with and your orders will be here.
          </p>
          <div className="text-center">
            <Link
              href="/account"
              className="inline-block rounded-xl bg-gradient-to-r from-cf-purple-700 via-cf-purple-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mb-8 text-center text-sm text-ui-fg-muted">
            {live.length > 0
              ? "Tap an order to see every step and where it has got to."
              : "Nothing on the way right now."}
          </p>
          <MyOrders orders={live.length > 0 ? live : orders} />
        </>
      )}

      <div className="mt-8 rounded-xl bg-cf-warm p-4 text-center">
        <p className="text-sm text-grey-60">
          Something not right?{" "}
          <a
            href={whatsappUrl(settings.whatsappNumber, "Hi! I have a question about my CrossFriend order.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-cf-orange hover:underline"
          >
            Chat with us on WhatsApp
          </a>
        </p>
      </div>
    </div>
  )
}
