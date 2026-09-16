import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * The customer's celebration credit.
 *
 * ── Read on the server, always ─────────────────────────────────────────────────────────────────
 * The sign-in token is httpOnly precisely so no script on the page can read it, which means the
 * browser cannot ask the backend about a wallet on its own. Every call here happens server-side and
 * forwards the token as a bearer — the same arrangement every other authenticated read in this app
 * uses.
 */

export interface WalletEntry {
  id: string
  type:
    | "promo_grant"
    | "referral_earn"
    | "cashback_earn"
    | "manual_grant"
    | "redemption"
    | "reversal"
    | "expiry"
  amountPaise: number
  at: string
  expiresAt: string | null
}

export interface Wallet {
  balancePaise: number
  expiring: { amountPaise: number; expiresAt: string }[]
  entries: WalletEntry[]
}

async function authHeaders(): Promise<Record<string, string> | null> {
  const token = cookies().get("_medusa_jwt")?.value
  if (!token) return null
  return { "Content-Type": "application/json", authorization: `Bearer ${token}` }
}

/**
 * Returns null when signed out, and null when anything goes wrong.
 *
 * Deliberately not an empty wallet in the failure case. A backend that is briefly unreachable must
 * not render as "you have ₹0" — a customer who has credit and is shown zero will conclude it was
 * taken from them, and that is a support conversation and a trust problem rather than a blank space.
 * Null renders nothing at all.
 */
export async function getWallet(): Promise<Wallet | null> {
  const headers = await authHeaders()
  if (!headers) return null

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/wallet`, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as Wallet
  } catch {
    return null
  }
}

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

/**
 * How a movement reads to the person it happened to.
 *
 * The ledger names entries by what they are; a customer wants to know what happened. "Expired" is
 * the one that matters most: credit disappearing with no line explaining it is the single thing
 * most likely to be read as the company quietly taking money back.
 */
export function describeEntry(entry: WalletEntry): string {
  switch (entry.type) {
    case "promo_grant":
      return "Celebration credit"
    case "referral_earn":
      return "Thanks for the referral"
    case "cashback_earn":
      return "Cashback"
    case "manual_grant":
      return "Credit from our team"
    case "redemption":
      return "Used on an order"
    case "reversal":
      return entry.amountPaise > 0 ? "Credit returned" : "Credit adjusted"
    case "expiry":
      return "Expired"
    default:
      return "Adjustment"
  }
}

/** Days until an expiry, floored — "expires today" rather than "expires in 0.4 days". */
export function daysUntil(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 86400000))
}
