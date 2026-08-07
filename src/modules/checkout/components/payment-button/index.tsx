"use client"

import { Cart, PaymentSession } from "@medusajs/medusa"
import { Button } from "@medusajs/ui"
import dynamic from "next/dynamic"
import { placeOrder } from "@modules/checkout/actions"
import React, { useState } from "react"

import ErrorMessage from "../error-message"

/**
 * The Stripe and PayPal buttons each pull in their provider's SDK, so they're loaded on demand
 * rather than bundled into checkout — see ../payment-wrapper/index.tsx. The manual button, which is
 * the one this store actually uses, has no third-party dependency and stays inline.
 */
const StripePaymentButton = dynamic(() => import("./stripe-payment-button"), {
  ssr: false,
})
const PayPalPaymentButton = dynamic(() => import("./paypal-payment-button"), {
  ssr: false,
})

type PaymentButtonProps = {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    cart.shipping_methods.length < 1
      ? true
      : false

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  if (paidByGiftcard) {
    return <GiftCardPaymentButton />
  }

  const paymentSession = cart.payment_session as PaymentSession

  switch (paymentSession?.provider_id) {
    case "stripe":
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case "manual":
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    case "paypal":
      return (
        <PayPalPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const GiftCardPaymentButton = () => {
  const [submitting, setSubmitting] = useState(false)

  const handleOrder = async () => {
    setSubmitting(true)
    const result = await placeOrder()
    // Hard navigation, not router.push — guarantees a fresh server render of the confirmation page
    // instead of a possibly-stale client Router Cache entry.
    if (result && "redirectTo" in result && result.redirectTo) {
      window.location.href = result.redirectTo
    }
  }

  return (
    <Button
      onClick={handleOrder}
      isLoading={submitting}
      data-testid="submit-order-button"
    >
      Place order
    </Button>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    const result = await placeOrder().catch((err) => {
      setErrorMessage(err.toString())
      setSubmitting(false)
      return null
    })
    if (result && "redirectTo" in result && result.redirectTo) {
      window.location.href = result.redirectTo
    }
  }

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid="submit-order-button"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
