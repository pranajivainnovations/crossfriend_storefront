/**
 * The one way this storefront reports an analytics event.
 *
 * Every call site imports `track` from here and never touches `window.gtag` directly. That is the
 * whole point of the indirection: swapping GA4 for something else, or adding a second destination,
 * becomes a change to this file rather than to thirty components — and no component has to know
 * whether analytics is configured, consented to, or loaded yet.
 *
 * Nothing here throws. An analytics failure must never break a checkout.
 */

import type { ConsentState } from "./consent"

/** Set in the environment. Absent in development and in any deploy that has not been given one. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || ""

/**
 * Analytics is off unless a measurement ID is configured.
 *
 * This is what keeps local development and preview builds out of production reporting: no ID, no
 * script tag, no events, no banner. It fails closed rather than polluting the property with test
 * orders — which is far harder to undo than to prevent.
 */
export const analyticsEnabled = Boolean(GA_MEASUREMENT_ID)

type GtagArgs =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?]
  | ["consent", "default" | "update", Partial<ConsentState>]
  | ["set", Record<string, unknown>]

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: GtagArgs) => void
  }
}

/**
 * Push to the dataLayer rather than calling window.gtag.
 *
 * gtag.js defines `window.gtag` only once it has loaded. Events fired before that — and on a slow
 * connection the first add-to-cart genuinely can beat the script — would be dropped. The dataLayer
 * array is created by the bootstrap snippet before anything else runs and is drained by gtag.js when
 * it arrives, so an early event is queued instead of lost.
 */
function push(...args: GtagArgs): void {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(args)
}

/** A GA4 item, as the ecommerce events expect it. */
export interface AnalyticsItem {
  item_id: string
  item_name: string
  item_brand?: string
  item_category?: string
  item_variant?: string
  item_list_name?: string
  price?: number
  quantity?: number
  index?: number
}

export interface EcommercePayload {
  currency?: string
  value?: number
  items?: AnalyticsItem[]
  [key: string]: unknown
}

/**
 * Report an event.
 *
 * Safe to call from anywhere, at any time: before consent, before the script loads, during SSR, or
 * in a deploy with no measurement ID. In each of those cases it does nothing rather than failing.
 */
export function track(name: string, params: EcommercePayload = {}): void {
  if (!analyticsEnabled) return
  try {
    push("event", name, params)
  } catch {
    // Deliberately silent. An exception here would surface as a broken button on a page where the
    // user was trying to buy something.
  }
}

/** Apply a consent decision to the already-loaded tag. */
export function updateConsent(state: ConsentState): void {
  if (!analyticsEnabled) return
  try {
    push("consent", "update", state)
  } catch {
    /* see track() */
  }
}

/**
 * Report a page view.
 *
 * Sent manually because the App Router navigates on the client without a document load, so gtag's
 * automatic `page_view` fires once and then never again for the rest of the session.
 */
export function trackPageView(url: string, title?: string): void {
  if (!analyticsEnabled) return
  try {
    push("event", "page_view", {
      page_location: url,
      page_path: url,
      ...(title ? { page_title: title } : {}),
    })
  } catch {
    /* see track() */
  }
}
