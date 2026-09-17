import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9001"

/**
 * The customer's own referral code.
 *
 * Read on the server and forwarded as a bearer, like the wallet — the sign-in token is httpOnly, so
 * the browser cannot ask the backend anything about the customer by itself.
 */

export type RefereeState = "joined" | "holding" | "paid"

export interface RefereeStanding {
  joinedAt: string
  state: RefereeState
  earnedPaise: number
  ordersHolding: number
  ordersPaid: number
}

export interface ReferralStanding {
  joined: number
  ordered: number
  earnedPaise: number
  /** Deliveries whose return window has not closed — a count, never a provisional amount. */
  holdingOrders: number
  referees: RefereeStanding[]
}

export interface Referral {
  code: string
  /** Whether this customer arrived through somebody else's link. */
  wasReferred: boolean
  standing: ReferralStanding
}

/**
 * Null when signed out, and null when anything goes wrong.
 *
 * A failed read renders no card at all rather than an empty one. A referral code that appears blank
 * or, worse, different from the one a customer shared yesterday would make them wonder which of the
 * two is real — and a code is a thing people paste into messages and keep.
 */
export async function getReferral(): Promise<Referral | null> {
  const token = cookies().get("_medusa_jwt")?.value
  if (!token) return null

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/referral`, {
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null

    const data = (await res.json()) as Partial<Referral>
    /* A response without a code is not a referral card, however successful its status was. */
    if (typeof data.code !== "string" || !data.code) return null

    return {
      code: data.code,
      wasReferred: data.wasReferred === true,
      /* An older backend that does not send a standing still renders a working share card, rather
         than a card that throws on the first read of an absent field. */
      standing: data.standing ?? {
        joined: 0,
        ordered: 0,
        earnedPaise: 0,
        holdingOrders: 0,
        referees: [],
      },
    }
  } catch {
    return null
  }
}
