/**
 * Money, as a customer reads it.
 *
 * ── Why these live apart from the wallet reader ────────────────────────────────────────────────
 * They used to sit in @lib/data/wallet, next to the fetch that needs them. That module reads the
 * sign-in cookie, so it imports next/headers — which makes it a server module, and importing one
 * formatter from it into a client component fails the build with an error about a component that
 * needs next/headers. Formatting a number has nothing to do with reading a cookie, and a checkout
 * button is a client component, so the pure half lives here where either side can have it.
 */

/**
 * Rupees, Indian-grouped, with paise only when there are any — ₹100, ₹104.50, ₹40,000.
 *
 * Both decimal places or none. Formatting the amount and then parsing it back to a number, which is
 * how this first read, silently drops a trailing zero: ₹104.50 becomes ₹104.5, which looks like a
 * rounding mistake on a figure the customer is about to spend.
 */
export function rupees(paise: number): string {
  const abs = Math.abs(paise)
  const hasPaise = abs % 100 !== 0
  const value = (abs / 100).toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return `${paise < 0 ? "−" : ""}₹${value}`
}

/** Days until an expiry, floored — "expires today" rather than "expires in 0.4 days". */
export function daysUntil(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 86400000))
}
