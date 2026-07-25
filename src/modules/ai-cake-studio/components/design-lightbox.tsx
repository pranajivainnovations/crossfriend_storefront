"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import type { GeneratedDesign } from "../types"

interface Props {
  open: boolean
  onClose: () => void
  designs: GeneratedDesign[]
  startIndex: number
}

// Dynamically import lightbox to avoid webpack SSR bundling issues
const LightboxContent = dynamic(() => import("./design-lightbox-content"), {
  ssr: false,
})

export default function DesignLightbox({ open, onClose, designs, startIndex }: Props) {
  if (!open) return null
  return <LightboxContent open={open} onClose={onClose} designs={designs} startIndex={startIndex} />
}
