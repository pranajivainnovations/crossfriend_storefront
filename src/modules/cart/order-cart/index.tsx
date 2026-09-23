import Link from "next/link"

import type { OrderCart } from "@lib/data/orders-cart"
import CartLine from "./line"
import CartSummary from "./summary"

/**
 * The cart, on our own pipeline.
 *
 * ── What this replaces ─────────────────────────────────────────────────────────────────────────
 * A Medusa cart whose line items pointed at draft products invented for the purpose — every custom
 * cake had a catalogue row behind it, created at the moment the customer committed to a price. The
 * items here point at the design itself, so there is nothing to enrich, no region to resolve and no
 * variant to look up.
 *
 * ── Why it does not ask anybody to sign in ─────────────────────────────────────────────────────
 * A visitor can fill a cart and read it without telling us who they are. The one thing signing in
 * buys before checkout is spending credit, so that is the only place it is mentioned — and it is an
 * offer rather than a wall.
 */
export default function OrderCartTemplate({
  cart,
  signedIn,
}: {
  cart: OrderCart | null
  signedIn: boolean
}) {
  if (!cart || cart.items.length === 0) {
    return (
      <div className="content-container py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="text-5xl">🎂</div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Your cart is empty</h1>
          <p className="mt-2 text-sm text-slate-600">
            Design a cake in the Studio and it will appear here.
          </p>
          <Link
            href="/ai-cake-studio"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-cf-purple-700 via-cf-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Design a cake
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="content-container py-10" data-testid="cart-container">
      <h1 className="text-xl font-bold text-slate-900">Your cart</h1>

      <div className="mt-6 grid grid-cols-1 gap-8 small:grid-cols-[1fr_360px]">
        <ul className="rounded-2xl border border-slate-200 bg-white px-5">
          {cart.items.map((item) => (
            <CartLine key={item.id} item={item} />
          ))}
        </ul>

        <div className="small:sticky small:top-12 small:self-start">
          <CartSummary cart={cart} canUseCredit={signedIn} />

          {!signedIn && (
            <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
              Signed in? Your celebration credit can come off this order.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
