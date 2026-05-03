"use client"

import { useEffect, useState } from "react"
import { isSameDayAvailable, cutoffCountdownText } from "@lib/util/delivery-utils"

export default function CakeUrgencyBadge() {
  const [text, setText] = useState("")
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    const update = () => {
      const sameDay = isSameDayAvailable()
      setAvailable(sameDay)
      if (sameDay) {
        setText(cutoffCountdownText() ?? "")
      } else {
        setText("Order now for delivery tomorrow")
      }
    }
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!text) return null

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
        available
          ? "bg-cf-orange/10 text-cf-orange"
          : "bg-grey-10 text-ui-fg-muted"
      }`}
    >
      <span className="text-base">{available ? "⏰" : "📅"}</span>
      <span className="font-medium">{text}</span>
      {available && (
        <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold opacity-70">
          Same-day
        </span>
      )}
    </div>
  )
}
