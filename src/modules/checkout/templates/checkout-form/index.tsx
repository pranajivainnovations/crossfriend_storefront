import { getCart, getCustomer } from "@lib/data"
import { getCheckoutStep } from "@lib/util/get-checkout-step"
import Addresses from "@modules/checkout/components/addresses"
import Review from "@modules/checkout/components/review"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { CartWithCheckoutStep } from "types/global"

/**
 * Address, shipping, and payment all get resolved together in one call now (see
 * POST /store/checkout/initialize) — there's nothing left for Shipping/Payment to show as separate
 * steps, since the customer was never actually choosing between options that only ever had one
 * answer. This template is just Address → Review.
 */
export default async function CheckoutForm({
  requestedStep,
}: {
  requestedStep?: string
}) {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) {
    return null
  }

  // Independent — the customer lookup doesn't depend on the cart, so fetch both at once instead of
  // waiting on one before starting the other. (Fetched speculatively even on the redirect path below;
  // that's a harmless, read-only query, not worth special-casing away for the uncommon case.)
  const [cart, customer] = await Promise.all([
    getCart(cartId) as Promise<CartWithCheckoutStep>,
    getCustomer(),
  ])

  if (!cart) {
    return null
  }

  cart.checkout_step = getCheckoutStep(cart)

  // The URL's ?step is the only thing either Addresses or Review actually opens on — if it names a
  // step the cart isn't really ready for (no step at all, a stale bookmark, or a request that
  // succeeded partway and left the cart without shipping/payment), neither section renders open and
  // the customer is stuck looking at nothing. Never redirect away from an explicit "address" request
  // though — that's how "Edit" navigates back to change a saved address, and that has to stay possible
  // even once the cart is otherwise ready for review.
  if (requestedStep !== "address" && requestedStep !== cart.checkout_step) {
    redirect(`/checkout?step=${cart.checkout_step}`)
  }

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
