"use client"

import { useEffect, useState } from "react"
import { cutoffCountdownText, isSameDayAvailable } from "@lib/util/delivery-utils"

/**
 * UrgencyBanner — Shows same-day delivery countdown for cakes.
 * Automatically hides when cutoff has passed.
 * Reusable on homepage + cake product pages.
 */
export default function UrgencyBanner({ className = "" }: { className?: string }) {
  const [text, setText] = useState<string | null>(null)
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    function update() {
      const isAvail = isSameDayAvailable()
      setAvailable(isAvail)
      if (isAvail) {
        setText(cutoffCountdownText())
      } else {
        setText(null)
      }
    }

    update()
    // Update every minute
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!available || !text) {
    return null
  }

  return (
    <div className={`banner-urgency justify-center ${className}`}>
      <span className="text-lg">🎂</span>
      <span>Order now — {text}</span>
      <span className="text-lg">⏰</span>
    </div>
  )
}
