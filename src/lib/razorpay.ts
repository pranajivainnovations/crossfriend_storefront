/**
 * Razorpay's payment window, and nothing else.
 *
 * ── What this file is allowed to know ──────────────────────────────────────────────────────────
 * How to load a script and open a modal. It is handed a payment context the backend has already
 * settled — the key, the order, the amount — and it passes those through untouched. It does not
 * read an environment variable, does not compute a total, does not decide whether a payment
 * succeeded, and holds no secret. Everything it could get wrong is a question it never asks.
 *
 * That is deliberate: the browser is the one participant in a payment whose code the payer can
 * edit. Anything decided here is a thing they could decide differently. See the backend route at
 * /store/checkout/razorpay for where those decisions actually live.
 *
 * ── Why it returns an outcome instead of taking callbacks ──────────────────────────────────────
 * Razorpay's API is three callbacks that can fire in several orders, and the version this replaced
 * treated "the customer closed the window" and "the payment failed" as the same event, which is how
 * a customer who simply changed their mind was told something had gone wrong. One awaited outcome
 * makes those four different answers, each of which deserves different words on screen.
 */

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js"

/** The parts of a payment the backend settled. Passed through, never recomputed. */
export type PaymentContext = {
  key_id: string
  order_id: string
  /** Paise. Razorpay's own figure for the order the backend created. */
  amount: number
  currency: string
  prefill: { name?: string; email?: string; contact?: string }
  notes: Record<string, string>
}

/** How the brand presents itself in the payment window. The only per-brand thing in this file. */
export type PaymentBranding = {
  name: string
  description: string
  themeColor: string
}

export type PaymentOutcome =
  /** Razorpay says it took the money. Whether it really did is the server's to confirm. */
  | { status: "paid"; paymentId: string }
  /** They closed the window without paying. An ordinary thing to do, and not an error. */
  | { status: "dismissed" }
  /** An attempt was made and refused — a declined card, a failed UPI collect. */
  | { status: "failed"; reason: string }
  /** The payment window could not be reached at all. */
  | { status: "unavailable"; reason: string }

type RazorpayHandlerResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type RazorpayInstance = {
  open: () => void
  on: (event: string, handler: (payload: unknown) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

let scriptPromise: Promise<boolean> | null = null

/**
 * Fetch Razorpay's script, at most once per page.
 *
 * Call it when the payment step appears rather than when Pay is pressed. It is around 100KB from a
 * third-party host, and loading it on the click means the customer waits for a network round trip
 * at the exact moment they have decided to buy. Loading it while they read the order summary means
 * the modal opens immediately.
 *
 * Failure is not thrown and not retried: the script tag is cached alongside its result, so a second
 * caller gets the same answer instead of appending another tag to the document.
 */
export function preloadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<boolean>((resolve) => {
    const settle = () => resolve(!!window.Razorpay)

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SCRIPT}"]`
    )
    if (existing) {
      existing.addEventListener("load", settle)
      existing.addEventListener("error", settle)
      return
    }

    const script = document.createElement("script")
    script.src = CHECKOUT_SCRIPT
    script.async = true
    script.onload = settle
    script.onerror = settle
    document.body.appendChild(script)
  }).then((loaded) => {
    /* A failed load is worth retrying on the next attempt — the customer may have regained signal —
       so it is the one result not kept. */
    if (!loaded) scriptPromise = null
    return loaded
  })

  return scriptPromise
}

/**
 * Only one payment window at a time.
 *
 * Two modals over one Razorpay order is a confusing screen rather than a double charge — the order
 * can only be paid once — but it is still a screen where closing one window looks like cancelling
 * and is not. A double click, or a click while the first modal is opening, gets the same answer the
 * first one will.
 */
let openOutcome: Promise<PaymentOutcome> | null = null

/**
 * Open the payment window and wait for it to be finished with.
 *
 * Resolves exactly once, whatever order Razorpay fires its callbacks in. It never rejects: every
 * way this can end is a PaymentOutcome the caller has to handle anyway, and an exception would just
 * be a fifth case that skips the handling.
 */
export function openRazorpay(
  context: PaymentContext,
  branding: PaymentBranding
): Promise<PaymentOutcome> {
  if (openOutcome) return openOutcome

  openOutcome = start(context, branding).finally(() => {
    openOutcome = null
  })

  return openOutcome
}

async function start(
  context: PaymentContext,
  branding: PaymentBranding
): Promise<PaymentOutcome> {
  if (!(await preloadRazorpay())) {
    return {
      status: "unavailable",
      reason: "We could not reach the payment window. Check your connection and try again.",
    }
  }

  return new Promise<PaymentOutcome>((resolve) => {
    let settled = false
    const finish = (outcome: PaymentOutcome) => {
      if (settled) return
      settled = true
      resolve(outcome)
    }

    /**
     * A refused attempt does not close the window — Razorpay lets them try another method — so this
     * is remembered rather than resolved. If they go on to pay, the success wins; if they give up,
     * the dismissal below reports what actually went wrong instead of a bare "cancelled".
     */
    let lastFailure: string | null = null

    const rzp = new window.Razorpay!({
      key: context.key_id,
      /* Both from the Razorpay order the backend created. Recomputing either here would let the
         page choose its own price. */
      amount: context.amount,
      currency: context.currency,
      order_id: context.order_id,
      name: branding.name,
      description: branding.description,
      prefill: context.prefill,
      notes: context.notes,
      theme: { color: branding.themeColor },
      handler: (response: RazorpayHandlerResponse) => {
        /* The signature travels with this response and is deliberately not checked here: a browser
           grading its own payment is not a check. The server asks Razorpay directly. */
        finish({ status: "paid", paymentId: response.razorpay_payment_id })
      },
      modal: {
        ondismiss: () => {
          finish(
            lastFailure
              ? { status: "failed", reason: lastFailure }
              : { status: "dismissed" }
          )
        },
      },
    })

    rzp.on("payment.failed", (payload: unknown) => {
      const description = (payload as { error?: { description?: string } })?.error?.description
      lastFailure =
        description || "That payment did not go through. Please try another method."
    })

    rzp.open()
  })
}
