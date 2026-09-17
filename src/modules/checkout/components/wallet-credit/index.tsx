"use client"

import { useState, useTransition } from "react"

import { rupees } from "@lib/money"
import type { CartCredit } from "@lib/data/cart-credit"
import { applyWalletCredit, removeWalletCredit } from "./actions"

/**
 * Celebration credit, on the order being placed.
 *
 * ── Why this renders nothing when there is nothing to say ──────────────────────────────────────
 * A customer with no credit does not need to be told they have none at checkout, of all moments. The
 * box appears when there is something to apply, or something already applied to take off.
 *
 * ── Why the amount is not editable ─────────────────────────────────────────────────────────────
 * Choosing to spend less than you could is a real thing to want, and it is deliberately not offered
 * here. Every rupee of partial-spend UI is another state to get right at the exact moment money moves,
 * and the customer's alternative — spend it all now, or none — covers what almost everybody wants. A
 * slider can come later, from somebody asking for one.
 *
 * ── Why "why not more" is stated ───────────────────────────────────────────────────────────────
 * A customer holding ₹200 who sees ₹104 applied will assume something is broken unless told. The
 * reason is always one of three, and each is a different sentence: the order is not big enough, the
 * limit we set, or that is all the credit they have.
 */
export default function WalletCredit({ credit }: { credit: CartCredit | null }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  /* Null means signed out or the backend did not answer — see getCartCredit for why that shows
     nothing rather than "₹0 available". */
  if (!credit) return null

  const applied = credit.appliedPaise > 0
  if (!applied && credit.applicablePaise <= 0) return null

  const run = (action: () => Promise<{ ok: boolean; message: string | null }>) =>
    startTransition(async () => {
      setError(null)
      const result = await action()
      if (!result.ok) setError(result.message ?? "Please try again.")
    })

  /**
   * Why the whole balance is not being used.
   *
   * Only said when it is actually true — when the credit is fully applied there is nothing to
   * explain, and a reason offered anyway reads as an apology for something that went right.
   */
  const shortfall = () => {
    if (credit.balancePaise <= credit.applicablePaise) return null
    switch (credit.limitedBy) {
      case "order":
        /* The platform ceiling: credit pays for the cakes, not the delivery. Said as what it can do
           rather than what it cannot. */
        return `Credit covers the items — ${rupees(credit.redeemablePaise)} on this order. The rest stays in your wallet.`
      case "cap":
        return `Up to ${rupees(credit.applicablePaise)} of this ${rupees(credit.payablePaise)} order can be paid with credit. The rest stays in your wallet.`
      default:
        return null
    }
  }

  return (
    <div className="rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4" data-testid="wallet-credit">
      {applied ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-small-regular text-ui-fg-subtle">Celebration credit applied</p>
              <p className="text-base-semi text-ui-fg-base" data-testid="wallet-credit-applied">
                − {rupees(credit.appliedPaise)}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(removeWalletCredit)}
              className="text-small-regular text-ui-fg-subtle underline disabled:opacity-50"
              data-testid="wallet-credit-remove"
            >
              {pending ? "Removing…" : "Remove"}
            </button>
          </div>
          {credit.balancePaise > 0 && (
            <p className="text-xsmall-regular mt-2 text-ui-fg-muted">
              {rupees(credit.balancePaise)} still in your wallet for next time.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-small-regular text-ui-fg-subtle">
                You have {rupees(credit.balancePaise)} in celebration credit
              </p>
              <p className="text-base-semi text-ui-fg-base">
                Use {rupees(credit.applicablePaise)} on this order
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(applyWalletCredit)}
              className="rounded-lg bg-ui-bg-interactive px-4 py-2 text-small-semi text-ui-fg-on-color disabled:opacity-50"
              data-testid="wallet-credit-apply"
            >
              {pending ? "Applying…" : "Use my credit"}
            </button>
          </div>
          {shortfall() && (
            <p className="text-xsmall-regular mt-2 text-ui-fg-muted">{shortfall()}</p>
          )}
        </>
      )}

      {error && (
        <p className="text-xsmall-regular mt-2 text-ui-fg-error" role="status">
          {error}
        </p>
      )}
    </div>
  )
}
