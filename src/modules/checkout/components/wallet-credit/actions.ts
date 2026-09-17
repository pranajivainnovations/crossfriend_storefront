"use server"

import { cookies } from "next/headers"
import { revalidateTag, revalidatePath } from "next/cache"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9001"

/**
 * Putting credit on the order, and taking it off again.
 *
 * ── Why the browser is told nothing it could act on ────────────────────────────────────────────
 * Neither action takes an amount. How much can be applied is the backend's answer, from the balance
 * and the cart it reads itself, so there is no field here that could be edited into a larger discount.
 *
 * ── Why the cart tag is revalidated on every outcome ───────────────────────────────────────────
 * Including failures. The totals may have moved even when the answer was "no" — the credit may have
 * been applied by another tab — and a checkout showing a stale total is the one thing worse than a
 * checkout showing an error.
 *
 * Only async functions are exported from this file. A plain constant exported from a "use server"
 * module becomes a server-action reference, which type-checks, builds, and then fails at render.
 */

export interface CreditActionState {
  ok: boolean
  message: string | null
}

async function post(action: "apply" | "remove"): Promise<CreditActionState> {
  const cartId = cookies().get("_medusa_cart_id")?.value
  const token = cookies().get("_medusa_jwt")?.value

  if (!cartId) return { ok: false, message: "Your cart has expired." }
  if (!token) return { ok: false, message: "Sign in to use your credit." }

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/wallet/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ cartId, action }),
      cache: "no-store",
    })

    const data = (await res.json().catch(() => ({}))) as {
      applied?: boolean
      removed?: boolean
      message?: string
      error?: string
    }

    revalidateTag("cart")
    revalidatePath("/checkout")

    if (!res.ok) {
      return { ok: false, message: data.error ?? "Could not update your credit. Please try again." }
    }

    if (action === "remove") return { ok: true, message: null }

    return data.applied
      ? { ok: true, message: null }
      : { ok: false, message: data.message ?? "There is no credit to apply to this order." }
  } catch {
    return { ok: false, message: "Could not reach us just now. Please try again." }
  }
}

export async function applyWalletCredit(): Promise<CreditActionState> {
  return post("apply")
}

export async function removeWalletCredit(): Promise<CreditActionState> {
  return post("remove")
}
