"use client"

import { useState } from "react"
import { addToCart } from "@modules/cart/actions"

type AddOnItem = {
  productId: string
  variantId: string
  title: string
  thumbnail: string | null
  price: string
}

type Props = {
  addOns: AddOnItem[]
}

export default function AddOnSelectorClient({ addOns }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<"idle" | "adding" | "done">("idle")

  if (addOns.length === 0) return null

  const toggle = (variantId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(variantId)) next.delete(variantId)
      else next.add(variantId)
      return next
    })
  }

  const handleAddSelected = async () => {
    if (selected.size === 0) return
    setStatus("adding")
    const ids = Array.from(selected)
    for (let i = 0; i < ids.length; i++) {
      await addToCart({ variantId: ids[i], quantity: 1 })
    }
    setStatus("done")
    setSelected(new Set())
    setTimeout(() => setStatus("idle"), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎁</span>
        <h3 className="font-heading font-semibold text-base text-grey-80">
          Add-ons
        </h3>
        <span className="text-xs text-ui-fg-muted">
          Make it extra special
        </span>
      </div>

      <div className="grid grid-cols-1 small:grid-cols-2 gap-3">
        {addOns.map((item) => {
          const isChecked = selected.has(item.variantId)
          return (
            <button
              key={item.variantId}
              type="button"
              onClick={() => toggle(item.variantId)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-150 text-left ${
                isChecked
                  ? "border-cf-orange bg-cf-orange/5"
                  : "border-ui-border-base bg-white hover:border-cf-orange/40"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isChecked
                    ? "border-cf-orange bg-cf-orange"
                    : "border-grey-20"
                }`}
              >
                {isChecked && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>

              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg bg-grey-10 overflow-hidden shrink-0">
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-grey-80 truncate">
                  {item.title}
                </span>
                <span className="text-xs text-ui-fg-muted">{item.price}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Add selected CTA */}
      {selected.size > 0 && (
        <button
          onClick={handleAddSelected}
          disabled={status === "adding"}
          className="btn-cf-primary !py-2.5 text-sm"
        >
          {status === "idle" &&
            `Add ${selected.size} add-on${selected.size > 1 ? "s" : ""} to cart`}
          {status === "adding" && "Adding..."}
          {status === "done" && "✓ Added!"}
        </button>
      )}
    </div>
  )
}
