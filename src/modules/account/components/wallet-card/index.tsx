import LocalizedClientLink from "@modules/common/components/localized-client-link"

import { rupees, daysUntil } from "@lib/money"
import { describeEntry, type Wallet, type WalletEntry } from "@lib/data/wallet"
import UnlockArea from "./unlock-area"

/**
 * Celebration credit, as the customer sees it.
 *
 * ── The shape, and why the offer is inside the card ────────────────────────────────────────────
 * A balance and a two-step track, on one object. Almost every customer here has a balance of zero —
 * there are no orders on the brand yet — so a card that only showed a number would be a card that
 * showed nothing, with the interesting part demoted to a note underneath. Putting the ladder on the
 * card makes the empty state the main event: not "you have ₹0" but "₹200, and here is how far along
 * you are".
 *
 * Below it, in order: what is about to expire, the balance broken into what it is made of, the
 * movements, then the rules. That is the arrangement every Indian retail wallet has settled on, and
 * a customer arriving here has almost certainly used one.
 *
 * ── Why every figure comes from the server ─────────────────────────────────────────────────────
 * This card used to say "₹200 is waiting for you" from a string typed into it, and all three numbers
 * behind that sentence move: the grant amounts are operator settings, the offer runs in named
 * pincodes — one, at the time of writing — and it needs an order above a minimum. So the promise was
 * wrong in amount for anyone it was changed for, and wrong outright for everyone outside that one
 * area. `wallet.ladder` is answered per customer and per area by the same evaluation that decides
 * the payout, so the screen cannot promise money the system would refuse to pay.
 *
 * ── Why "not in your area" gets a state of its own ─────────────────────────────────────────────
 * Because today it is the common case, not the edge. Rendering nothing there would leave a customer
 * looking at a bare zero with no account of why, which reads as something broken. Saying so plainly
 * costs one line and is true.
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

const STEP_LABEL = ["First order", "Second order", "Third order", "Fourth order"]

export default function WalletCard({ wallet }: { wallet: Wallet | null }) {
  /* Null means signed out, or the backend did not answer. Either way, showing "₹0" would be a claim
     this component cannot stand behind, so it shows nothing. */
  if (!wallet) return null

  const hasCredit = wallet.balancePaise > 0
  const hasHistory = wallet.entries.length > 0
  const soonest = wallet.expiring[0]
  const sources = (wallet.sources ?? []).filter((s) => s.amountPaise > 0)

  const ladder = wallet.ladder ?? null
  const showTrack = !!ladder && ladder.running && ladder.steps.length > 0
  /* Amounts come back even when the offer is not payable here, so there is a real figure to name in
     the one refusal the customer can do something about. */
  const askArea = !!ladder && ladder.blocked === "no_pincode" && ladder.totalPaise > 0
  const notHere = !!ladder && ladder.blocked === "not_in_area"

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(17,24,39,0.08)] ring-1 ring-grey-20"
      data-testid="wallet-card"
    >
      {/**
       * The card. Gloss rather than a flat fill: a broad specular sweep across the upper half and a
       * white hairline along the top edge, which together read as a moulded object instead of a
       * printed rectangle — the difference between a gift card and a coloured div.
       */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cf-purple-700 via-cf-purple-600 to-fuchsia-600 px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(0,0,0,0.12)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-cf-pink/25 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_18%_0%,rgba(255,255,255,0.22),rgba(255,255,255,0)_55%)]"
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              Celebration credit
            </p>
            <p className="font-heading text-xs font-bold text-white/85">CrossFriend</p>
          </div>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2.5">
              <p
                className="text-[2.75rem] font-bold leading-none tabular-nums text-white"
                data-testid="wallet-balance"
                data-value={wallet.balancePaise}
              >
                {rupees(wallet.balancePaise)}
              </p>
              {showTrack && (
                <p className="text-sm text-white/60">of {rupees(ladder!.totalPaise)}</p>
              )}
            </div>
            {hasCredit && !showTrack && (
              <LocalizedClientLink
                href="/store"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-cf-purple-700 shadow-sm"
              >
                Spend it
              </LocalizedClientLink>
            )}
          </div>

          {showTrack && <Track ladder={ladder!} />}

          {!showTrack && !hasCredit && (
            <p className="mt-2.5 text-xs text-white/70">Your credit will appear here.</p>
          )}
        </div>
      </div>

      {/**
       * The deadline, said while the credit can still be spent.
       *
       * Amber rather than brand purple: a deadline is a different kind of message from a reward, and
       * the two must not look alike. Its absence is the single thing most likely to be read as us
       * quietly taking money away.
       */}
      {soonest && (
        <div className="flex items-center gap-2.5 border-b border-amber-200 bg-amber-50 px-6 py-3.5">
          <ClockIcon />
          <p className="text-sm text-amber-900">
            <strong className="font-bold">{rupees(soonest.amountPaise)}</strong>{" "}
            {expiryPhrase(daysUntil(soonest.expiresAt))}
          </p>
        </div>
      )}

      {askArea && <UnlockArea waitingLabel={rupees(ladder!.totalPaise)} />}

      {notHere && (
        /* Plainly, and without an apology or a waitlist we do not have. Somebody reading this has
           just seen a zero and deserves to know it is geography rather than a fault. */
        <div className="border-b border-grey-20 px-6 py-4">
          <p className="text-sm text-grey-60">
            We aren&rsquo;t running a credit offer in your area yet. Your credit still works on any
            order, and anything you earn from inviting friends lands here.
          </p>
        </div>
      )}

      {/**
       * What the balance is made of. Only the parts they actually hold.
       *
       * Stretched to fill rather than laid on a fixed grid: somebody may hold one kind of credit or
       * four, and a two-column grid holding three leaves a ruled-off empty cell that reads as
       * something which failed to load.
       */}
      {sources.length > 0 && (
        <div className="overflow-hidden border-b border-grey-20">
          <div className="-mr-px flex flex-wrap">
            {sources.map((s) => {
              const meta = SOURCE[s.type] ?? { label: "Credit", note: "" }
              return (
                <div key={s.type} className="min-w-[9rem] flex-1 border-r border-grey-20 px-5 py-4">
                  <p className="text-xs text-grey-50">{meta.label}</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-grey-90">
                    {rupees(s.amountPaise)}
                  </p>
                  {meta.note && <p className="mt-0.5 text-[11px] text-grey-40">{meta.note}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {hasHistory && (
        <div className="border-b border-grey-20 px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-grey-40">
            Activity
          </p>
          <ul className="mt-2.5 divide-y divide-grey-10">
            {wallet.entries.slice(0, 8).map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-3 py-2.5">
                <span className="text-sm text-grey-80">{describeEntry(e)}</span>
                <span className="flex shrink-0 items-baseline gap-3">
                  <span className="text-xs text-grey-40">{onDay(e.at)}</span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      e.amountPaise > 0 ? "text-emerald-600" : "text-grey-50"
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
      <div className="bg-grey-5 px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-grey-40">
          Good to know
        </p>
        <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-grey-60">
          <li>
            <strong className="font-bold text-grey-90">It expires.</strong> Each credit carries its
            own expiry date, and we show it on this screen well before it runs out.
          </li>
          <li>
            <strong className="font-bold text-grey-90">It pays for cakes.</strong> Credit goes
            towards the items in your order, not delivery or taxes, and there is a limit per order —
            checkout shows you exactly how much applies.
          </li>
          <li>
            <strong className="font-bold text-grey-90">It is yours alone.</strong> Credit cannot be
            transferred to anybody else or withdrawn as cash.
          </li>
        </ul>
      </div>
    </div>
  )
}

/**
 * The ladder, as a bar in as many parts as there are grants.
 *
 * Gold is the reward colour and nothing else on the card wears it, so a filled segment is readable
 * at a glance without reading its label. Unfilled segments are translucent white rather than a
 * second colour, because "not yet" should not look like a different kind of thing from "yours".
 */
function Track({ ladder }: { ladder: NonNullable<Wallet["ladder"]> }) {
  const minOrder = ladder.minOrderPaise

  return (
    <div className="mt-5">
      <div className="flex gap-1.5">
        {ladder.steps.map((s, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${s.unlocked ? "bg-cf-yellow" : "bg-white/25"}`}
          />
        ))}
      </div>

      <div className="mt-3 flex gap-1.5">
        {ladder.steps.map((s, i) => (
          <div key={i} className="min-w-0 flex-1">
            <p className={`text-sm font-bold ${s.unlocked ? "text-cf-yellow" : "text-white/55"}`}>
              {rupees(s.amountPaise)}
            </p>
            <p className="mt-0.5 text-[11px] text-white/70">{STEP_LABEL[i] ?? `Order ${i + 1}`}</p>
            <p className="mt-0.5 text-[11px] text-white/45">{s.unlocked ? "Unlocked" : "Not yet"}</p>
          </div>
        ))}
      </div>

      {/* The condition that decides whether an order counts. Omitted entirely when there is none,
          rather than rendered as "on orders over ₹0". */}
      {minOrder > 0 && (
        <p className="mt-3 text-[11px] text-white/55">
          On orders over {rupees(minOrder)}, once delivered.
        </p>
      )}

      <LocalizedClientLink
        href="/store"
        className="mt-4 block rounded-full bg-white py-3 text-center text-sm font-bold text-cf-purple-700 shadow-sm"
      >
        {callToAction(ladder)}
      </LocalizedClientLink>
    </div>
  )
}

/**
 * What the button should say, given how far along the ladder they are.
 *
 * The middle case is the one worth getting right: `remainingPaise` is what is left to EARN, not to
 * spend, so "spend ₹100 more" would be exactly backwards — it would read as a spending threshold
 * they have to clear, when the ₹100 is the reward for ordering again.
 */
function callToAction(ladder: NonNullable<Wallet["ladder"]>): string {
  if (ladder.unlockedCount === 0) return "Order your first cake"
  if (ladder.remainingPaise > 0) return `Order again to unlock ${rupees(ladder.remainingPaise)}`
  return "Spend it on a cake"
}

function ClockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-amber-700"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
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
