"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { analyticsEnabled, updateConsent } from "@lib/analytics"
import {
  consentStateFor,
  readStoredConsent,
  storeConsent,
  type ConsentChoice,
} from "@lib/analytics/consent"

/**
 * The consent notice.
 *
 * ── Why it exists at all ────────────────────────────────────────────────────────────────────────
 * Not decoration, and not copied from a European template. GA4 with analytics storage granted writes
 * a persistent first-party identifier; under the DPDP Act 2023 that is personal data, and it needs
 * notice and a real choice. Until someone chooses, consent mode keeps every storage type denied, so
 * this banner is the only thing standing between "cookieless pings" and "an identifier on disk".
 *
 * ── Why Decline is a real button and not a link in the small print ──────────────────────────────
 * A choice that is materially harder to refuse than to accept is not consent. Both buttons are the
 * same size, same prominence, one click each. Declining is also fully functional: consent mode keeps
 * sending cookieless pings, so the site still works and traffic is still counted in aggregate.
 *
 * ── Why it renders nothing until mounted ────────────────────────────────────────────────────────
 * The decision lives in localStorage, which the server cannot read. Rendering the banner during SSR
 * would flash it at every returning visitor who already answered, and rendering it conditionally on
 * a value the server does not have is a hydration mismatch. So: nothing until mounted, then decide.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!analyticsEnabled) return
    if (readStoredConsent() === null) setVisible(true)
  }, [])

  const choose = (choice: ConsentChoice) => {
    storeConsent(choice)
    updateConsent(consentStateFor(choice))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      /* Above the sticky product actions bar, which sits at z-40 — otherwise the banner is hidden
         behind Add to Cart on exactly the pages people land on most. */
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] small:p-5"
    >
      <div className="content-container flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
        <p className="text-sm text-gray-700">
          We use cookies to understand how people use CrossFriend so we can make it better. Nothing
          is stored until you choose.{" "}
          <Link
            href="/privacy-policy"
            className="font-medium text-gray-900 underline underline-offset-2 hover:text-gray-600"
          >
            Privacy Policy
          </Link>
        </p>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 small:flex-none"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 small:flex-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
