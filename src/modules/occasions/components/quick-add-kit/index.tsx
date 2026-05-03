"use client"

import { useState } from "react"
import type { OccasionCollection } from "@lib/types/product-contract"
import { OCCASION_KITS } from "@lib/constants"
import { addKitToCart } from "@modules/occasions/actions"

export default function QuickAddKit({
  occasion,
}: {
  occasion: OccasionCollection
}) {
  const kit = OCCASION_KITS[occasion]
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  )

  const handleAdd = async () => {
    setStatus("loading")
    try {
      const result = await addKitToCart(occasion)
      if (result?.error) {
        setStatus("error")
      } else {
        setStatus("done")
        setTimeout(() => setStatus("idle"), 3000)
      }
    } catch {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  return (
    <div className="content-container py-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cf-orange/10 via-cf-warm to-cf-pink/10 border border-cf-orange/20 p-6 small:p-8">
        <div className="flex flex-col small:flex-row items-center gap-4 small:gap-8">
          {/* Info */}
          <div className="flex-1 text-center small:text-left">
            <div className="flex items-center gap-2 justify-center small:justify-start mb-2">
              <span className="text-3xl">{kit.emoji}</span>
              <h3 className="cf-heading text-xl small:text-2xl">
                Quick Add {kit.label}
              </h3>
            </div>
            <p className="text-sm text-ui-fg-muted mb-3">{kit.description}</p>
            <div className="flex flex-wrap gap-2 justify-center small:justify-start">
              {kit.items.map((item) => (
                <span
                  key={item.type}
                  className="chip-cf text-xs"
                >
                  {item.label} ×{item.quantity}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleAdd}
            disabled={status === "loading"}
            className="btn-cf-primary whitespace-nowrap !px-8 !py-3 text-base disabled:opacity-60"
          >
            {status === "idle" && "🛒 Add Kit to Cart"}
            {status === "loading" && "Adding..."}
            {status === "done" && "✓ Added!"}
            {status === "error" && "Try Again"}
          </button>
        </div>

        {status === "done" && (
          <p className="text-center text-xs text-ui-fg-muted mt-3">
            Kit added! You can customize items in your cart.
          </p>
        )}
      </div>
    </div>
  )
}
