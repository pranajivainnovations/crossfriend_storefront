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

  // Which section renders open. Arriving at /checkout with no ?step at all is the normal case — it's
  // how every customer gets here from the cart — and it used to cost a full extra server render: the
  // redirect below fired, the browser came back, and the whole page (cart fetch, product enrichment,
  // customer lookup) ran a second time before anything was shown. There was never a decision to make
  // there; the step the cart is ready for is already known at this point, so use it directly.
  const activeStep = requestedStep ?? cart.checkout_step

  // An explicit ?step the cart isn't ready for is still worth correcting — a stale bookmark, or a
  // request that succeeded partway and left the cart without shipping/payment, would otherwise open
  // a section with nothing in it. "address" is never redirected away from: that's how "Edit" gets
  // back to change a saved address, which has to stay possible once the cart is ready for review.
  if (
    requestedStep &&
    requestedStep !== "address" &&
    requestedStep !== cart.checkout_step
  ) {
    redirect(`/checkout?step=${cart.checkout_step}`)
  }

  return (
    <div>
      <div className="w-full grid grid-cols-1 gap-y-8">
        <div>
          <Addresses cart={cart} customer={customer} activeStep={activeStep} />
        </div>

        <div>
          <Review cart={cart} activeStep={activeStep} />
        </div>
      </div>
    </div>
  )
}
