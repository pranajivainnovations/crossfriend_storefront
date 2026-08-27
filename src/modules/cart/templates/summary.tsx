"use client"

import { Button, Heading } from "@medusajs/ui"

import { track } from "@lib/analytics"
import { cartToPayload } from "@lib/analytics/ecommerce"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { CartWithCheckoutStep } from "types/global"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type SummaryProps = {
  cart: CartWithCheckoutStep
}

const Summary = ({ cart }: SummaryProps) => {
  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Heading>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals data={cart} />
      {/*
        begin_checkout fires on the click, not on the checkout page mounting.

        The checkout route can be reached without passing through here — a resumed session, a
        bookmarked step URL, a back-navigation from payment — so tracking it on arrival would count
        one visitor several times and make the cart→checkout rate exceed 100%. The click is the
        intent, and it happens exactly once.
      */}
      <LocalizedClientLink
        href={"/checkout?step=" + cart.checkout_step}
        data-testid="checkout-button"
        onClick={() => track("begin_checkout", cartToPayload(cart))}
      >
        <Button className="w-full h-10">Go to checkout</Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
