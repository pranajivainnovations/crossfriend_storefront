/**
 * Carrying a referral from the link that was clicked to the account that gets created.
 *
 * ── Why a cookie and not the URL ───────────────────────────────────────────────────────────────
 * Somebody arrives on `/?ref=ABCD2345`, reads about a cake, browses four categories, adds to a cart
 * and signs in two days later. The parameter is long gone by then. The referral has to survive all
 * of that, and a cookie is the only thing on the page that does.
 *
 * ── Why first touch is enforced here as well as in the ledger ──────────────────────────────────
 * The database refuses a second attribution, so correctness does not depend on this. What the
 * browser decides is *which* code gets offered, and a cookie that overwrites itself would quietly
 * hand the last sharer a referral the first one earned — the backend would then dutifully record the
 * last link clicked, having been told that was the first. The rule is the same in both places
 * because they are answering the same question at different moments.
 *
 * Shared by the middleware that captures and the sign-in route that spends it, so the name and the
 * lifetime cannot drift apart into a cookie that is written and never read.
 */

export const REFERRAL_COOKIE = "cf_ref"

/**
 * Thirty days, matching the sign-in cookie.
 *
 * Long enough for the ordinary path — a link shared on a Tuesday, a birthday the following month —
 * and short enough that a code sitting in a browser since last year is not still claiming credit for
 * a customer who arrived by a completely different route.
 */
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

/**
 * What arrived in the URL, reduced to something worth storing.
 *
 * Case and punctuation are stripped because people share codes inside sentences and messaging apps
 * add their own decoration. The length cap is not validation — the backend decides what is a real
 * code — it is a refusal to write an unbounded string from a query parameter into a cookie.
 *
 * Returns null for anything that survives as empty, so the caller has one thing to check.
 */
export function normaliseReferralParam(raw: string | null): string | null {
  if (!raw) return null
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16)
  return code || null
}

/**
 * The link a customer shares.
 *
 * Points at the home page rather than a dedicated /r/ route: somebody following a friend's
 * recommendation should land on the shop, and a route whose only job is to redirect to it is a hop
 * that can fail and a page that can be indexed. The parameter is picked up by the middleware on
 * whatever page it appears on, so the choice of landing page stays a marketing decision rather than
 * a technical one.
 */
export function referralLink(code: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://crossfriend.in"
  return `${base.replace(/\/$/, "")}/?ref=${code}`
}
