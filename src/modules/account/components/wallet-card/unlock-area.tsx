"use client"

import { useState } from "react"

import { usePincode } from "@lib/context/pincode-context"
import { capturePincode } from "@lib/pincode-capture"

/**
 * The one refusal a customer can fix from this screen.
 *
 * ── Why the field is here rather than a link to the prompt ─────────────────────────────────────
 * Every other reason the offer is not running — not in their area, switched off, out of budget — is
 * ours to change and there is nothing useful to put in front of them. "We do not know where you
 * are" is the exception: it is six digits away from being answered, and the customer is already
 * looking at the sentence that explains why it matters. Sending them to a different surface to type
 * them loses most of the people who would have.
 *
 * ── Why it writes through capturePincode ───────────────────────────────────────────────────────
 * Same call the arrival prompt, the bar, the studio and checkout all make, so a pincode entered here
 * lands everywhere those land: the cookie the server reads, and the welcome-bonus claim. Adding a
 * fifth way to record a pincode would have been the fifth screen keeping its own private copy, which
 * is precisely the bug that made three of the first four blind.
 *
 * ── Why it reloads rather than updating in place ───────────────────────────────────────────────
 * What the ladder says is decided on the server, from the cookie, by the same engine that pays. A
 * client-side guess at the new answer would be a second implementation of the offer rules living in
 * a component, and the first time the two disagreed the screen would be the one lying.
 */
export default function UnlockArea({ waitingLabel }: { waitingLabel: string }) {
  const { setPincode, isChecking } = usePincode()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const valid = /^[1-9][0-9]{5}$/.test(code)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || isChecking) return
    setError(null)

    try {
      await setPincode(code)
      capturePincode(code)
      /* The server decides what the offer says, so ask it again rather than guessing here. */
      window.location.reload()
    } catch {
      setError("Couldn't check that just now. Please try again.")
    }
  }

  return (
    <div className="border-b border-grey-20 bg-gradient-to-r from-cf-yellow-light/50 to-white px-6 py-5">
      <p className="text-base font-bold text-grey-90">{waitingLabel} is waiting in your area</p>
      <p className="mt-1 text-sm leading-relaxed text-grey-60">
        Tell us where you are and we&rsquo;ll show you exactly what&rsquo;s on offer near you.
      </p>

      <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          placeholder="Your pincode"
          aria-label="Your pincode"
          className="w-36 rounded-xl border border-grey-20 bg-white px-4 py-2.5 text-sm tabular-nums text-grey-90 outline-none focus:border-cf-purple-400"
        />
        <button
          type="submit"
          disabled={!valid || isChecking}
          className="rounded-xl bg-gradient-to-r from-cf-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-cf-purple-300/50 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isChecking ? "Checking…" : "Unlock"}
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
