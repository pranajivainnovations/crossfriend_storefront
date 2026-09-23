"use client"

import Link from "next/link"
import { rupees } from "@lib/money"
import type { OrderCart } from "@lib/data/orders-cart"
import CreditPanel from "./credit-panel"

/**
 * What this order comes to.
 *
 * ── Why delivery is shown at all when it is free ───────────────────────────────────────────────
 * Because "free delivery" is worth saying, and because a total that silently equals the subtotal
 * leaves the customer wondering what will be added at the next step. A line that says ₹0 answers
 * the question before it is asked.
 *
 * ── Why credit lives in its own panel ──────────────────────────────────────────────────────────
 * Applying it writes a redemption to the ledger — a real movement of money, not a display
 * preference — and it takes three numbers to explain: the balance, what this order can take, and
 * why those differ. That does not fit in a totals list, and the checkout page needs exactly the
 * same block, so it is a component rather than a button here and a copy of the button there.
 */
export default function CartSummary({
  cart,
  canUseCredit,
}: {
  cart: OrderCart
  canUseCredit: boolean
}) {
  const applied = cart.creditAppliedPaise > 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Order summary</h2>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-600">Subtotal</dt>
          <dd className="tabular-nums text-slate-900">{rupees(cart.subtotalPaise)}</dd>
        </div>

        <div className="flex justify-between">
          <dt className="text-slate-600">Delivery</dt>
          <dd className="font-medium text-emerald-700">Free</dd>
        </div>

        {applied && (
          <div className="flex justify-between">
            <dt className="text-cf-purple-700">Celebration credit</dt>
            <dd className="tabular-nums text-cf-purple-700">
              −{rupees(cart.creditAppliedPaise)}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4">
        <span className="text-sm font-semibold text-slate-900">Total</span>
        <span className="text-lg font-bold tabular-nums text-slate-900">
          {rupees(cart.payablePaise)}
        </span>
      </div>

      {canUseCredit && <CreditPanel cart={cart} />}

      <Link
        href="/checkout"
        className="mt-3 block rounded-xl bg-gradient-to-r from-cf-purple-700 via-cf-purple-600 to-fuchsia-600 py-3 text-center text-sm font-semibold text-white"
        data-testid="checkout-button"
      >
        Checkout
      </Link>

      {/* Said here rather than at the payment step, where it would read as a late surprise. */}
      <p className="mt-3 text-center text-[11px] leading-snug text-slate-500">
        We&rsquo;ll ask you to verify your mobile number when you place the order.
      </p>
    </div>
  )
}
