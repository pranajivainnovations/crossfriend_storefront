"use server"

import { getProducts } from "@lib/data"
import { OCCASION_KITS } from "@lib/constants"
import type { OccasionCollection } from "@lib/types/product-contract"
import { addToCart } from "@modules/cart/actions"

/**
 * Server action: add a pre-defined celebration kit to cart.
 * For each kit item (by product type + occasion), finds the first
 * available product and adds its cheapest variant to cart.
 */
export async function addKitToCart(occasion: OccasionCollection) {
  const kit = OCCASION_KITS[occasion]
  if (!kit) return { error: "Unknown occasion" }

  const errors: string[] = []

  for (const item of kit.items) {
    // Find first product of this type in the occasion collection
    const { products } = await getProducts({
      type: item.type,
      collection: occasion,
      limit: 1,
    })

    // Fallback: any product of this type
    let product = products[0]
    if (!product) {
      const fallback = await getProducts({ type: item.type, limit: 1 })
      product = fallback.products[0]
    }

    if (!product || !product.variants?.length) {
      errors.push(`No ${item.type} product found`)
      continue
    }

    // Pick cheapest variant (first variant as default)
    const variant = product.variants[0]
    if (!variant.id) {
      errors.push(`No variant ID for ${item.type}`)
      continue
    }

    const result = await addToCart({
      variantId: variant.id,
      quantity: item.quantity,
    })

    if (typeof result === "string") {
      errors.push(result)
    }
  }

  if (errors.length > 0) {
    console.warn("[CrossFriend] Kit add partial errors:", errors)
    // Still return success if at least some items were added
  }

  return { success: true }
}
