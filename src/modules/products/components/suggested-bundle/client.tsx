"use client"

import { useState } from "react"
import Image from "next/image"
import { addToCart } from "@modules/cart/actions"

export type BundleItem = {
  type: string
  typeEmoji: string
  title: string
  thumbnail: string | null
  variantId: string
  price: string
}

type Props = {
  occasionLabel: string
  occasionEmoji: string
  items: BundleItem[]
}

export default function SuggestedBundleClient({
  occasionLabel,
  occasionEmoji,
  items,
}: Props) {
  const [status, setStatus] = useState<"idle" | "adding" | "done">("idle")

  if (items.length < 2) return null

  const handleAddBundle = async () => {
    setStatus("adding")
    for (const item of items) {
      await addToCart({ variantId: item.variantId, quantity: 1 })
    }
    setStatus("done")
    setTimeout(() => setStatus("idle"), 3000)
  }

  return (
    <div className="content-container py-8">
      <div className="rounded-2xl bg-gradient-to-r from-cf-orange/5 via-cf-warm to-cf-pink/5 border border-cf-orange/10 p-6 small:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-3xl">{occasionEmoji}</span>
          <h3 className="cf-heading text-xl small:text-2xl mt-2">
            {occasionLabel}{" "}
            <span className="gradient-cf-text">Bundle</span>
          </h3>
          <p className="text-sm text-ui-fg-muted mt-1">
            Everything you need in one click
          </p>
        </div>

        {/* Bundle items */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {items.map((item, i) => (
            <div key={item.variantId} className="flex items-center gap-3">
              {i > 0 && (
                <span className="text-cf-orange font-bold text-lg">+</span>
              )}
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-ui-border-base">
                <div className="w-10 h-10 rounded-lg bg-grey-10 overflow-hidden shrink-0">
                  {item.thumbnail && (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-ui-fg-muted flex items-center gap-1">
                    {item.typeEmoji} {item.type}
                  </span>
                  <span className="text-sm font-medium text-grey-80 truncate max-w-[120px]">
                    {item.title}
                  </span>
                  <span className="text-xs text-ui-fg-muted">{item.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <button
            onClick={handleAddBundle}
            disabled={status === "adding"}
            className="btn-cf-primary !px-8 !py-3 text-base disabled:opacity-60"
          >
            {status === "idle" &&
              `🛒 Add Bundle (${items.length} items) to Cart`}
            {status === "adding" && "Adding..."}
            {status === "done" && "✓ Bundle Added!"}
          </button>
        </div>

        {status === "done" && (
          <p className="text-center text-xs text-ui-fg-muted mt-3">
            Bundle added! You can customize individual items in your cart.
          </p>
        )}
      </div>
    </div>
  )
}
