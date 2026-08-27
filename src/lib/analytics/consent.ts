/**
 * Consent state for Google Consent Mode v2.
 *
 * ── Why consent mode rather than "load GA only after Accept" ────────────────────────────────────
 * The naive pattern — withhold gtag.js until someone clicks Accept — loses every visitor who never
 * touches the banner, which is most of them. Consent Mode instead loads the tag immediately with
 * every storage type *denied*, so it sets no cookies and stores no identifiers, and sends cookieless
 * pings that GA4 models into aggregate traffic. When consent is granted the same tag upgrades in
 * place. Nothing personal is stored before the click; the traffic is still counted.
 *
 * ── Why this is a real obligation and not theatre ───────────────────────────────────────────────
 * GA4 with `analytics_storage: granted` writes a first-party identifier (_ga) that persists across
 * visits. Under the DPDP Act 2023 that is personal data being processed, and it needs notice and
 * consent. That is the whole reason the cookie banner ships with this change rather than separately:
 * installing the tag is what creates the obligation.
 */

/** Google's Consent Mode v2 signals. All seven, so nothing is left at an implicit default. */
export interface ConsentState {
  analytics_storage: "granted" | "denied"
  ad_storage: "granted" | "denied"
  ad_user_data: "granted" | "denied"
  ad_personalization: "granted" | "denied"
  functionality_storage: "granted" | "denied"
  personalization_storage: "granted" | "denied"
  /** Never gated: it covers CSRF tokens and auth, which the site cannot function without. */
  security_storage: "granted"
}

/**
 * Versioned, so that widening what we collect can re-ask rather than silently inheriting a decision
 * someone made about a narrower question. Bump this only when the *scope* changes — never for a
 * copy tweak, or everyone gets re-prompted for nothing.
 */
export const CONSENT_STORAGE_KEY = "cf_consent_v1"

export const CONSENT_DENIED: ConsentState = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted",
}

/**
 * What "Accept" grants.
 *
 * Advertising signals stay denied even on Accept, because CrossFriend runs no ad platform today.
 * Granting a permission nothing uses would be collecting data with no purpose, which is exactly what
 * the law is about — and switching them on later is a one-line change plus a consent-version bump,
 * which is the honest way to do it.
 */
export const CONSENT_GRANTED: ConsentState = {
  ...CONSENT_DENIED,
  analytics_storage: "granted",
  functionality_storage: "granted",
}

export type ConsentChoice = "granted" | "denied"

/** The stored decision, or null when the visitor has not answered yet. */
export function readStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return value === "granted" || value === "denied" ? value : null
  } catch {
    // Private browsing and hardened settings throw on localStorage access. An unreadable store is
    // indistinguishable from "not asked", which is the safe reading — it keeps consent denied.
    return null
  }
}

export function storeConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice)
  } catch {
    // Nothing to do: the choice applies for this page view either way, and the banner will simply
    // ask again next time rather than assuming an answer it could not record.
  }
}

export function consentStateFor(choice: ConsentChoice): ConsentState {
  return choice === "granted" ? CONSENT_GRANTED : CONSENT_DENIED
}
