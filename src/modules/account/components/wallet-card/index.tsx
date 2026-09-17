import LocalizedClientLink from "@modules/common/components/localized-client-link"

import { rupees, daysUntil } from "@lib/money"
import { describeEntry, type Wallet, type WalletEntry } from "@lib/data/wallet"

/**
 * Celebration credit, as the customer sees it.
 *
 * ── The shape, and where it comes from ─────────────────────────────────────────────────────────
 * A headline balance, then the balance broken into what it is made of, then what is about to
 * disappear, then the movements, then the rules. It follows the pattern every Indian retail wallet
 * has settled on, because a customer arriving here has almost certainly used one and should not have
 * to learn a second arrangement to answer the same three questions: how much, from what, and by when.
 *
 * ── Where it deliberately differs ──────────────────────────────────────────────────────────────
 * Those wallets hold money the customer paid in, so their credit does not expire and nothing on the
 * screen mentions a deadline. Ours is given, all of it, and most of it expires — so expiry is not a
 * footnote here. It sits directly under the balance, before the history, because credit that
 * vanishes without warning reads as money taken back, and that is a trust problem rather than a
 * support ticket.
 *
 * ── Why an empty wallet still shows something ──────────────────────────────────────────────────
 * The offer is ₹200 unlocked on a first order, and nothing is issued until that order exists. A
 * customer who has just joined has a balance of zero and is owed an explanation of what the ₹200
 * they were told about actually is — otherwise the number they remember and the number on screen
 * disagree, and the one on screen looks like a broken promise rather than a locked one.
 */

/**
 * What each kind of credit is called, and what it is for.
 *
 * Named by how it was earned rather than by what the ledger calls it — "promo_grant" means nothing
 * to the person who received it, and "Celebration credit" is the phrase the rest of the storefront
 * already uses.
 */
const SOURCE: Record<string, { label: string; note: string }> = {
  signup_bonus: { label: "Welcome bonus", note: "For joining us" },
  promo_grant: { label: "Celebration credit", note: "Unlocked by your orders" },
  referral_earn: { label: "Referral credit", note: "From friends you invited" },
  cashback_earn: { label: "Cashback", note: "From past orders" },
  manual_grant: { label: "From our team", note: "Added by CrossFriend" },
}

export default function WalletCard({ wallet }: { wallet: Wallet | null }) {
  /* Null means signed out, or the backend did not answer. Either way, showing "₹0" would be a claim
     this component cannot stand behind, so it shows nothing. */
  if (!wallet) return null

  const hasCredit = wallet.balancePaise > 0
  const hasHistory = wallet.entries.length > 0
  const soonest = wallet.expiring[0]
  const sources = (wallet.sources ?? []).filter((s) => s.amountPaise > 0)

  return (
    <div
      className="overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base"
      data-testid="wallet-card"
    >
      {/* The headline. One number, large, and nothing competing with it. */}
      <div className="bg-ui-bg-subtle px-6 py-5">
        <p className="text-small-regular text-ui-fg-subtle">Celebration credit</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <p
            className="text-3xl-semi text-ui-fg-base"
            data-testid="wallet-balance"
            data-value={wallet.balancePaise}
          >
            {rupees(wallet.balancePaise)}
          </p>
          {hasCredit && (
            <LocalizedClientLink
              href="/store"
              className="rounded-lg bg-ui-bg-interactive px-4 py-2 text-small-semi text-ui-fg-on-color"
            >
              Spend it
            </LocalizedClientLink>
          )}
        </div>
      </div>

      {/* What the balance is made of. Only the parts they actually hold. */}
      {sources.length > 0 && (
        <div className="grid grid-cols-2 gap-px bg-ui-border-base">
          {sources.map((s) => {
            const meta = SOURCE[s.type] ?? { label: "Credit", note: "" }
            return (
              <div key={s.type} className="bg-ui-bg-base px-4 py-3">
                <p className="text-xsmall-regular text-ui-fg-subtle">{meta.label}</p>
                <p className="text-base-semi mt-0.5 text-ui-fg-base">{rupees(s.amountPaise)}</p>
                {meta.note && (
                  <p className="text-xsmall-regular mt-0.5 text-ui-fg-muted">{meta.note}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/**
       * The deadline, said while the credit can still be spent.
       *
       * Prominent rather than a footnote: this is the single line most likely to bring somebody back,
       * and its absence is the single thing most likely to be read as us quietly taking money away.
       */}
      {soonest && (
        <div className="border-t border-ui-border-base bg-amber-50 px-6 py-3">
          <p className="text-small-regular text-amber-900">
            <strong className="font-semibold">{rupees(soonest.amountPaise)}</strong>{" "}
            {expiryPhrase(daysUntil(soonest.expiresAt))}
          </p>
        </div>
      )}

      {!hasCredit && !hasHistory && (
        /* The hook. Anchoring on ₹200 while the balance is genuinely zero — which is the honest
           state, and the reason nothing is issued until an order exists. */
        <div className="border-t border-ui-border-base px-6 py-4">
          <p className="text-base-semi text-ui-fg-base">₹200 is waiting for you</p>
          <p className="text-small-regular mt-1 text-ui-fg-subtle">
            ₹100 unlocks on your first order, and another ₹100 on your second. Nothing to claim and
            no code to remember — it arrives by itself.
          </p>
        </div>
      )}

      {hasHistory && (
        <div className="border-t border-ui-border-base px-6 py-4">
          <p className="text-xsmall-regular font-semibold uppercase tracking-wide text-ui-fg-muted">
            Activity
          </p>
          <ul className="mt-2 divide-y divide-ui-border-base">
            {wallet.entries.slice(0, 8).map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-3 py-2">
                <span className="text-small-regular text-ui-fg-base">{describeEntry(e)}</span>
                <span className="flex shrink-0 items-baseline gap-3">
                  <span className="text-xsmall-regular text-ui-fg-muted">{onDay(e.at)}</span>
                  <span
                    className={`text-small-semi tabular-nums ${
                      e.amountPaise > 0 ? "text-emerald-700" : "text-ui-fg-subtle"
                    }`}
                  >
                    {e.amountPaise > 0 ? "+" : "−"}
                    {rupees(Math.abs(e.amountPaise))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/**
       * The rules, stated where somebody will read them before they need them.
       *
       * Every one of these is a question support would otherwise be answering by message: why can I
       * not send this to my sister, why did only part of it apply, why is delivery still charged.
       */}
      <div className="border-t border-ui-border-base bg-ui-bg-subtle px-6 py-4">
        <p className="text-xsmall-regular font-semibold uppercase tracking-wide text-ui-fg-muted">
          Good to know
        </p>
        <ul className="text-xsmall-regular mt-2 space-y-1.5 text-ui-fg-subtle">
          <li>
            <strong className="font-semibold text-ui-fg-base">It expires.</strong> Each credit carries
            its own date, shown above while it still can be spent.
          </li>
          <li>
            <strong className="font-semibold text-ui-fg-base">It pays for cakes.</strong> Credit goes
            towards the items in your order, not delivery or taxes, and there is a limit per order —
            checkout shows you exactly how much applies.
          </li>
          <li>
            <strong className="font-semibold text-ui-fg-base">It is yours alone.</strong> Credit
            cannot be transferred to anybody else or withdrawn as cash.
          </li>
        </ul>
      </div>
    </div>
  )
}

/** "expires today" reads better than "expires in 0 days", and "tomorrow" better than "in 1 day". */
function expiryPhrase(days: number): string {
  if (days <= 0) return "expires today — use it on your next order"
  if (days === 1) return "expires tomorrow"
  return `expires in ${days} days`
}

function onDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

/* Kept so the entry type is used and a future reader sees what a row is built from. */
export type { WalletEntry }
