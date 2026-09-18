import { cookies } from "next/headers"

import { PINCODE_COOKIE } from "@lib/pincode-capture"

/* Re-exported so every existing importer keeps working. The definitions live in @lib/money because
   this module reads a cookie and is therefore server-only, while formatting a number is not. */
export { rupees, daysUntil } from "@lib/money"

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

export interface WalletSource {
  /** The ledger's own name for how it was earned; the card decides what to call it. */
  type: string
  /** What is LEFT of that kind, not what was ever given. */
  amountPaise: number
}

export interface LadderStep {
  amountPaise: number
  /** Already paid into the wallet. */
  unlocked: boolean
}

/**
 * What is still to be earned, and whether it is real for this customer.
 *
 * ── Why this is not a constant in the component ────────────────────────────────────────────────
 * The card used to say "₹200 is waiting for you" from a string. All three numbers behind that
 * sentence move without the storefront knowing: the two grant amounts are operator settings, the
 * offer runs only in named pincodes — one, as things stand — and it needs an order above a minimum.
 * So for most people the honest figure was never ₹200, and for everybody it was a guess.
 *
 * The backend now answers it per customer and per area, from the same evaluation the payout itself
 * runs. `running` false with a `blocked` reason is a normal answer, not an error.
 */
export interface GrantLadder {
  running: boolean
  blocked: "no_pincode" | "not_in_area" | "unavailable" | "not_configured" | null
  steps: LadderStep[]
  totalPaise: number
  /** What is left to earn — the figure worth putting in front of somebody. */
  remainingPaise: number
  minOrderPaise: number
  unlockedCount: number
}

export interface Wallet {
  balancePaise: number
  /** The balance broken into what it is made of. Absent from an older backend. */
  sources?: WalletSource[]
  expiring: { amountPaise: number; expiresAt: string }[]
  entries: WalletEntry[]
  /** Null from an older backend, and null when the offer could not be evaluated. */
  ladder?: GrantLadder | null
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

  /* Whatever they have told us, from wherever they told us — the prompt on arrival, the bar, the
     studio, or a delivery address. It decides only what the screen may promise; every payout reads
     the address on the order instead. */
  const pincode = cookies().get(PINCODE_COOKIE)?.value ?? ""
  const query = pincode ? `?pincode=${encodeURIComponent(pincode)}` : ""

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/wallet${query}`, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as Wallet
  } catch {
    return null
  }
}

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
