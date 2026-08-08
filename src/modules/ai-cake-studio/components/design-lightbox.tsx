"use client"

import { useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import type { GeneratedDesign } from "../types"

interface Props {
  open: boolean
  onClose: () => void
  designs: GeneratedDesign[]
  startIndex: number
  /** Enables Like/Comment/Report in the lightbox when true. Omit to hide them. */
  isLoggedIn?: boolean
}

// Dynamically import lightbox to avoid webpack SSR bundling issues
const LightboxContent = dynamic(() => import("./design-lightbox-content"), {
  ssr: false,
})

export default function DesignLightbox({ open, onClose, designs, startIndex, isLoggedIn = false }: Props) {
  // Opening the lightbox is the point a design has genuinely been *looked at*, as opposed to rendered
  // as one thumbnail in a grid the visitor scrolled past — so that's what gets counted. Each design is
  // counted once per mount, tracked here rather than in the content component so a re-render can't
  // double-count. Locally-generated designs have no server id yet and are skipped.
  const counted = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    const design = designs[startIndex]
    const id = design?.designId
    if (!id || counted.current.has(id)) return

    counted.current.add(id)
    // Fire-and-forget: nothing in the UI depends on this landing.
    void fetch(`/api/ai-studio/designs/${id}/view`, { method: "POST" }).catch(() => {})
  }, [open, startIndex, designs])

  if (!open) return null
  return (
    <LightboxContent
      open={open}
      onClose={onClose}
      designs={designs}
      startIndex={startIndex}
      isLoggedIn={isLoggedIn}
    />
  )
}
