"use client"

import { Cart, PaymentSession } from "@medusajs/medusa"
import dynamic from "next/dynamic"
import React from "react"

export { StripeContext } from "./stripe-context"

/**
 * Stripe and PayPal are loaded on demand, never as part of the checkout bundle.
 *
 * This store settles orders through the manual provider, so statically importing both SDKs meant
 * shipping roughly 1.8MB of unpacked payment libraries to every customer on the single most
 * conversion-critical page — to render a button that just posts to our own backend. next/dynamic
 * moves each behind its own chunk, fetched only if that provider is actually the one selected.
 */
const StripeProvider = dynamic(() => import("./stripe-provider"), {
  ssr: false,
})
const PaypalProvider = dynamic(() => import("./paypal-provider"), {
  ssr: false,
})

type WrapperProps = {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">
  children: React.ReactNode
}

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

const Wrapper: React.FC<WrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_session as PaymentSession

  const isStripe = paymentSession?.provider_id?.includes("stripe")

  if (isStripe && paymentSession && stripeKey) {
    return (
      <StripeProvider paymentSession={paymentSession}>{children}</StripeProvider>
    )
  }

  if (
    paymentSession?.provider_id === "paypal" &&
    paypalClientId !== undefined &&
    cart
  ) {
    return (
      <PaypalProvider currencyCode={cart.region.currency_code}>
        {children}
      </PaypalProvider>
    )
  }

  return <div>{children}</div>
}

export default Wrapper
