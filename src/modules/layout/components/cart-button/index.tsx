import { LineItem } from "@medusajs/medusa"

import { enrichLineItems, retrieveCart } from "@modules/cart/actions"

import CartDropdown from "../cart-dropdown"

const fetchCart = async () => {
  try {
    const cart = await retrieveCart()

    if (cart?.items?.length) {
      // Only overwrite the real line items if enrichment actually produced some — assigning an empty
      // result would show "Cart (0)" in the nav on every page while the cart really has items in it.
      // See enrichLineItems.
      const enrichedItems = await enrichLineItems(cart.items, cart.region_id)
      if (enrichedItems?.length) {
        cart.items = enrichedItems as LineItem[]
      }
    }

    return cart
  } catch {
    return null
  }
}

export default async function CartButton() {
  const cart = await fetchCart()

  return <CartDropdown cart={cart} />
}
