"use server"

import { cookies } from "next/headers"

import {
  addShippingMethod,
  completeCart,
  deleteDiscount,
  setPaymentSession,
  updateCart,
} from "@lib/data"
import { GiftCard, StorePostCartsCartReq } from "@medusajs/medusa"
import { revalidateTag, revalidatePath } from "next/cache"

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

export async function cartUpdate(data: StorePostCartsCartReq) {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) return "No cartId cookie found"

  try {
    await updateCart(cartId, data)
    revalidateTag("cart")
    revalidatePath("/", "layout")
  } catch (error: any) {
    return error.toString()
  }
}

export async function applyDiscount(code: string) {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) return "No cartId cookie found"

  try {
    await updateCart(cartId, { discounts: [{ code }] }).then(() => {
      revalidateTag("cart")
    })
  } catch (error: any) {
    throw error
  }
}

export async function applyGiftCard(code: string) {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) return "No cartId cookie found"

  try {
    await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
      revalidateTag("cart")
    })
  } catch (error: any) {
    throw error
  }
}

export async function removeDiscount(code: string) {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) return "No cartId cookie found"

  try {
    await deleteDiscount(cartId, code)
    revalidateTag("cart")
  } catch (error: any) {
    throw error
  }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: GiftCard[]
) {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) return "No cartId cookie found"

  try {
    await updateCart(cartId, {
      gift_cards: [...giftCards]
        .filter((gc) => gc.code !== codeToRemove)
        .map((gc) => ({ code: gc.code })),
    }).then(() => {
      revalidateTag("cart")
    })
  } catch (error: any) {
    throw error
  }
}

export async function submitDiscountForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string

  try {
    await applyDiscount(code).catch(async (err) => {
      await applyGiftCard(code)
    })
    return null
  } catch (error: any) {
    return error.toString()
  }
}

/**
 * Replaces the old setAddresses → setShippingMethod → setPaymentMethod chain (3 separate round
 * trips) with one call to the backend's checkout orchestrator (POST /store/checkout/initialize),
 * which resolves shipping and payment itself — the customer never chose between options that only
 * ever had one answer. On success the cart already has address + shipping + payment fully resolved,
 * so this goes straight to review instead of a "delivery" step that no longer has anything to show.
 */
/**
 * Returns `{ error }` or `{ redirectTo }` instead of calling `redirect()` itself — a `redirect()`
 * fired in the same action as `revalidatePath`/`revalidateTag` performs a soft, client-side
 * transition that can still serve the browser's stale cached "review" render (from before shipping/
 * payment were resolved), leaving the customer looking at a blank step with no way forward. The
 * caller does a hard navigation instead, which always re-fetches from the server.
 */
export async function setAddresses(currentState: unknown, formData: FormData) {
  if (!formData) return { error: "No form data received" }

  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) return { error: "No cartId cookie found" }

  const data = {
    shipping_address: {
      first_name: formData.get("shipping_address.first_name"),
      last_name: formData.get("shipping_address.last_name"),
      address_1: formData.get("shipping_address.address_1"),
      address_2: "",
      company: formData.get("shipping_address.company"),
      postal_code: formData.get("shipping_address.postal_code"),
      city: formData.get("shipping_address.city"),
      country_code: formData.get("shipping_address.country_code"),
      province: formData.get("shipping_address.province"),
      phone: formData.get("shipping_address.phone"),
    },
    email: formData.get("email"),
  } as StorePostCartsCartReq

  const sameAsBilling = formData.get("same_as_billing")

  if (sameAsBilling === "on") data.billing_address = data.shipping_address

  if (sameAsBilling !== "on")
    data.billing_address = {
      first_name: formData.get("billing_address.first_name"),
      last_name: formData.get("billing_address.last_name"),
      address_1: formData.get("billing_address.address_1"),
      address_2: "",
      company: formData.get("billing_address.company"),
      postal_code: formData.get("billing_address.postal_code"),
      city: formData.get("billing_address.city"),
      country_code: formData.get("billing_address.country_code"),
      province: formData.get("billing_address.province"),
      phone: formData.get("billing_address.phone"),
    } as StorePostCartsCartReq

  const token = cookies().get("_medusa_jwt")?.value

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/checkout/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        cartId,
        shipping_address: data.shipping_address,
        billing_address: data.billing_address,
        email: data.email,
      }),
      cache: "no-store",
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { error: json.error || "Something went wrong preparing checkout. Please try again." }
    }
    revalidateTag("cart")
    revalidatePath("/", "layout")
  } catch (error: any) {
    return { error: error.toString() }
  }

  return { redirectTo: "/checkout?step=review" }
}

export async function setShippingMethod(shippingMethodId: string) {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) throw new Error("No cartId cookie found")

  try {
    await addShippingMethod({ cartId, shippingMethodId })
    revalidateTag("cart")
  } catch (error: any) {
    throw error
  }
}

export async function setPaymentMethod(providerId: string) {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) throw new Error("No cartId cookie found")

  try {
    const cart = await setPaymentSession({ cartId, providerId })
    revalidateTag("cart")
    return cart
  } catch (error: any) {
    throw error
  }
}

/**
 * Returns `redirectTo` instead of calling `redirect()` itself — see setAddresses above for why: a
 * `redirect()` fired alongside `revalidatePath`/`revalidateTag` can still serve a stale cached render
 * of the confirmation page. Callers must hard-navigate (`window.location.href`) when it's present.
 */
export async function placeOrder() {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) throw new Error("No cartId cookie found")

  let cart

  try {
    cart = await completeCart(cartId)
    revalidateTag("cart")
    revalidatePath("/", "layout")
  } catch (error: any) {
    throw error
  }

  if (cart?.type === "order") {
    cookies().set("_medusa_cart_id", "", { maxAge: -1 })
    return { redirectTo: `/order/confirmed/${cart?.data.id}` }
  }

  return cart
}
