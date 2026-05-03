"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { addToCart } from "@modules/cart/actions"

export default function QuickAddButton({
  variantId,
}: {
  variantId: string
}) {
  const [state, setState] = useState<"idle" | "adding" | "done">("idle")

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault() // prevent navigating to PDP
    e.stopPropagation()
    setState("adding")
    try {
      await addToCart({ variantId, quantity: 1 })
      setState("done")
      setTimeout(() => setState("idle"), 1500)
    } catch {
      setState("idle")
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={state === "adding"}
      animate={state === "done" ? { scale: [1, 1.12, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={`block w-full text-center py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${
        state === "done"
          ? "bg-green-500 text-white"
          : "bg-cf-orange text-white hover:bg-cf-orange-dark"
      }`}
    >
      {state === "idle" && "Quick Add +"}
      {state === "adding" && "Adding..."}
      {state === "done" && "✓ Added"}
    </motion.button>
  )
}
