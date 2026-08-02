"use server"

import { cookies } from "next/headers"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { getOrSetCart } from "@modules/cart/actions"

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

export interface OrderAiCakePayload {
  weight: string
  tiers: string
  shape: string
  style: string
  flavor: string
  expressDelivery: boolean
  midnightDelivery: boolean
  cakeMessage: string
  pincode: string
  bakerId: string
  designImageUrl?: string
  compiledPrompt?: string
}

/**
 * Adds the customer's AI-designed cake to their real cart (same `_medusa_cart_id` cookie the rest of
 * the storefront's cart/checkout pages already read), priced authoritatively by the backend pricing
 * engine — never a client-computed number. On success, redirects straight into the existing checkout
 * flow (address/shipping/payment), which needs no changes: the `manual` payment provider (Cash on
 * Delivery) is already enabled on the India region and already selectable there.
 */
export async function orderAiCake(
  payload: OrderAiCakePayload
): Promise<{ error: string } | undefined> {
  const token = cookies().get("_medusa_jwt")?.value
  if (!token) {
    return { error: "Please log in to place an order." }
  }

  const cart = await getOrSetCart()
  if (!cart) {
    return { error: "Could not start your cart. Please try again." }
  }

  let backendRes: Response
  try {
    backendRes = await fetch(`${MEDUSA_BACKEND_URL}/store/ai-studio/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cartId: cart.id, ...payload }),
      cache: "no-store",
    })
  } catch (error) {
    console.error("[ai-cake-studio] Failed to reach Medusa backend", error)
    return { error: "Network error. Please try again." }
  }

  if (!backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}))
    return { error: data.error || "Something went wrong adding this cake to your cart. Please try again." }
  }

  revalidateTag("cart")
  redirect("/cart")
}
