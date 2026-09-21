"use client"

import { Cart } from "@medusajs/medusa"
import { Button } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import { placeOrder } from "@modules/checkout/actions"
import ErrorMessage from "../error-message"

/**
 * Paying by card, UPI or netbanking — the only way real money reaches this shop.
 *
 * ── What this component is trusted with, which is almost nothing ───────────────────────────────
 * It opens Razorpay's modal and, when the modal says it is done, asks the server to complete the
 * cart. It does not decide whether the order was paid, and deliberately cannot: the handler below
 * receives a signature it never checks, because checking it here would be security theatre — a
 * browser cannot be trusted to grade its own payment.
 *
 * The real check is on the backend. Medusa's cart completion calls the Razorpay provider's
 * `authorizePayment`, which fetches the order from Razorpay's own API and returns AUTHORIZED only
 * when Razorpay itself reports `status: "paid"`. So a forged callback from a modified page ends in a
 * refused completion rather than a free cake. That is why this file has no secret in it and no
 * verification logic: both belong where they cannot be edited by the person paying.
 *
 * ── Why the Razorpay order is not created here ─────────────────────────────────────────────────
 * It already exists. The payment session Medusa created holds the order Razorpay returned, so
 * `session.data.id` is the order id and `session.data.amount` the amount in paise, both settled
 * server-side. Creating a second order from the browser would let the page choose its own price.
 */

type RazorpaySession = {
  id?: string
  amount?: number
  currency?: string
}

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill: { name?: string; email?: string; contact?: string }
  notes: Record<string, string>
  theme: { color: string }
  handler: (response: { razorpay_payment_id: string }) => void
  modal: { ondismiss: () => void }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void }
  }
}

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js"

/** Loads Razorpay's script once, and resolves immediately if it is already there. */
function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SCRIPT}"]`
    )
    if (existing) {
      existing.addEventListener("load", () => resolve(!!window.Razorpay))
      existing.addEventListener("error", () => resolve(false))
      return
    }
    const script = document.createElement("script")
    script.src = CHECKOUT_SCRIPT
    script.async = true
    script.onload = () => resolve(!!window.Razorpay)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function RazorpayPaymentButton({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">
  notReady: boolean
  "data-testid"?: string
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const session = (cart.payment_session?.data ?? {}) as RazorpaySession
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

  const complete = useCallback(async () => {
    const result = await placeOrder().catch((e) => {
      /* Completion refused — most often because Razorpay does not agree the order is paid. Said
         plainly rather than as a generic failure, because the customer has just been debited and
         needs to know whether to try again. */
      setErrorMessage(
        e instanceof Error
          ? e.message
          : "We could not confirm that payment. If money has left your account, please contact us before trying again."
      )
      setSubmitting(false)
      return null
    })

    if (result && "redirectTo" in result && result.redirectTo) {
      router.replace(result.redirectTo)
    }
  }, [router])

  const pay = async () => {
    setErrorMessage(null)

    if (!keyId) {
      /* Missing at build time, not at runtime: NEXT_PUBLIC_* is inlined when the image is built, so
         this is a deploy problem and no amount of retrying will fix it. */
      setErrorMessage("Card payment is unavailable right now. Please contact us to complete your order.")
      return
    }
    if (!session.id) {
      setErrorMessage("That payment session has expired. Please pick your payment method again.")
      return
    }

    setSubmitting(true)

    if (!(await loadRazorpay())) {
      setErrorMessage("Could not reach the payment window. Check your connection and try again.")
      setSubmitting(false)
      return
    }

    const address = cart.shipping_address
    const rzp = new window.Razorpay!({
      key: keyId,
      /* From the session, never recomputed here — see the note at the top of this file. */
      amount: session.amount ?? cart.total ?? 0,
      currency: (session.currency ?? cart.region?.currency_code ?? "INR").toUpperCase(),
      name: "CrossFriend",
      description: "Your celebration order",
      order_id: session.id,
      prefill: {
        name: [address?.first_name, address?.last_name].filter(Boolean).join(" ") || undefined,
        email: cart.email ?? undefined,
        contact: address?.phone ?? undefined,
      },
      notes: { cart_id: cart.id },
      theme: { color: "#7B2FF7" },
      handler: () => {
        /* Razorpay says it is done. Whether it actually is gets decided on the server. */
        void complete()
      },
      modal: {
        /* Closing the window is an ordinary thing to do and not an error — the cart is untouched and
           the same button works again. */
        ondismiss: () => setSubmitting(false),
      },
    })

    rzp.open()
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
