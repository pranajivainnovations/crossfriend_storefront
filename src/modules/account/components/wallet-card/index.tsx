import LocalizedClientLink from "@modules/common/components/localized-client-link"

import {
  daysUntil,
  describeEntry,
  rupees,
  type Wallet,
} from "@lib/data/wallet"

/**
 * Celebration credit, as the customer sees it.
 *
 * ── Why an empty wallet still shows something ──────────────────────────────────────────────────
 * The offer is ₹200 unlocked on a first order, and nothing is issued until that order exists. So a
 * customer who has just joined has a balance of zero and is owed an explanation of what the ₹200
 * they were told about actually is — otherwise the number they remember and the number on screen
 * disagree, and the one on screen looks like a broken promise rather than a locked one.
 *
 * ── Why expiry is prominent rather than a footnote ─────────────────────────────────────────────
 * Credit that vanishes without warning reads as money taken back. Saying "₹100 expires in 12 days"
 * while it can still be spent is the difference between an offer with a deadline and a trick — and
 * it is also the thing most likely to bring somebody back, which is the entire purpose of the
 * second grant.
 */
export default function WalletCard({ wallet }: { wallet: Wallet | null }) {
  /* Null means signed out, or the backend did not answer. Either way, showing "₹0" would be a
     claim this component cannot stand behind, so it shows nothing. */
  if (!wallet) return null

  const hasCredit = wallet.balancePaise > 0
  const hasHistory = wallet.entries.length > 0
  const soonest = wallet.expiring[0]

  return (
    <div
      className="rounded-xl border border-ui-border-base bg-ui-bg-subtle p-6"
      data-testid="wallet-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-small-regular text-ui-fg-subtle">Celebration credit</p>
          <p
            className="text-3xl-semi mt-1 text-ui-fg-base"
            data-testid="wallet-balance"
            data-value={wallet.balancePaise}
          >
            {rupees(wallet.balancePaise)}
          </p>
        </div>

        {hasCredit && (
          <LocalizedClientLink
            href="/store"
            className="rounded-lg bg-ui-bg-interactive px-4 py-2 text-small-semi text-ui-fg-on-color"
          >
            Spend it
          </LocalizedClientLink>
        )}
      </div>

      {!hasCredit && !hasHistory && (
        /* The hook. Anchoring on ₹200 while the balance is genuinely zero — which is the honest
           state, and the reason nothing is issued until an order exists. */
        <div className="mt-4 rounded-lg bg-ui-bg-base p-4">
          <p className="text-base-semi text-ui-fg-base">₹200 is waiting for you</p>
          <p className="text-small-regular mt-1 text-ui-fg-subtle">
            ₹100 unlocks on your first order, and another ₹100 on your second. Nothing to claim and
            no code to remember — it arrives by itself.
          </p>
        </div>
      )}

      {!hasCredit && hasHistory && (
        <p className="text-small-regular mt-3 text-ui-fg-subtle">
          You have used all of your credit. More arrives with your next celebration.
        </p>
      )}

      {soonest && (
        <p className="text-small-regular mt-3 text-ui-fg-base">
          <span className="font-semibold">{rupees(soonest.amountPaise)}</span>{" "}
          {expiryPhrase(soonest.expiresAt)}
        </p>
      )}

      {hasHistory && (
        <div className="mt-5 border-t border-ui-border-base pt-4">
          <p className="text-small-regular mb-2 text-ui-fg-subtle">Recent activity</p>
          <ul className="flex flex-col gap-2" data-testid="wallet-entries">
            {wallet.entries.slice(0, 6).map((entry) => (
              <li key={entry.id} className="flex items-baseline justify-between gap-4">
                <span className="text-small-regular text-ui-fg-base">
                  {describeEntry(entry)}
                  <span className="ml-2 text-ui-fg-muted">
                    {new Date(entry.at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </span>
                <span
                  className={`text-small-semi tabular-nums ${
                    entry.amountPaise > 0 ? "text-ui-fg-base" : "text-ui-fg-subtle"
                  }`}
                >
                  {entry.amountPaise > 0 ? "+" : ""}
                  {rupees(entry.amountPaise)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * How soon credit goes, in words somebody reads rather than parses.
 *
 * "Expires today" is its own case because "expires in 0 days" is the kind of phrasing that makes a
 * customer check whether the site is broken instead of placing an order.
 */
function expiryPhrase(iso: string): string {
  const days = daysUntil(iso)
  if (days === 0) return "expires today"
  if (days === 1) return "expires tomorrow"
  if (days <= 14) return `expires in ${days} days`
  return `expires on ${new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
  })}`
}
