"use server"

import { cookies } from "next/headers"
import { revalidateTag, revalidatePath } from "next/cache"
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
  /** ai_studio.cake_designs id — lets the backend dedupe against an already-created product for this
   * customer + design, even if this browser's React state was lost (page reload, re-picking the same
   * design from the gallery in a new session). See GeneratedDesign.designId. */
  designId?: string
}

export interface SavedAiCakeProduct {
  productId: string
  variantId: string
  total: number
  breakdown: { label: string; amount: number }[]
}

export interface PriceEstimateInput {
  weight: string
  tiers?: string
  shape?: string
  style?: string
  flavor?: string
  expressDelivery?: boolean
  midnightDelivery?: boolean
  messageOnCake?: boolean
  pincode?: string
}

export interface PriceEstimateResult {
  total: number
  breakdown: { label: string; amount: number }[]
}

/**
 * Live-estimator pricing — calls the same authoritative backend route saveAiCakeProduct's price came
 * from (and the same one the OPS Simulator calls), so the number shown while adjusting options is
 * never out of sync with what Save This Cake will actually charge. The estimator now collects pincode
 * before showing any price at all (region affects the real total), so it's always passed through here.
 */
export async function estimateAiCakePrice(
  input: PriceEstimateInput
): Promise<PriceEstimateResult | { error: string }> {
  let backendRes: Response
  try {
    backendRes = await fetch(`${MEDUSA_BACKEND_URL}/store/ai-studio/price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    })
  } catch (error) {
    console.error("[ai-cake-studio] Failed to reach pricing service", error)
    return { error: "Could not reach pricing service." }
  }

  const data = await backendRes.json().catch(() => ({}))
  if (!backendRes.ok) {
    return { error: data.error || "Could not calculate price." }
  }

  return { total: data.total, breakdown: data.breakdown }
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
 *
 * `bakerId` is null for "Order via CrossFriend" (auto-match) — the order still goes through normally,
 * it just carries `needsBakerAssignment: true` so OPS's assignment queue picks it up. Everything else
 * about the order (price, product, checkout) is identical either way; only who fulfills it differs.
 *
 * `pincode` is carried on the line item too — the price the customer just saw was calculated for this
 * pincode, so the checkout address step reads it back off the cart to lock the postal code field
 * instead of letting the customer quietly change it after the fact and invalidate the price.
 *
 * Returns `redirectTo` instead of calling `redirect()` itself — a `redirect()` fired in the same
 * action as `revalidatePath`/`revalidateTag` performs a soft, client-side transition that can still
 * serve the browser's stale cached (pre-add, empty) `/cart` render instead of the fresh one, which is
 * exactly the "blank cart after ordering" bug this replaced. The caller does a hard navigation instead.
 */
export async function orderAiCake(
  variantId: string,
  bakerId: string | null,
  pincode: string
): Promise<{ error: string; redirectTo?: undefined } | { error?: undefined; redirectTo: string }> {
  const cart = await getOrSetCart()
  if (!cart) {
    return { error: "Could not start your cart. Please try again." }
  }

  const cartOrError = await addItem({
    cartId: cart.id,
    variantId,
    quantity: 1,
    metadata: { bakerId, needsBakerAssignment: bakerId == null, pincode },
  })

  if (!cartOrError) {
    return { error: "Something went wrong adding this cake to your cart. Please try again." }
  }

  revalidateTag("cart")
  revalidatePath("/", "layout")
  return { redirectTo: "/cart" }
}
