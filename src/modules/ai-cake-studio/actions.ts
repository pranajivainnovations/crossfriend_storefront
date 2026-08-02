"use server"

import { cookies } from "next/headers"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { getOrSetCart } from "@modules/cart/actions"
import { addItem } from "@lib/data"

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

export interface CakeSelections {
  weight: string
  tiers: string
  shape: string
  style: string
  flavor: string
  occasion?: string
  expressDelivery: boolean
  midnightDelivery: boolean
  cakeMessage: string
  pincode: string
  designImageUrl?: string
  compiledPrompt?: string
}

export interface SavedAiCakeProduct {
  productId: string
  variantId: string
  total: number
  breakdown: { label: string; amount: number }[]
}

/**
 * Creates (or updates, if productId/variantId are already known) the real Medusa product + variant
 * for this design — called once the customer commits to searching for a baker, since every
 * price-determining selection is final by then. See the backend route's own comment for why this
 * point in the flow and not Generate or "Use this design" (both far too early — most generated/
 * selected designs are never priced out, let alone ordered).
 */
export async function saveAiCakeProduct(
  selections: CakeSelections,
  existing?: { productId: string; variantId: string }
): Promise<SavedAiCakeProduct | { error: string }> {
  const token = cookies().get("_medusa_jwt")?.value
  if (!token) {
    return { error: "Please log in to continue." }
  }

  let backendRes: Response
  try {
    backendRes = await fetch(`${MEDUSA_BACKEND_URL}/store/ai-studio/product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId: existing?.productId,
        variantId: existing?.variantId,
        ...selections,
      }),
      cache: "no-store",
    })
  } catch (error) {
    console.error("[ai-cake-studio] Failed to reach Medusa backend", error)
    return { error: "Network error. Please try again." }
  }

  const data = await backendRes.json().catch(() => ({}))
  if (!backendRes.ok) {
    return { error: data.error || "Something went wrong pricing this cake. Please try again." }
  }

  return data
}

/**
 * Adds the already-created AI cake product to the customer's real cart (same `_medusa_cart_id` cookie
 * the rest of the storefront's cart/checkout pages already read) via the completely standard Medusa
 * add-line-item flow — the product already carries its own correct, real price by this point, so
 * there's nothing custom left to do here. On success, redirects into the existing checkout flow.
 */
export async function orderAiCake(
  variantId: string,
  bakerId: string
): Promise<{ error: string } | undefined> {
  const cart = await getOrSetCart()
  if (!cart) {
    return { error: "Could not start your cart. Please try again." }
  }

  const cartOrError = await addItem({
    cartId: cart.id,
    variantId,
    quantity: 1,
    metadata: { bakerId },
  })

  if (!cartOrError) {
    return { error: "Something went wrong adding this cake to your cart. Please try again." }
  }

  revalidateTag("cart")
  redirect("/cart")
}
