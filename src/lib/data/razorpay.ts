import type { PaymentContext } from "@lib/razorpay"

/**
 * Asking the backend how this cart is to be paid.
 *
 * The browser cannot make this call itself: MEDUSA_BACKEND_URL is server-only, on purpose, so the
 * backend is not addressable from the page. Everything here runs on the server and is reached
 * through the checkout actions.
 *
 * The answers are deliberately narrow. A ready context carries the Razorpay order the backend
 * created; a refusal carries a code and a sentence written for the person reading it. There is no
 * third shape, and in particular no shape that means "probably fine" — a payment screen that guesses
 * is how a customer ends up paying an amount nothing checked.
 */

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9001"

const ENDPOINT = `${MEDUSA_BACKEND_URL}/store/checkout/razorpay`

/** A cart that has already become an order. The one answer that is good news and not a context. */
export type AlreadyPaid = {
  state: "completed"
  orderId: string | null
}

export type PaymentReady = {
  state: "ready"
  context: PaymentContext
}

export type PaymentRefused = {
  state: "refused"
  /** Machine-readable: no_phone, no_email, amount_changed, gateway_unconfigured, … */
  code: string
  /** What to show the customer. Written by the backend so both storefronts say the same thing. */
  error: string
}

export type PaymentPreparation = PaymentReady | PaymentRefused | AlreadyPaid

/**
 * Prepare the cart and return how to pay it.
 *
 * Not cached, and never could be: it creates a payment session as a side effect, and its answer is
 * only true for the cart total at the moment it was asked.
 */
export async function preparePayment(cartId: string): Promise<PaymentPreparation> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: cartId }),
      cache: "no-store",
    })

    const body = (await res.json().catch(() => null)) as
      | { context?: PaymentContext; completed?: boolean; order?: { id: string } | null; code?: string; error?: string }
      | null

    if (body?.completed) {
      return { state: "completed", orderId: body.order?.id ?? null }
    }

    if (res.ok && body?.context) {
      return { state: "ready", context: body.context }
    }

    return {
      state: "refused",
      code: body?.code ?? "unexpected",
      error:
        body?.error ??
        "Something went wrong starting the payment. Please try again.",
    }
  } catch {
    /* The backend was unreachable. Nothing has been charged, so this is safely retryable and says
       so — unlike the refusals above, which mean a retry would fail the same way. */
    return {
      state: "refused",
      code: "unreachable",
      error: "We could not reach the payment service. Please check your connection and try again.",
    }
  }
}

/**
 * Did this cart become an order?
 *
 * Asked after a confirmation that did not come back — the customer has paid and the call that turns
 * payment into an order failed or timed out. Read-only: it reports, it cannot complete.
 */
export async function findOrderForCart(cartId: string): Promise<AlreadyPaid | null> {
  try {
    const res = await fetch(`${ENDPOINT}?cart_id=${encodeURIComponent(cartId)}`, {
      cache: "no-store",
    })
    if (!res.ok) return null

    const body = (await res.json()) as { completed?: boolean; order?: { id: string } | null }
    if (!body.completed) return null

    return { state: "completed", orderId: body.order?.id ?? null }
  } catch {
    return null
  }
}

/**
 * What became of a payment the customer has already made.
 *
 * "unconfirmed" is the case worth naming: the money left their account and we could not turn it
 * into an order. It is not a failure they can fix by trying again, and telling them to would risk a
 * second charge — so it is a distinct state with its own words, not an error string.
 */
export type Confirmation =
  | { state: "confirmed"; redirectTo: string }
  | { state: "unconfirmed"; error: string }
