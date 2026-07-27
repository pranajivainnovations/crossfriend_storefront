"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

interface PromptRevealProps {
  /** The exact compiled prompt sent to the image provider. Renders nothing if absent
   * (e.g. designs generated before this feature shipped have none to show). */
  prompt?: string
  /** Compact styling for tight card layouts (gallery cards) vs a roomier lightbox/results panel. */
  compact?: boolean
  /** "dark" matches the lightbox's translucent dark-glass overlay (see report-button.tsx/comment-section.tsx there); "light" (default) matches the rest of the app's white cards. */
  variant?: "light" | "dark"
}

/**
 * "View AI Prompt" toggle — reveals the exact prompt that produced a design
 * so visitors can copy it and reuse it in other tools. This is deliberately
 * public/shareable: the whole point is letting the cake studio double as a
 * prompt-engineering resource, not just an image generator.
 */
export default function PromptReveal({ prompt, compact = false, variant = "light" }: PromptRevealProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!prompt) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — nothing to recover, user can still select the text manually
    }
  }

  const isDark = variant === "dark"

  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={`w-full rounded-xl border transition ${
          isDark
            ? "border-white/20 bg-white/10 text-white/80 hover:bg-white/20"
            : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
        } ${compact ? "py-1.5 text-[11px] font-semibold" : "py-2 text-xs font-semibold"}`}
      >
        🔍 {open ? "Hide AI Prompt" : "View AI Prompt"}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={`mt-2 rounded-xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-violet-100 bg-violet-50/40"}`}>
              <p className={`max-h-40 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed ${isDark ? "text-white/70" : "text-slate-600"}`}>
                {prompt}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopy()
                }}
                className={`mt-2 rounded-lg px-3 py-1 text-[11px] font-semibold transition ${
                  isDark ? "bg-white text-violet-700 hover:bg-white/90" : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
              >
                {copied ? "✓ Copied!" : "📋 Copy Prompt"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
