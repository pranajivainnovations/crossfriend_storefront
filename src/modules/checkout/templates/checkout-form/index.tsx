import { getCart, getCustomer } from "@lib/data"
import { getCheckoutStep } from "@lib/util/get-checkout-step"
import Addresses from "@modules/checkout/components/addresses"
import Review from "@modules/checkout/components/review"
import { cookies } from "next/headers"
import { CartWithCheckoutStep } from "types/global"

/**
 * Address, shipping, and payment all get resolved together in one call now (see
 * POST /store/checkout/initialize) — there's nothing left for Shipping/Payment to show as separate
 * steps, since the customer was never actually choosing between options that only ever had one
 * answer. This template is just Address → Review.
 */
export default async function CheckoutForm() {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) {
    return null
  }

  const cart = (await getCart(cartId)) as CartWithCheckoutStep

  if (!cart) {
    return null
  }

  cart.checkout_step = getCheckoutStep(cart)

  const customer = await getCustomer()

  return (
    <div>
      <div className="w-full grid grid-cols-1 gap-y-8">
        <div>
          <Addresses cart={cart} customer={customer} />
        </div>

        <div>
          <Review cart={cart} />
        </div>
      </div>
    </div>
  )
}
