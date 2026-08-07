import { LineItem } from "@medusajs/medusa"
import { Metadata } from "next"
import { cookies } from "next/headers"

import CartTemplate from "@modules/cart/templates"

import { enrichLineItems } from "@modules/cart/actions"
import { getCheckoutStep } from "@lib/util/get-checkout-step"
import { CartWithCheckoutStep } from "types/global"
import { getCart, getCustomer } from "@lib/data"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

const fetchCart = async () => {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) {
    return null
  }

  const cart = await getCart(cartId).then(
    (cart) => cart as CartWithCheckoutStep
  )

  if (!cart) {
    return null
  }

  if (cart?.items?.length) {
    // Only overwrite the real line items if enrichment actually produced some — assigning an empty
    // result would blank out a cart that genuinely has items in it. See enrichLineItems.
    const enrichedItems = await enrichLineItems(cart.items, cart.region_id)
    if (enrichedItems?.length) {
      cart.items = enrichedItems as LineItem[]
    }
  }

  cart.checkout_step = cart && getCheckoutStep(cart)

  return cart
}

export default async function Cart() {
  // Independent — the customer lookup doesn't depend on the cart, so there's no reason for these two
  // remote-DB round trips to happen one after another.
  const [cart, customer] = await Promise.all([fetchCart(), getCustomer()])

  return <CartTemplate cart={cart} customer={customer} />
}
