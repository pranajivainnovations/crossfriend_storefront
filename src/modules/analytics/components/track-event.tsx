"use client"

import { useEffect, useRef } from "react"

import { track, type EcommercePayload } from "@lib/analytics"

/**
 * Fires one event when this mounts.
 *
 * Server components cannot call `track` — it needs `window` — so a page that wants to report "this
 * was viewed" drops this in instead of being converted to a client component wholesale. That keeps
 * product and listing pages server-rendered, which is what they need to be for SEO.
 *
 * `dedupeKey` guards against React 18 Strict Mode double-invoking effects in development, and
 * against a re-render firing a second view for the same thing. Pass the id of whatever is being
 * viewed; when it genuinely changes, a new event is correct.
 */
export default function TrackEvent({
  name,
  payload,
  dedupeKey,
}: {
  name: string
  payload?: EcommercePayload
  dedupeKey?: string
}) {
  const fired = useRef<string | null>(null)

  useEffect(() => {
    const key = dedupeKey ?? name
    if (fired.current === key) return
    fired.current = key
    track(name, payload)
  }, [name, payload, dedupeKey])

  return null
}
