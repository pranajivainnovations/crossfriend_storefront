"use client"

import { useEffect, useState } from "react"

/**
 * "Tell us what you pictured" — the way out of the Studio's two dead ends.
 *
 * ── Which dead ends ────────────────────────────────────────────────────────────────────────────
 * Someone who has generated ten designs and still not seen the cake in their head, and someone
 * whose allowance has run out and who has just been told to talk to us. Both are people trying to
 * buy a cake who have hit the end of what a text prompt can do for them. Before this, that was
 * where the product stopped.
 *
 * ── Why it asks for words rather than offering a phone number ──────────────────────────────────
 * A number puts the effort on the customer at the exact moment they have run out of patience, and
 * leaves us nothing when they do not call. A sentence typed here costs them seconds, reaches a
 * queue somebody is watching, and — because it is in their own words — is the clearest record we
 * have of what the generator could not express.
 *
 * ── Why it never promises a time ───────────────────────────────────────────────────────────────
 * Nothing here knows how busy the team is. "Someone will get back to you" is true; "within an hour"
 * would be a guess made by a component, and the first time it were wrong it would cost more trust
 * than the sentence ever bought.
 */

type OpenRequest = { id: string; message: string; createdAt: string }

export default function RefineRequest({
  isLoggedIn,
  generationId,
  designId,
  prominent = false,
}: {
  isLoggedIn: boolean
  generationId?: string | null
  designId?: string | null
  /** Out of generations — then this is the main thing on screen, not a quiet offer below it. */
  prominent?: boolean
}) {
  const [open, setOpen] = useState<OpenRequest | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [message, setMessage] = useState("")
  const [contact, setContact] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /* Do we already have one from them? Asked so a customer who sent something yesterday is told we
     have it, rather than shown an empty box implying the first one vanished. */
  useEffect(() => {
    if (!isLoggedIn) return
    let cancelled = false
    fetch("/api/ai-studio/refine", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { open?: OpenRequest | null } | null) => {
        if (!cancelled && data?.open) setOpen(data.open)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  if (!isLoggedIn) return null

  const send = async () => {
    if (message.trim().length < 3) {
      setError("Tell us what you are looking for — a sentence is plenty.")
      return
    }
    setError(null)
    setSending(true)

    try {
      const res = await fetch("/api/ai-studio/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          contact: contact.trim() || undefined,
          generationId: generationId || undefined,
          designId: designId || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "We could not send that just now. Please try again in a moment.")
        return
      }

      setSent(data.message || "Got it. Someone will get back to you.")
      setExpanded(false)
      setMessage("")
    } catch {
      setError("We could not send that just now. Please check your connection.")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <p className="text-sm font-semibold text-emerald-900">{sent}</p>
        <p className="mt-1 text-xs text-emerald-800">
          We will reach you on the number you signed in with.
        </p>
      </div>
    )
  }

  if (open && !expanded) {
    return (
      <div className="rounded-2xl border border-cf-purple-200 bg-cf-purple-50 px-5 py-4">
        <p className="text-sm font-semibold text-cf-purple-900">
          We have your request and someone will be in touch.
        </p>
        <p className="mt-1 text-xs text-cf-purple-700">&ldquo;{open.message}&rdquo;</p>
        <button
          type="button"
          onClick={() => {
            setMessage(open.message)
            setExpanded(true)
          }}
          className="mt-2 text-xs font-semibold text-cf-purple-700 underline"
        >
          Add something to it
        </button>
      </div>
    )
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={
          prominent
            ? "w-full rounded-2xl bg-gradient-to-r from-cf-purple-700 via-cf-purple-600 to-fuchsia-600 px-5 py-4 text-left text-white shadow-lg"
            : "w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left"
        }
      >
        <span
          className={prominent ? "block text-sm font-semibold" : "block text-sm font-semibold text-slate-900"}
        >
          Not quite what you pictured? We&rsquo;ll design it with you.
        </span>
        <span className={prominent ? "mt-1 block text-xs text-white/80" : "mt-1 block text-xs text-slate-500"}>
          Tell us in your own words and someone will work it out with you.
        </span>
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <label className="block">
        <span className="text-sm font-semibold text-slate-900">
          What did you have in mind?
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={1000}
          autoFocus
          placeholder="Two tiers, ivory sugar roses rather than printed ones, and my daughter's name on top."
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          A better number to reach you — optional
        </span>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          inputMode="numeric"
          autoComplete="tel"
          placeholder="Otherwise we use the one you signed in with"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
        />
      </label>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="rounded-lg bg-cf-purple-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send this to us"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-sm text-slate-500"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
