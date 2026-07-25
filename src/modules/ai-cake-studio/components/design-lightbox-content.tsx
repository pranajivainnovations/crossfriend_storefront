"use client"

import { useState } from "react"
import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Download from "yet-another-react-lightbox/plugins/download"
import "yet-another-react-lightbox/styles.css"

import type { GeneratedDesign } from "../types"

interface Props {
  open: boolean
  onClose: () => void
  designs: GeneratedDesign[]
  startIndex: number
}

export default function DesignLightboxContent({ open, onClose, designs, startIndex }: Props) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)

  const slides = designs.map((d) => ({
    src: d.imageUrl || "",
    alt: d.title || "AI Cake Design",
  }))

  if (slides.length === 0) return null

  const currentDesign = designs[currentIndex] || designs[0]

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={startIndex}
      slides={slides}
      plugins={[Zoom, Download]}
      on={{
        view: ({ index }) => setCurrentIndex(index),
      }}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      carousel={{
        finite: true,
      }}
      controller={{
        closeOnBackdropClick: true,
      }}
      styles={{
        container: { backgroundColor: "rgba(0, 0, 0, 0.92)" },
      }}
      render={{
        slideHeader: () => (
          <div className="absolute top-4 left-4 z-10 max-w-[70%]">
            <p className="text-sm font-semibold text-white/90 drop-shadow-md">
              {currentDesign.title}
            </p>
            {currentDesign.description && (
              <p className="mt-0.5 text-xs text-white/60 drop-shadow">
                {currentDesign.description}
              </p>
            )}
          </div>
        ),
      }}
    />
  )
}
