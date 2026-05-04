import { Metadata } from "next"
import { cookies } from "next/headers"
import { LineItem } from "@medusajs/medusa"

import { enrichLineItems } from "@modules/cart/actions"
import Wrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { getCart } from "@lib/data"

export const metadata: Metadata = {
  title: "Checkout",
}

const fetchCart = async () => {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) {
    return null
  }

  const cart = await getCart(cartId).then((cart) => cart)

  if (!cart) {
    return null
  }

  if (cart?.items.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id)
    cart.items = enrichedItems as LineItem[]
  }

  return cart
}

export default async function Checkout() {
  const cart = await fetchCart()

  if (!cart) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 content-container">
        <h1 className="text-xl font-semibold text-grey-80">Your cart is empty</h1>
        <p className="text-sm text-ui-fg-muted">Add some items to your cart to proceed with checkout.</p>
        <a href="/store" className="px-6 py-2 bg-cf-orange text-white rounded-lg text-sm font-medium hover:bg-cf-orange-dark transition-colors">
          Continue Shopping
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <Wrapper cart={cart}>
        <CheckoutForm />
      </Wrapper>
      <CheckoutSummary />
    </div>
  )
}
