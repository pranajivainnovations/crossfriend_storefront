/**
 * An address the customer actually gave us, or nothing.
 *
 * ── Why this exists ────────────────────────────────────────────────────────────────────────────
 * Signing in by mobile mints a synthetic address so Medusa has something unique to key a customer
 * on — `<10 digits>@<domain>`. It cannot receive mail. Prefilling it into a form quietly makes it
 * the address an order confirmation gets sent to, which is a receipt nobody ever sees.
 *
 * ── Which domains ──────────────────────────────────────────────────────────────────────────────
 * Three, because the minted domain has changed twice and accounts created under each are still
 * live: `pranajiva.in` (the original, and where every registered customer today sits),
 * `crossfriend.in` (the current one), and `mobile.invalid` (used by the OTP flow). Matching only
 * the newest would let older customers keep having an unreachable address prefilled for them.
 *
 * ── Note on the version this replaces ──────────────────────────────────────────────────────────
 * The regex in the old checkout was `/^d{10}@(crossfriend.in|pranajiva.in)$/i` — `d{10}` matches ten
 * literal letter "d"s rather than ten digits, so it never matched a real synthetic address and the
 * function returned every email as though it were genuine. The bug was invisible precisely because
 * the failure mode is "a form field looks filled in".
 */
const SYNTHETIC = /^\d{10}@(?:crossfriend\.in|pranajiva\.in|mobile\.invalid)$/i

export function realEmail(email: string | null | undefined): string | null {
  if (!email) return null
  return SYNTHETIC.test(email.trim()) ? null : email
}
