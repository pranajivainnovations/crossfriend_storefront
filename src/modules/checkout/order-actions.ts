"use server"

import { cookies } from "next/headers"
import { revalidatePath, revalidateTag } from "next/cache"

import {
  CART_COOKIE,
  confirmOrderPayment,
  placeOrderAndPay,
} from "@lib/data/orders-cart"

/**
 * Placing the order, and confirming the payment afterwards.
 *
 * ── Why these are server actions rather than a client fetch ────────────────────────────────────
 * MEDUSA_BACKEND_URL has no NEXT_PUBLIC prefix, deliberately, so the backend is not addressable
 * from the browser. It is also why no Razorpay key is built into this storefront any more: the key
 * arrives in the response to `place`, which means rotating one is an edit to the server's .env and
 * a restart, not a rebuild of two storefronts.
 *
 * Only async functions are exported from this file. A plain constant exported from a "use server"
 * module becomes a server-action reference, which type-checks, builds, and then fails at render.
 */

export interface PlaceResult {
  ok: boolean
  error?: string
  code?: string
  order?: { id: string; display_id: number; payable_paise: number }
  payment?: {
    key_id: string
    order_id: string
    amount: number
    currency: string
    name: string
    prefill: Record<string, string | undefined>
    notes: Record<string, string>
  }
}

export async function placeAndPay(address: Record<string, unknown>): Promise<PlaceResult> {
  const cartId = cookies().get(CART_COOKIE)?.value
  if (!cartId) {
    return { ok: false, error: "Your cart has expired. Please start again.", code: "no_cart" }
  }

  const result = await placeOrderAndPay({ cartId, address })
  if (!result.ok) return { ok: false, error: result.error, code: result.code }

  /**
   * The cart id can come back different.
   *
   * Signing in may have merged a guest cart into one the customer already had on another device, and
   * the surviving cart is the one they kept. Following that here means the browser stops pointing at
   * an abandoned row — guessing would leave them looking at a cart that no longer exists.
   */
  if (result.cartId && result.cartId !== cartId) {
    cookies().set(CART_COOKIE, result.cartId, {
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    })
  }

  return { ok: true, order: result.order, payment: result.payment }
}

export interface ConfirmResult {
  confirmed: boolean
  orderId?: string
  displayId?: number
  message?: string
}

/**
 * Tell the server the browser saw the payment complete.
 *
 * Optional by design — the webhook confirms the same order independently — so a failure here is
 * never reported to the customer as one. `pending` means "we have your order and are confirming
 * it", which is true, and is the sentence that stops somebody paying twice.
 */
export async function confirmPayment(input: {
  orderId: string
  razorpayOrderId: string
  razorpayPaymentId?: string
  razorpaySignature?: string
}): Promise<ConfirmResult> {
  const result = await confirmOrderPayment(input)

  /* The cart is spent either way: the order exists from the moment place succeeded. */
  cookies().set(CART_COOKIE, "", { maxAge: -1, path: "/" })
  revalidateTag("cart")
  revalidatePath("/", "layout")

  if (result.confirmed) {
    return {
      confirmed: true,
      orderId: result.order.id,
      displayId: result.order.display_id,
    }
  }
  return { confirmed: false, orderId: input.orderId, message: result.message }
}
