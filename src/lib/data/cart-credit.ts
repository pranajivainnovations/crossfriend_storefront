import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9001"

/**
 * Using celebration credit on the order being placed.
 *
 * Read on the server and forwarded as a bearer, like the wallet balance — the sign-in token is
 * httpOnly precisely so nothing on the page can read it.
 */

export interface CartCredit {
  /** What could be put towards this order right now. */
  applicablePaise: number
  balancePaise: number
  /** What they would pay with no credit — after any coupon, including delivery and tax. */
  payablePaise: number
  /** What the platform will let credit cover: goods after any campaign, never delivery or tax. */
  redeemablePaise: number
  /** What is already on the order. */
  appliedPaise: number
  limitedBy: "balance" | "order" | "cap" | "nothing_to_apply"
}

/**
 * Null when signed out, and null when anything goes wrong.
 *
 * Deliberately not a zero-credit answer on failure. A customer who has ₹200 and is shown nothing will
 * place the order at full price and find out afterwards, which is a refund conversation. Null renders
 * no box at all, which is at least not a claim.
 */
export async function getCartCredit(cartId: string): Promise<CartCredit | null> {
  const token = cookies().get("_medusa_jwt")?.value
  if (!token) return null

  try {
    const res = await fetch(
      `${MEDUSA_BACKEND_URL}/store/wallet/cart?cart_id=${encodeURIComponent(cartId)}`,
      {
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    )
    if (!res.ok) return null
    return (await res.json()) as CartCredit
  } catch {
    return null
  }
}
