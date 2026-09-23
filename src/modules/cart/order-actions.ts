"use server"

import { cookies } from "next/headers"
import { revalidatePath, revalidateTag } from "next/cache"

import {
  CART_COOKIE,
  getOrderCart,
  setOrderCartCredit,
  setOrderCartItemQty,
  type OrderCart,
} from "@lib/data/orders-cart"

/**
 * What the cart page can do.
 *
 * ── Why each returns the cart ──────────────────────────────────────────────────────────────────
 * The backend answers every write with the whole cart, totals included, so nothing here needs a
 * follow-up read. At roughly 350ms a round trip, "now fetch it again to redraw the total" is
 * latency the customer pays for nothing.
 *
 * Only async functions are exported from this file. A plain constant exported from a "use server"
 * module becomes a server-action reference, which type-checks, builds, and then fails at render.
 */

export interface CartActionState {
  cart: OrderCart | null
  error: string | null
}

export async function changeQuantity(itemId: string, qty: number): Promise<CartActionState> {
  const cartId = cookies().get(CART_COOKIE)?.value
  if (!cartId) return { cart: null, error: "Your cart has expired. Please start again." }

  const { cart, error } = await setOrderCartItemQty({ cartId, itemId, qty })

  revalidateTag("cart")
  revalidatePath("/cart")
  return { cart, error: error ?? null }
}

export async function removeLine(itemId: string): Promise<CartActionState> {
  return changeQuantity(itemId, 0)
}

/**
 * Put wallet credit on the order, or take it off.
 *
 * Neither takes an amount. How much can be applied is the backend's answer, from the balance and
 * the cart it reads itself — there is no field here a modified page could use to choose a larger
 * discount, which is the same reasoning that keeps the redemption cap on the server.
 */
export async function applyCredit(): Promise<CartActionState> {
  return credit("apply")
}

export async function removeCredit(): Promise<CartActionState> {
  return credit("remove")
}

async function credit(action: "apply" | "remove"): Promise<CartActionState> {
  const cartId = cookies().get(CART_COOKIE)?.value
  if (!cartId) return { cart: null, error: "Your cart has expired. Please start again." }

  const { cart, error } = await setOrderCartCredit({ cartId, action })

  revalidateTag("cart")
  revalidatePath("/cart")
  return { cart, error: error ?? null }
}

/** Read for a client component that needs to refresh itself after something else changed. */
export async function refreshCart(): Promise<OrderCart | null> {
  return getOrderCart()
}
