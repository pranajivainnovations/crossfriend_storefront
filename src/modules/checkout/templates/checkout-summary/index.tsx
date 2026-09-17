import { Heading } from "@medusajs/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import WalletCredit from "@modules/checkout/components/wallet-credit"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { cookies } from "next/headers"
import { getCart } from "@lib/data"
import { getCartCredit } from "@lib/data/cart-credit"

const CheckoutSummary = async () => {
  const cartId = cookies().get("_medusa_cart_id")?.value

  if (!cartId) {
    return null
  }

  /* Fetched together: the credit read does not depend on the cart body, and making it wait would add
     a round trip to the page a customer is about to pay on. */
  const [cart, credit] = await Promise.all([
    getCart(cartId).then((cart) => cart),
    getCartCredit(cartId),
  ])

  if (!cart) {
    return null
  }

  return (
    <div className="sticky top-0 flex flex-col-reverse small:flex-col gap-y-8 py-8 small:py-0 ">
      <div className="w-full bg-white flex flex-col">
        <Divider className="my-6 small:hidden" />
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular items-baseline"
        >
          In your Cart
        </Heading>
        <Divider className="my-6" />
        <CartTotals data={cart} />
        <ItemsPreviewTemplate region={cart?.region} items={cart?.items} />
        {/* Above the discount box: credit is money the customer already holds, and a code is
            something they have to go and find. */}
        <div className="mt-6">
          <WalletCredit credit={credit} />
        </div>
        <div className="my-6">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary
