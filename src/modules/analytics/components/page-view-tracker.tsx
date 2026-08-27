"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

import { analyticsEnabled, trackPageView } from "@lib/analytics"

/**
 * Sends a page_view on every route change.
 *
 * The App Router swaps content on the client without a document load, so gtag's built-in page view
 * fires exactly once per session — every subsequent page would be invisible, and time-on-page would
 * be attributed entirely to whichever page someone happened to land on. `send_page_view` is off in
 * the config for that reason and this replaces it.
 *
 * Search params are included because they carry real navigation state here: /store?type=cake and
 * /store?type=hampers are different pages to a visitor, and collapsing them would hide which product
 * types people actually browse.
 *
 * The ref guards against React 18 Strict Mode running effects twice in development, which would
 * otherwise double every page view in the local dataLayer and make debugging misleading.
 */
export default function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastUrl = useRef<string | null>(null)

  useEffect(() => {
    if (!analyticsEnabled) return

    const query = searchParams?.toString()
    const url = query ? `${pathname}?${query}` : pathname
    if (!url || url === lastUrl.current) return

    lastUrl.current = url
    trackPageView(url, typeof document !== "undefined" ? document.title : undefined)
  }, [pathname, searchParams])

  return null
}
