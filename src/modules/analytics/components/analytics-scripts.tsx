import Script from "next/script"

import { GA_MEASUREMENT_ID, analyticsEnabled } from "@lib/analytics"
import { CONSENT_DENIED, CONSENT_STORAGE_KEY } from "@lib/analytics/consent"

/**
 * The gtag.js bootstrap.
 *
 * ── Ordering is the whole trick ─────────────────────────────────────────────────────────────────
 * The consent default must be in the dataLayer *before* gtag.js executes. If the tag loads first it
 * has already applied its own defaults — storage granted — and written the _ga cookie before the
 * visitor has seen the banner, which is precisely the thing consent mode exists to prevent. Setting
 * it afterwards is too late; the cookie is on disk.
 *
 * So this renders two scripts in a fixed order:
 *   1. `beforeInteractive` — creates dataLayer, denies every storage type, then re-reads any stored
 *      decision and upgrades before the tag arrives.
 *   2. `afterInteractive` — gtag.js itself, which drains the queue it finds.
 *
 * Step 1 reads localStorage inline rather than waiting for React to hydrate, because a returning
 * visitor who already accepted should have a fully-consented first page view, not one downgraded to
 * a cookieless ping while the banner component mounts.
 *
 * ── Why send_page_view is off ───────────────────────────────────────────────────────────────────
 * The App Router navigates without a document load, so gtag's automatic page view fires once on the
 * first paint and never again. PageViewTracker sends them on every route change instead; leaving the
 * automatic one on would double-count the landing page of every session.
 */
export default function AnalyticsScripts() {
  if (!analyticsEnabled) return null

  const bootstrap = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('consent', 'default', ${JSON.stringify(CONSENT_DENIED)});
try {
  if (window.localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)}) === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted', functionality_storage: 'granted' });
  }
} catch (e) {}
gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)}, { send_page_view: false });
`.trim()

  return (
    <>
      <Script id="ga-consent-bootstrap" strategy="beforeInteractive">
        {bootstrap}
      </Script>
      <Script
        id="ga-tag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
    </>
  )
}
