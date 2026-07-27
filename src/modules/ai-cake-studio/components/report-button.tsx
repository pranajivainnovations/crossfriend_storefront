"use client"

import { useState } from "react"

interface Props {
  designId: string
  isLoggedIn: boolean
}

/**
 * Small flag control for the currently-viewed design in the lightbox.
 * Requires login (same as like/comment) — hidden entirely for guests
 * rather than showing a login prompt, since reporting isn't a primary
 * conversion action worth interrupting a guest for.
 */
export default function ReportButton({ designId, isLoggedIn }: Props) {
  const [status, setStatus] = useState<"idle" | "confirming" | "sent">("idle")

  if (!isLoggedIn) return null

  const handleReport = async () => {
    try {
      await fetch(`/api/ai-studio/designs/${designId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    } catch {
      // Reporting is best-effort — no need to surface a network error here
    }
    setStatus("sent")
  }

  if (status === "sent") {
    return <span className="text-[10px] text-white/40">Reported</span>
  }

  if (status === "confirming") {
    return (
      <span className="flex items-center gap-2 text-[10px] text-white/60">
        Report this design?
        <button type="button" onClick={handleReport} className="font-bold text-rose-300">
          Yes
        </button>
        <button type="button" onClick={() => setStatus("idle")} className="text-white/50">
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setStatus("confirming")}
      className="text-[10px] text-white/40 transition hover:text-white/70"
    >
      🚩 Report
    </button>
  )
}
