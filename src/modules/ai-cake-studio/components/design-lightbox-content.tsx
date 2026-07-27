"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Download from "yet-another-react-lightbox/plugins/download"
import "yet-another-react-lightbox/styles.css"

import type { GeneratedDesign } from "../types"
import CommentSection from "./comment-section"
import ReportButton from "./report-button"

interface Props {
  open: boolean
  onClose: () => void
  designs: GeneratedDesign[]
  startIndex: number
  isLoggedIn: boolean
}

export default function DesignLightboxContent({ open, onClose, designs, startIndex, isLoggedIn }: Props) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)

  const slides = designs.map((d) => ({
    src: d.imageUrl || "",
    alt: d.title || "AI Cake Design",
  }))

  if (slides.length === 0) return null

  const currentDesign = designs[currentIndex] || designs[0]

  return (
    <>
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

      {/*
        Rendered through its own portal to document.body rather than via
        the library's slideFooter render prop — the library's own slide
        container has `overflow: hidden`, and slideFooter content gets
        clipped by it. The library's fullscreen overlay itself works around
        this the same way: a real portal to <body>, escaping all ancestor
        stacking/overflow context. z-[10000] sits above the library's own
        portal (z-index 9999 — see yet-another-react-lightbox/dist/styles.css).
      */}
      {open &&
        currentDesign?.id &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed bottom-4 left-1/2 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl bg-gradient-to-t from-black/90 via-black/80 to-black/60 px-4 pb-4 pt-3 backdrop-blur-sm"
            style={{ zIndex: 2147483647 }}
          >
            <div className="mb-2 flex justify-end">
              <ReportButton designId={currentDesign.id} isLoggedIn={isLoggedIn} />
            </div>
            <CommentSection designId={currentDesign.id} isLoggedIn={isLoggedIn} />
          </div>,
          document.body
        )}
    </>
  )
}
