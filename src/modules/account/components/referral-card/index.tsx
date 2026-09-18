"use client"

import { useState } from "react"

import { rupees } from "@lib/money"
import { referralLink } from "@lib/referral"
import type { Referral } from "@lib/data/referral"

/**
 * The customer's referral code, and the two ways they will actually share it.
 *
 * ── Why the code is the headline and the link is the button ────────────────────────────────────
 * The link is what attributes; the code is what people remember, read out, and type into a message
 * themselves. Showing a long URL as the main object would give the customer something they can only
 * copy, and the first thing anybody does with a URL they cannot read is wonder what is in it.
 *
 * ── Why Share and Copy, in that order ──────────────────────────────────────────────────────────
 * Almost all of this happens on a phone, and on a phone the honest action is the system share sheet
 * straight into WhatsApp. Copy is the fallback for desktop and for browsers without it — offered
 * always rather than feature-detected away, because a button that appears on one device and not
 * another is a support question.
 *
 * ── How the numbers are worded, now that there are numbers ─────────────────────────────────────
 * Three states and no running total of what is "coming". A referrer whose friend has ordered sees
 * that a delivery is in its return window, not an amount — because the amount depends on the rate in
 * force when the payout runs, and a figure that shrinks between being shown and being paid is worse
 * than no figure. What has actually landed in the wallet is stated plainly, because that one cannot
 * move.
 *
 * Nothing identifies a referee. The referrer knows who they invited; they do not need us confirming a
 * friend's ordering habits back to them.
 */
export default function ReferralCard({ referral }: { referral: Referral | null }) {
  const [copied, setCopied] = useState(false)

  /* Null means signed out or the backend did not answer — see getReferral for why that renders
     nothing rather than a card with a blank code in it. */
  if (!referral) return null

  const link = referralLink(referral.code)
  const message = `I order cakes from CrossFriend — use my link and we both get a little something. ${link}`

  const share = async () => {
    /* The share sheet is the point on a phone; its absence is ordinary, not an error, and a rejected
       share (the customer closing the sheet) is not one either. Both fall through to copying, which
       is the thing they were trying to do. */
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "CrossFriend", text: message, url: link })
        return
      } catch {
        /* Cancelled or refused — fall through to copy. */
      }
    }
    await copy()
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* Clipboard denied. The code is on screen and selectable, which is why it is rendered as text
         rather than locked inside a button. */
    }
  }

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(17,24,39,0.08)] ring-1 ring-grey-20"
      data-testid="referral-card"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-grey-40">
        Invite a friend
      </p>

      {/* A torn-ticket dashed border, because that is what a code people read aloud looks like
          everywhere else they have seen one. It also stops the code reading as a heading. */}
      <div className="mt-2.5 rounded-xl border-2 border-dashed border-cf-purple-200 bg-cf-purple-50 px-4 py-3.5 text-center">
        <p
          className="font-mono text-2xl font-bold tracking-[0.2em] text-cf-purple-700"
          data-testid="referral-code"
        >
          {referral.code}
        </p>
      </div>

      <p className="mt-3.5 text-sm leading-relaxed text-grey-60">
        Share your link with someone who hasn&rsquo;t ordered from us yet. When they place their
        first order, we&rsquo;ll credit you.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={share}
          className="rounded-xl bg-gradient-to-r from-cf-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-cf-purple-300/50 transition hover:from-cf-purple-700 hover:to-purple-700"
        >
          Share link
        </button>

        <button
          type="button"
          onClick={copy}
          className="rounded-xl border border-grey-20 px-5 py-2.5 text-sm font-bold text-grey-80 transition hover:bg-grey-5"
          data-testid="referral-copy"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      <p className="mt-4 break-all text-[11px] text-grey-40">{link}</p>

      {referral.standing.joined > 0 && <Standing standing={referral.standing} />}
    </div>
  )
}

/**
 * How the invitations are going.
 *
 * Only rendered once somebody has actually joined — a table of zeros under an invitation to share
 * reads as a programme that does not work, which is the opposite of what it is for.
 */
function Standing({ standing }: { standing: Referral["standing"] }) {
  const { joined, ordered, earnedPaise, holdingOrders } = standing

  return (
    <div className="mt-5 border-t border-grey-20 pt-4">
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <Figure label={joined === 1 ? "friend joined" : "friends joined"} value={String(joined)} />
        {ordered > 0 && (
          <Figure label={ordered === 1 ? "has ordered" : "have ordered"} value={String(ordered)} />
        )}
        {earnedPaise > 0 && <Figure label="credited to you" value={rupees(earnedPaise)} />}
      </div>

      {holdingPhrase(holdingOrders) && (
        /* Said rather than counted into the total. An order inside its return window is money that
           might not arrive, and a customer who watches a figure go down will not believe the next
           one. */
        <p className="mt-3 text-xs text-grey-50">{holdingPhrase(holdingOrders)}</p>
      )}

      {joined > 0 && ordered === 0 && (
        <p className="mt-3 text-xs text-grey-50">
          Nothing to pay out yet — your credit arrives once a friend&rsquo;s first order has been
          delivered.
        </p>
      )}
    </div>
  )
}

function holdingPhrase(orders: number): string | null {
  if (orders <= 0) return null
  return orders === 1
    ? "One delivered order is in its return window. Your credit arrives when it closes."
    : `${orders} delivered orders are in their return window. Your credit arrives as each one closes.`
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold tabular-nums text-cf-purple-700">{value}</p>
      <p className="text-xs text-grey-50">{label}</p>
    </div>
  )
}
