"use client"

import { useEffect, useState } from "react"

import { usePincode } from "@lib/context/pincode-context"

/**
 * Asking where somebody is, before they have told us any other way.
 *
 * ── Why this is asked at all, and this early ───────────────────────────────────────────────────
 * A customer's area was previously learned from their first order's delivery address, which meant we
 * knew nothing about anybody until they had already bought something. That is too late for the thing
 * it is needed for: deciding which welcome offer to show and to grant. Asking on arrival turns an
 * unknown visitor into a known one at the top of the funnel rather than the bottom.
 *
 * ── Why it is framed as unlocking rather than checking ─────────────────────────────────────────
 * "Check delivery for your pincode" asks the visitor to do us a favour. "Unlock the offer in your
 * area" is the same field with something in it for them, which is also the truthful description —
 * there genuinely is credit waiting, and it genuinely depends on where they are.
 *
 * ── Why it can always be dismissed ─────────────────────────────────────────────────────────────
 * A modal that cannot be escaped is a modal that loses sessions. Backdrop, Escape and an explicit
 * Skip all close it, and browsing continues untouched. What persists afterwards is a slim bar, which
 * keeps the question available without ever standing in front of the page again.
 *
 * ── Why the bar sits at the bottom ─────────────────────────────────────────────────────────────
 * Almost everybody arrives on a phone, and the bottom of a phone screen is where a thumb already is.
 * It also leaves the first impression of the page — the part that decides whether somebody stays —
 * completely unobstructed.
 */

const DISMISSED_KEY = "cf_pincode_prompt_dismissed"

export default function PincodeGate() {
  const { pincode, deliveryInfo, isChecking, error, setPincode } = usePincode()

  /* Undefined until the browser has been read, so nothing renders during the moment when "we have
     no pincode" and "we have not looked yet" are indistinguishable — that flash is how a returning
     customer gets asked something they already answered. */
  const [dismissed, setDismissed] = useState<boolean | undefined>(undefined)
  const [input, setInput] = useState("")

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === "1")
    } catch {
      /* Private browsing, blocked storage. Treat it as not dismissed and let the bar carry the
         question — being asked twice is a smaller failure than never being asked. */
      setDismissed(false)
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISSED_KEY, "1")
    } catch {
      /* Nothing to do. The prompt returns next visit, which is acceptable. */
    }
  }

  useEffect(() => {
    if (dismissed !== false || pincode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [dismissed, pincode])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.length !== 6) return
    await setPincode(input)
  }

  /* Answered, or not yet read. Either way there is nothing to ask. */
  if (pincode || dismissed === undefined) return null

  const field = (
    <form onSubmit={submit} className="flex w-full items-center gap-2">
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={input}
        onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
        placeholder="Enter pincode"
        aria-label="Your pincode"
        className="min-w-0 flex-1 rounded-lg border border-ui-border-base bg-white px-3 py-2 text-base text-grey-80 placeholder:text-ui-fg-muted focus:border-cf-orange focus:outline-none focus:ring-2 focus:ring-cf-orange/40"
      />
      <button
        type="submit"
        disabled={isChecking || input.length !== 6}
        className="shrink-0 rounded-lg bg-cf-orange px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isChecking ? "…" : "Unlock"}
      </button>
    </form>
  )

  /**
   * What a wrong pincode is told.
   *
   * A pincode we do not serve is not a failure and is not said as one — the studio still works
   * everywhere, and somebody who hears "we don't deliver to you" leaves, while somebody who hears
   * what they can still do sometimes stays.
   */
  const answer =
    error ??
    (deliveryInfo && deliveryInfo.tier !== "deliver"
      ? "We're not baking there yet — but the cake studio works everywhere, so have a look around."
      : null)

  /**
   * The bar sits ABOVE the primary bottom nav on a phone, not on top of it.
   *
   * That nav is fixed at bottom-0 with the same z-index and is hidden from the `small` breakpoint up,
   * so this bar is offset by its height — 3.5rem plus the phone's own safe-area inset, which the nav
   * already pads for — and drops to the bottom edge on wider screens where the nav is not there at
   * all. Two fixed elements at the same z-index and the same offset is how a working control ends up
   * permanently underneath another one.
   */
  if (dismissed) {
    return (
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-40 border-t border-ui-border-base bg-white/95 px-4 py-2.5 backdrop-blur small:bottom-0">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <span className="hidden shrink-0 text-sm font-medium text-grey-80 small:block">
            🎁 Unlock the offer in your area
          </span>
          {field}
        </div>
        {answer && <p className="mx-auto mt-1 max-w-2xl text-xs text-ui-fg-muted">{answer}</p>}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center small:items-center">
      {/* Clicking away closes it. Labelled for anybody navigating by keyboard rather than pointer. */}
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pincode-gate-title"
        className="relative w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl small:rounded-2xl"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 text-xl leading-none text-ui-fg-muted"
        >
          ×
        </button>

        <p className="text-2xl">🎁</p>
        <h2 id="pincode-gate-title" className="mt-2 text-xl font-bold text-grey-90">
          Where are we baking for you?
        </h2>
        <p className="mt-1 text-sm text-grey-60">
          Tell us your pincode and we&rsquo;ll show you what&rsquo;s waiting in your area — and which
          bakeries near you are taking orders.
        </p>

        <div className="mt-4">{field}</div>
        {answer && <p className="mt-2 text-xs text-ui-fg-muted">{answer}</p>}

        <button
          type="button"
          onClick={dismiss}
          className="mt-4 text-sm text-ui-fg-subtle underline"
        >
          Just browsing
        </button>
      </div>
    </div>
  )
}
