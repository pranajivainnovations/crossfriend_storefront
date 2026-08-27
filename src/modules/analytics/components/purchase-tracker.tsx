"use client"

import { useEffect } from "react"

import { track } from "@lib/analytics"

/**
 * Fires the purchase event, exactly once per order.
 *
 * ── The double-counting problem ─────────────────────────────────────────────────────────────────
 * The confirmation page is not a one-shot view. People refresh it, bookmark it, reach it again from
 * the order-tracking link, and come back to it from email. Every one of those is a fresh mount, and
 * a naive `useEffect(() => track("purchase"))` reports another sale each time — which inflates the
 * one number nobody wants inflated, and does so invisibly because each individual event looks fine.
 *
 * Two independent guards, because either alone has a hole:
 *   1. This sessionStorage key stops repeats within a session, including a plain refresh.
 *   2. GA4 deduplicates server-side on `transaction_id`, which catches a return visit days later
 *      from a new session where sessionStorage is empty.
 *
 * The client guard is the cheap one; transaction_id is the one that actually holds.
 */
export default function PurchaseTracker({
  payload,
}: {
  payload: {
    transaction_id: string
    currency: string
    value: number
    tax: number
    shipping: number
    items: unknown[]
  }
}) {
  useEffect(() => {
    const key = `cf_purchase_${payload.transaction_id}`

    try {
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, "1")
    } catch {
      // Storage unavailable (private browsing). Fall through and send it: GA4's transaction_id
      // deduplication still protects the total, and losing a real purchase event would be worse
      // than relying on the second guard alone.
    }

    track("purchase", payload as never)
  }, [payload])

  return null
}
