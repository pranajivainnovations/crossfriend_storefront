"use client"

import { Button } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { openRazorpay, preloadRazorpay } from "@lib/razorpay"
import {
  confirmRazorpayPayment,
  startRazorpayPayment,
} from "@modules/checkout/actions"
import ErrorMessage from "../error-message"

/**
 * Paying by card, UPI or netbanking.
 *
 * ── How little happens here ────────────────────────────────────────────────────────────────────
 * Press the button and three things happen, none of which this file decides: the server prepares
 * the cart and says how to pay it, the shared payment window opens with exactly what it was given,
 * and the server turns the result into an order. There is no key in this component, no amount, no
 * payment session, and no judgement about whether money changed hands — all of that moved to
 * /store/checkout/razorpay and to @lib/razorpay when the two storefronts stopped each keeping their
 * own copy of it.
 *
 * What is left is the part that genuinely belongs to a button: what the customer sees while it is
 * working, and what they are told about each way it can end.
 */

const BRANDING = {
  name: "CrossFriend",
  description: "Your celebration order",
  themeColor: "#7B2FF7",
}

export default function RazorpayPaymentButton({
  notReady,
  "data-testid": dataTestId,
}: {
  notReady: boolean
  "data-testid"?: string
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  /**
   * Fetch Razorpay's script while they are still reading the order summary.
   *
   * It used to load on the click, which put a third-party network round trip between deciding to
   * buy and seeing anything happen. Starting it here costs nothing — it is idempotent and its
   * result is cached — and the modal opens immediately when the button is pressed.
   */
  useEffect(() => {
    if (!notReady) void preloadRazorpay()
  }, [notReady])

  const pay = async () => {
    setErrorMessage(null)
    setSubmitting(true)

    const preparation = await startRazorpayPayment()

    /* Already an order — they paid, lost the confirmation and came back. Send them to it rather
       than offering to charge them again. */
    if (preparation.state === "completed") {
      router.replace(
        preparation.orderId ? `/order/confirmed/${preparation.orderId}` : "/account/orders"
      )
      return
    }

    if (preparation.state === "refused") {
      /* Written by the backend, which is the only thing that knows which precondition failed —
         a missing phone number reads as a missing phone number, not as "payment unavailable". */
      setErrorMessage(preparation.error)
      setSubmitting(false)
      return
    }

    const outcome = await openRazorpay(preparation.context, BRANDING)

    if (outcome.status === "dismissed") {
      /* Closing the window is not an error. The cart is untouched and the button works again. */
      setSubmitting(false)
      return
    }

    if (outcome.status === "failed" || outcome.status === "unavailable") {
      setErrorMessage(outcome.reason)
      setSubmitting(false)
      return
    }

    /* Paid. Whether that is true is the server's to establish — see confirmRazorpayPayment. */
    const confirmation = await confirmRazorpayPayment()

    if (confirmation.state === "confirmed") {
      router.replace(confirmation.redirectTo)
      return
    }

    /**
     * Money has left their account and there is no order. Deliberately left in the submitting
     * state: the button stays disabled so the next thing they do cannot be a second payment.
     */
    setErrorMessage(confirmation.error)
  }

  return (
    <>
      <Button
        onClick={pay}
        disabled={notReady || submitting}
        isLoading={submitting}
        size="large"
        data-testid={dataTestId}
      >
        Pay now
      </Button>
      <ErrorMessage error={errorMessage} data-testid="razorpay-payment-error-message" />
    </>
  )
}
