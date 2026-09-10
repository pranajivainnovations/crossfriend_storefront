"use client"

import { useEffect, useState } from "react"
import type { Customer } from "@medusajs/medusa"

/**
 * A quiet nudge to fill in what signing in with a phone number could not ask for.
 *
 * ── Why this is one dismissible line and not a modal ───────────────────────────────────────────
 * The fastest way to never get somebody's email is to demand it before they have any reason to give
 * one. A modal on arrival gets dismissed, and dismissed permanently — the person learns the shape of
 * the thing that interrupts them and closes it without reading. This sits inside the profile, where
 * somebody is already editing details, and goes away when they say so.
 *
 * ── Why every item states what it is for ───────────────────────────────────────────────────────
 * "Complete your profile" is a chore assigned by a website. "Add your email and we'll send order
 * receipts" is an offer with a reason attached. The second one gets answered, and it is also the
 * honest framing: we are asking for something because it lets us do something for them.
 *
 * Nothing here blocks anything. A customer who ignores it forever can still order, be delivered to,
 * and be reminded — the phone number is the identity and the rest is enrichment.
 */

/** The address we invented at sign-up, not one the customer gave us. */
function isSyntheticEmail(email: string | null | undefined): boolean {
  if (!email) return true
  return /^\d{10}@(crossfriend\.in|pranajiva\.in)$/i.test(email)
}

const DISMISS_KEY = "cf-profile-nudge-dismissed"

export default function ProfileCompleteness({ customer }: { customer: Omit<Customer, "password_hash"> }) {
  /* Rendered only after mount: whether it was dismissed lives in localStorage, which does not exist
     during server rendering, and a line that appears then vanishes on hydration is worse than one
     that arrives a moment late. */
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) !== null)
    } catch {
      // Private mode or blocked storage. Showing it is the right failure — the cost is a line
      // somebody closes twice, not a prompt they can never escape.
      setDismissed(false)
    }
    setReady(true)
  }, [])

  const missing: { label: string; why: string }[] = []
  if (!customer.first_name?.trim()) {
    missing.push({ label: "your name", why: "so we can address you properly" })
  }
  if (isSyntheticEmail(customer.email)) {
    missing.push({ label: "an email", why: "and we'll send order receipts you can find later" })
  }

  if (!ready || dismissed || missing.length === 0) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // Closing still works for this page view even if the choice cannot be remembered.
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-cf-purple-200 bg-cf-purple-50/60 px-4 py-3">
      <span className="text-lg" aria-hidden="true">
        ✨
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">
          {missing.length === 1 ? "One thing missing" : "A couple of things missing"}
        </p>
        <ul className="mt-1 space-y-0.5">
          {missing.map((item) => (
            <li key={item.label} className="text-xs text-slate-600">
              Add <span className="font-semibold">{item.label}</span> {item.why}.
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-xs font-semibold text-slate-400 underline underline-offset-2 transition hover:text-slate-600"
      >
        Not now
      </button>
    </div>
  )
}
