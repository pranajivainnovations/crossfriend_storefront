"use client"

import { useState } from "react"

/**
 * Opt-in publishing for a generated design.
 *
 * Designs are private now (see migration 1723200000000) because their prompts routinely name the
 * recipient and the occasion — "Happy birthday Priya" was going into a public gallery the moment it
 * was generated, which is a poor showing for a surprise cake. This is how a customer chooses to share
 * one anyway.
 *
 * Deliberately states what sharing exposes. "Share" alone doesn't tell anyone that the prompt travels
 * with the image, and the prompt is the part carrying the personal detail.
 */
export default function ShareToCommunityToggle({
  designId,
  initialIsPublic = false,
}: {
  /** Server-side design id. Locally-generated designs that haven't been persisted have none. */
  designId?: string
  initialIsPublic?: boolean
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!designId) return null

  const toggle = async () => {
    if (saving) return
    const next = !isPublic
    setSaving(true)
    setError(null)
    // Optimistic — this is a low-stakes preference and the round trip is slow enough to feel broken
    // otherwise. Reverted below if the server disagrees.
    setIsPublic(next)

    try {
      const res = await fetch(`/api/ai-studio/designs/${designId}/visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Could not update this design.")
      }
    } catch (e) {
      setIsPublic(!next)
      setError(e instanceof Error ? e.message : "Could not update this design.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        aria-pressed={isPublic}
        className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left transition disabled:opacity-60 ${
          isPublic
            ? "border-emerald-200 bg-emerald-50"
            : "border-slate-200 bg-white hover:border-cf-purple-300"
        }`}
      >
        <span
          className={`mt-0.5 flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition ${
            isPublic ? "bg-emerald-500" : "bg-slate-300"
          }`}
        >
          <span
            className={`h-3 w-3 rounded-full bg-white transition-transform ${
              isPublic ? "translate-x-3" : "translate-x-0"
            }`}
          />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-bold text-slate-800">
            {isPublic ? "Shared with the community" : "Share to community gallery"}
          </span>
          <span className="block text-[10px] leading-snug text-slate-500">
            {isPublic
              ? "Anyone can see this design and the prompt behind it."
              : "Private to you. Sharing also shows the prompt, including any name in it."}
          </span>
        </span>
      </button>
      {error && <p className="mt-1 text-[10px] font-medium text-red-500">{error}</p>}
    </div>
  )
}
