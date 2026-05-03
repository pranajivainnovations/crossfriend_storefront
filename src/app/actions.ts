"use server"

import { revalidateTag } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { getRegion, updateCart } from "@lib/data"

/**
 * Revalidates region/product caches.
 * India-only: no country code in URLs.
 * Future: accept region (city/area) param for multi-region.
 */
export async function updateRegion(currentPath: string) {
  const cartId = cookies().get("_medusa_cart_id")?.value
  const region = await getRegion()

  if (!region) {
    return null
  }

  try {
    if (cartId) {
      await updateCart(cartId, { region_id: region.id })
      revalidateTag("cart")
    }

    revalidateTag("regions")
    revalidateTag("products")
  } catch (e) {
    return "Error updating region"
  }

  redirect(currentPath)
}

export async function resetOnboardingState(orderId: string) {
  cookies().set("_medusa_onboarding", "false", { maxAge: -1 })
  redirect(`http://localhost:7001/a/orders/${orderId}`)
}
