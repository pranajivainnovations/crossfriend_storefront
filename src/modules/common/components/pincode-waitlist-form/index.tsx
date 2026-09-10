"use client"

import { useState } from "react"

/**
 * "Tell me when you're here" — one number, against one pincode.
 *
 * ── Why the button is the whole form until it is pressed ───────────────────────────────────────
 * This appears at the moment somebody has been told we cannot deliver to them. An input box sitting
 * open at that moment reads as a consolation form and gets ignored; a single button reads as an
 * offer, and only the people who want it pay the cost of seeing a field. It also keeps the
 * disappointing state short, which is the state we least want to dwell in.
 *
 * ── Why it never reports "you're already on the list" ──────────────────────────────────────────
 * The backend answers the same way whether the row was new or already there, on purpose — otherwise
 * anyone could test whether a given number is waiting on a given pincode. So the confirmation here
 * is deliberately about what will happen ("we'll text you"), not about what was found.
 */
export default function PincodeWaitlistForm({
  pincode,
  source,
  className = "",
}: {
  pincode: string
  /** Which dead end this was reached from — worth different amounts as a demand signal. */
  source: "studio" | "product" | "checker"
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState("")
  const [state, setState] = useState<"idle" | "saving" | "done">("idle")
  const [error, setError] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number")
      return
    }
    setState("saving")
    try {
      const res = await fetch("/api/pincode/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode, mobile, source }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Couldn't save that. Please try again.")
        setState("idle")
        return
      }
      setState("done")
    } catch {
      setError("Couldn't save that. Please try again.")
      setState("idle")
    }
  }

  if (state === "done") {
    return (
      <p className={`text-xs font-medium text-green-700 ${className}`}>
        Done — we&rsquo;ll text you the day we reach {pincode}.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-xs font-semibold text-cf-purple-700 underline underline-offset-2 transition hover:text-cf-purple-900 ${className}`}
      >
        Tell me when you&rsquo;re here
      </button>
    )
  }

  return (
    <form onSubmit={submit} className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs font-semibold text-slate-500">+91</span>
        <input
          type="tel"
          inputMode="numeric"
          autoFocus
          maxLength={10}
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="Mobile number"
          className="min-w-0 flex-1 rounded-lg border border-cf-purple-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-cf-purple-400 focus:outline-none focus:ring-2 focus:ring-cf-purple-200"
        />
        <button
          type="submit"
          disabled={state === "saving" || mobile.length !== 10}
          className="shrink-0 rounded-lg bg-cf-purple-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-cf-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "saving" ? "…" : "Notify me"}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
      <p className="text-[11px] leading-relaxed text-slate-400">
        {/* Says what the number is for and what it is not for. Consent under the DPDP Act is
            specific, and this one is narrow on purpose — see the migration. */}
        Only to tell you when we start delivering to {pincode}. Nothing else.
      </p>
    </form>
  )
}
