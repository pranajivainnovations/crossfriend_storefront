"use client"

import { useState, useTransition } from "react"

import { rupees } from "@lib/money"
import type { OrderCart } from "@lib/data/orders-cart"
import { applyCredit, removeCredit } from "../order-actions"

/**
 * Celebration credit, said out loud.
 *
 * ── What was wrong ─────────────────────────────────────────────────────────────────────────────
 * The button said "Use my celebration credit" and nothing else. A customer could not tell how much
 * they had, how much of it this order could take, or — after pressing it — why the total had moved
 * by less than they expected. Three numbers were missing and the page had none of them, because the
 * cart only carried how much was already applied.
 *
 * ── The shape of the answer ────────────────────────────────────────────────────────────────────
 * Balance, what is usable here, and the reason those differ. The amount goes ON the button, so the
 * effect is known before the press rather than discovered after it. When the whole balance is
 * usable there is no gap to explain and the extra line is not shown — an explanation nobody needs
 * reads as a warning.
 */
export default function CreditPanel({ cart }: { cart: OrderCart }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const credit = cart.credit
  const applied = cart.creditAppliedPaise > 0

  /* Nothing to offer and nothing applied: no panel at all. An empty wallet does not need a control
     explaining that it is empty. */
  if (!credit) return null
  if (!applied && credit.applicablePaise <= 0) return null

  const toggle = () =>
    start(async () => {
      setError(null)
      const { error } = applied ? await removeCredit() : await applyCredit()
      if (error) setError(error)
    })

  /**
   * Why only part of the balance can be used here.
   *
   * Only shown when it is actually true. `balance` means the whole balance fits, so there is no
   * shortfall to account for.
   */
  const limitNote =
    credit.limitedBy === "order"
      ? "That covers this order in full — the rest stays in your wallet."
      : credit.limitedBy === "cap"
      ? `Up to ${credit.capPercent}% of an order can be paid with credit. The rest of your balance ` +
        "stays for next time."
      : null

  return (
    <div className="mt-4 rounded-xl border border-cf-purple-200 bg-cf-purple-50/60 p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-base">
          🎁
        </span>
        <h3 className="text-sm font-semibold text-cf-purple-900">Celebration credit</h3>
      </div>

      {applied ? (
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-cf-purple-800">On this order</dt>
            <dd className="font-semibold tabular-nums text-cf-purple-900">
              −{rupees(cart.creditAppliedPaise)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">Left in your wallet</dt>
            <dd className="tabular-nums text-slate-700">{rupees(credit.balancePaise)}</dd>
          </div>
        </dl>
      ) : (
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">Your balance</dt>
            <dd className="tabular-nums text-slate-900">{rupees(credit.balancePaise)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-cf-purple-800">Usable on this order</dt>
            <dd className="font-semibold tabular-nums text-cf-purple-900">
              {rupees(credit.applicablePaise)}
            </dd>
          </div>
        </dl>
      )}

      {!applied && limitNote && (
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{limitNote}</p>
      )}

      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={
          applied
            ? "mt-3 w-full rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-600 disabled:opacity-50"
            : "mt-3 w-full rounded-lg bg-cf-purple-700 py-2 text-sm font-semibold text-white disabled:opacity-50"
        }
      >
        {pending
          ? applied
            ? "Removing…"
            : "Applying…"
          : applied
          ? "Remove credit"
          : /* The amount is on the button, so pressing it holds no surprise. */
            `Use ${rupees(credit.applicablePaise)} on this order`}
      </button>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
