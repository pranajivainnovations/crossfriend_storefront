"use client"

import { PaymentSession } from "@medusajs/medusa"
import { loadStripe } from "@stripe/stripe-js"

import StripeWrapper from "./stripe-wrapper"
import { StripeContext } from "./stripe-context"

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

/**
 * Everything Stripe-specific, isolated in one module so ./index.tsx can pull it in with next/dynamic
 * and keep the Stripe SDK out of the checkout bundle for stores that don't use Stripe.
 */
const StripeProvider = ({
  paymentSession,
  children,
}: {
  paymentSession: PaymentSession
  children: React.ReactNode
}) => {
  return (
    <StripeContext.Provider value={true}>
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    </StripeContext.Provider>
  )
}

export default StripeProvider
