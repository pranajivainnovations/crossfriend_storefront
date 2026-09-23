"use client"

import Link from "next/link"
import { useState, useTransition } from "react"

import { rupees } from "@lib/money"
import type { OrderCart } from "@lib/data/orders-cart"
import { applyCredit, removeCredit } from "../order-actions"

/**
 * What this order comes to.
 *
 * ── Why delivery is shown at all when it is free ───────────────────────────────────────────────
 * Because "free delivery" is worth saying, and because a total that silently equals the subtotal
 * leaves the customer wondering what will be added at the next step. A line that says ₹0 answers
 * the question before it is asked.
 *
 * ── Why credit is a button and not a checkbox ──────────────────────────────────────────────────
 * Applying it writes a redemption to the ledger, which is a real movement of money rather than a
 * display preference. It can be taken off again — that writes a reversal — but neither is the kind
 * of thing that should happen because a control drifted under somebody's thumb.
 */
export default function CartSummary({
  cart,
  canUseCredit,
}: {
  cart: OrderCart
  canUseCredit: boolean
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const applied = cart.creditAppliedPaise > 0

  const toggle = () =>
    start(async () => {
      setError(null)
      const { error } = applied ? await removeCredit() : await applyCredit()
      if (error) setError(error)
    })

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

      {canUseCredit && (
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={
            applied
              ? "mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 disabled:opacity-50"
              : "mt-4 w-full rounded-xl border border-cf-purple-200 bg-cf-purple-50 py-2.5 text-sm font-semibold text-cf-purple-800 disabled:opacity-50"
          }
        >
          {pending
            ? applied
              ? "Removing…"
              : "Applying…"
            : applied
            ? "Remove credit"
            : "Use my celebration credit"}
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

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
