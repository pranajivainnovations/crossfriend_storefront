"use client"

import { useEffect, useRef, useState } from "react"

import {
  designFileName,
  designShareImageUrl,
  designShareText,
  fetchDesignImageFile,
  shareDesign,
  type ShareableDesign,
} from "@lib/util/design-share"

/**
 * Share, on a design's own page.
 *
 * ── Why this page needed one ───────────────────────────────────────────────────────────────────
 * It had none. Someone who received a shared cake and opened it could look at it and nothing else —
 * the loop ran exactly one hop and stopped at the person most likely to pass it on, because they
 * are the one who already liked it enough to tap.
 *
 * The Studio's share sheet could not simply be reused: it lives inside a 2,000-line client component
 * holding the whole generator, and this page is a server component rendering one design. What is
 * shared instead is `@lib/util/design-share` — the URL rules, the file fetching, the iOS-safe call
 * order — so the two paths cannot drift on the parts that were hard to get right.
 *
 * ── Why the design is always public here ───────────────────────────────────────────────────────
 * This page only renders for a design the backend agreed to serve, and it stops serving private
 * ones. So unlike in the Studio there is no private case to handle: if this component is on screen,
 * the design has a page worth linking to.
 */
export default function DesignShareButton({
  design,
  canonicalUrl,
  occasion,
  style,
}: {
  design: { id: string; title: string; prompt?: string; imageUrl: string }
  /** Built server-side, so the button does not have to guess the canonical spelling. */
  canonicalUrl: string
  occasion?: string
  style?: string
}) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<File | null | undefined>(undefined)

  const shareable: ShareableDesign = {
    designId: design.id,
    title: design.title,
    prompt: design.prompt,
    imageUrl: design.imageUrl,
    isPublic: true,
  }

  /**
   * Fetch the card before anyone taps.
   *
   * Safari on iOS only honours `navigator.share` while it still considers itself inside the
   * originating tap, and awaiting a fetch first spends that. Here the card also has to be rendered
   * server-side on a cold cache, which is slower than the plain image the Studio prefetches — so
   * warming it on mount rather than on click is the difference between working and not.
   */
  useEffect(() => {
    let cancelled = false
    fetchDesignImageFile(shareable).then((file) => {
      if (!cancelled) fileRef.current = file
    })
    return () => {
      cancelled = true
    }
    // The design does not change for the life of this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.id])

  const onShare = async () => {
    if (busy) return
    setBusy(true)
    try {
      const outcome = await shareDesign(
        shareable,
        {
          text: designShareText(shareable, { occasion, style }),
          url: canonicalUrl,
        },
        // undefined means "not prefetched yet, go and fetch"; null means "tried and failed, share
        // without a picture rather than stalling".
        fileRef.current
      )

      if (outcome === "unsupported" || outcome === "failed") {
        await navigator.clipboard?.writeText(canonicalUrl).catch(() => {})
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onShare}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-cf-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cf-purple-700 disabled:opacity-60"
      >
        <span aria-hidden="true">📤</span>
        {busy ? "Opening…" : copied ? "Link copied" : "Share this cake"}
      </button>

      {/* Same-origin, so `download` is honoured — a cross-origin href would open the image instead
          of saving it, which on a phone is a dead end. */}
      <a
        href={designShareImageUrl(shareable) ?? design.imageUrl}
        download={designFileName(shareable)}
        className="inline-flex items-center gap-2 rounded-full border border-cf-purple-200 bg-white px-5 py-2.5 text-sm font-semibold text-cf-purple-800 transition hover:bg-cf-purple-50"
      >
        <span aria-hidden="true">📷</span>
        Save the picture
      </a>
    </div>
  )
}
