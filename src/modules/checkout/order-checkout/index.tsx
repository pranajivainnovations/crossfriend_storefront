"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { rupees } from "@lib/money"
import type { OrderCart } from "@lib/data/orders-cart"
import { openRazorpay, preloadRazorpay } from "@lib/razorpay"
import CreditPanel from "@modules/cart/order-cart/credit-panel"
import MobileOtpAuth from "@modules/common/components/mobile-otp-auth"
import { usePincodeAutofill } from "../hooks/use-pincode-autofill"
import { confirmPayment, placeAndPay } from "../order-actions"

/**
 * Checkout, in one screen.
 *
 * ── What it replaces ───────────────────────────────────────────────────────────────────────────
 * Four steps — address, shipping, payment, review — each a page transition and a round trip. The
 * shipping step existed because Medusa's cart wanted a `shipping_method`, not because anybody had a
 * choice to make: there is one delivery option and it is free. The review step existed because the
 * other three could leave the cart in a state worth re-reading.
 *
 * ── How many calls this makes ──────────────────────────────────────────────────────────────────
 * One. `placeAndPay` writes the order and returns the payment context together. The optional
 * `confirmPayment` afterwards is a courtesy, not a requirement — the webhook lands the same order
 * whether or not this page is still open, which is why nothing here tells anyone not to close it.
 */

type Address = {
  first_name: string
  last_name: string
  address_1: string
  address_2: string
  city: string
  province: string
  postal_code: string
  phone: string
  email: string
}

const BRANDING = {
  name: "CrossFriend",
  description: "Your celebration order",
  themeColor: "#7B2FF7",
}

export default function OrderCheckout({
  cart,
  signedIn,
  prefill,
}: {
  cart: OrderCart
  signedIn: boolean
  prefill: Partial<Address>
}) {
  const router = useRouter()

  const [address, setAddress] = useState<Address>({
    first_name: prefill.first_name ?? "",
    last_name: prefill.last_name ?? "",
    address_1: prefill.address_1 ?? "",
    address_2: prefill.address_2 ?? "",
    city: prefill.city ?? "",
    province: prefill.province ?? "",
    /* The cart's pincode wins: the price the customer was shown was computed for it, and letting
       them change it here would quietly invalidate that. */
    postal_code: cart.pincode ?? prefill.postal_code ?? "",
    phone: prefill.phone ?? "",
    email: prefill.email ?? "",
  })

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [missing, setMissing] = useState<string[]>([])
  const [pending, setPending] = useState<{ displayId?: number; message: string } | null>(null)

  /**
   * City and state from the pincode they already gave, rather than two more fields to type.
   *
   * `|| a.city` rather than an overwrite: the hook only fires for a genuinely new pincode, but a
   * customer who corrected the city by hand should keep their correction.
   */
  const pinStatus = usePincodeAutofill(address.postal_code, (resolved) => {
    setAddress((a) => ({
      ...a,
      city: a.city || resolved.city,
      province: a.province || resolved.state,
    }))
  })

  /* Razorpay's script while they are still typing, not when they press pay. It is ~100KB from a
     third-party host and fetching it on the click puts a network round trip at the worst moment. */
  useEffect(() => {
    if (signedIn) void preloadRazorpay()
  }, [signedIn])

  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((a) => ({ ...a, [k]: e.target.value }))

  const pay = async () => {
    setError(null)

    /* Named, because "some required fields are missing" on a form that looks filled in is the dead
       end this storefront has already shipped once. */
    const required: [keyof Address, string][] = [
      ["first_name", "name"],
      ["phone", "phone number"],
      ["address_1", "address"],
      ["city", "city"],
      ["postal_code", "pincode"],
    ]
    const gaps = required.filter(([k]) => !address[k].trim())
    if (gaps.length) {
      setMissing(gaps.map(([k]) => k))
      setError(`Please add your ${gaps.map(([, l]) => l).join(", ")}.`)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    setMissing([])
    setBusy(true)

    const placed = await placeAndPay(address as unknown as Record<string, unknown>)

    if (!placed.ok || !placed.payment || !placed.order) {
      setError(placed.error ?? "Could not place your order. Please try again.")
      setBusy(false)
      return
    }

    const outcome = await openRazorpay(
      {
        key_id: placed.payment.key_id,
        order_id: placed.payment.order_id,
        amount: placed.payment.amount,
        currency: placed.payment.currency,
        prefill: placed.payment.prefill,
        notes: placed.payment.notes,
      },
      { ...BRANDING, name: placed.payment.name || BRANDING.name }
    )

    if (outcome.status === "dismissed") {
      /**
       * They closed the window. The order exists and is waiting — not an error, and not something
       * to apologise for. Pressing pay again attaches a payment to the order already made.
       */
      setError("No payment taken. Your order is saved — press Pay when you are ready.")
      setBusy(false)
      return
    }

    if (outcome.status === "failed" || outcome.status === "unavailable") {
      setError(outcome.reason)
      setBusy(false)
      return
    }

    const confirmed = await confirmPayment({
      orderId: placed.order.id,
      razorpayOrderId: placed.payment.order_id,
      razorpayPaymentId: outcome.paymentId,
    })

    if (confirmed.confirmed) {
      router.replace(`/order/confirmed/${confirmed.orderId}`)
      return
    }

    /**
     * Paid, not yet confirmed. Deliberately not an error and deliberately still busy: the webhook
     * will land it, and the one thing that must not happen here is a second payment.
     */
    setPending({ displayId: placed.order.display_id, message: confirmed.message ?? "" })
  }

  if (pending) {
    return (
      <div className="content-container py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="text-4xl">✓</div>
          <h1 className="mt-3 text-lg font-bold text-emerald-900">Payment received</h1>
          <p className="mt-2 text-sm text-emerald-800">{pending.message}</p>
          {pending.displayId && (
            <p className="mt-3 text-xs text-emerald-700">
              Order #{pending.displayId} — we have sent this to your mobile.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="content-container grid grid-cols-1 gap-8 py-10 small:grid-cols-[1fr_380px]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Where is it going?</h1>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 small:grid-cols-2">
          <Field label="First name" value={address.first_name} onChange={set("first_name")}
            autoComplete="given-name" missing={missing.includes("first_name")} />
          <Field label="Last name" value={address.last_name} onChange={set("last_name")}
            autoComplete="family-name" />
          <Field label="Mobile number" value={address.phone} onChange={set("phone")}
            autoComplete="tel" inputMode="numeric" missing={missing.includes("phone")} />
          <Field label="Email (optional)" value={address.email} onChange={set("email")}
            autoComplete="email" type="email" />
          <div className="small:col-span-2">
            <Field label="Address" value={address.address_1} onChange={set("address_1")}
              autoComplete="address-line1" missing={missing.includes("address_1")} />
          </div>
          <div className="small:col-span-2">
            <Field label="Flat, floor, landmark (optional)" value={address.address_2}
              onChange={set("address_2")} autoComplete="address-line2" />
          </div>
          <div>
            <Field label="Pincode" value={address.postal_code} onChange={set("postal_code")}
              autoComplete="postal-code" inputMode="numeric"
              missing={missing.includes("postal_code")}
              /* Locked when the cart carries one — the price was computed for that area. */
              readOnly={!!cart.pincode} />
            {pinStatus === "resolving" && (
              <p className="mt-1 text-xs text-slate-500">Looking up your area…</p>
            )}
          </div>
          <Field label="City" value={address.city} onChange={set("city")}
            autoComplete="address-level2" missing={missing.includes("city")} />
          <div className="small:col-span-2">
            <Field label="State" value={address.province} onChange={set("province")}
              autoComplete="address-level1" />
          </div>
        </div>
      </div>

      <div className="small:sticky small:top-12 small:self-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Your order</h2>

          <ul className="mt-3 space-y-2 text-sm">
            {cart.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-slate-600">
                  {i.qty > 1 && <span className="tabular-nums">{i.qty}× </span>}
                  {i.title}
                </span>
                <span className="shrink-0 tabular-nums text-slate-900">{rupees(i.linePaise)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Subtotal</dt>
              <dd className="tabular-nums text-slate-900">{rupees(cart.subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Delivery</dt>
              <dd className="font-medium text-emerald-700">Free</dd>
            </div>
            {cart.creditAppliedPaise > 0 && (
              <div className="flex justify-between">
                <dt className="text-cf-purple-700">Celebration credit</dt>
                <dd className="tabular-nums text-cf-purple-700">
                  −{rupees(cart.creditAppliedPaise)}
                </dd>
              </div>
            )}
          </dl>

          {/* Above "To pay", so the number it changes is the next thing read. Renders nothing for a
              guest or an empty wallet — it self-gates on cart.credit. */}
          <CreditPanel cart={cart} />

          <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4">
            <span className="text-sm font-semibold text-slate-900">To pay</span>
            <span className="text-lg font-bold tabular-nums text-slate-900">
              {rupees(cart.payablePaise)}
            </span>
          </div>

          {signedIn ? (
            <>
              <button
                type="button"
                onClick={pay}
                disabled={busy}
                data-testid="submit-order-button"
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-cf-purple-700 via-cf-purple-600 to-fuchsia-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Opening payment…" : `Pay ${rupees(cart.payablePaise)}`}
              </button>
              {/* Deliberately the opposite of what most checkouts say. */}
              <p className="mt-3 text-center text-[11px] leading-snug text-slate-500">
                Card, UPI or netbanking. You can close this page after paying — we will confirm your
                order either way.
              </p>
            </>
          ) : (
            <div className="mt-5 border-t border-slate-200 pt-5">
              <MobileOtpAuth
                title="Verify your mobile to order"
                subtitle="We need a number to send your order updates to"
                successText="Verified — you can place your order now."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  missing,
  ...props
}: {
  label: string
  missing?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        {...props}
        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
          missing ? "border-red-300 bg-red-50" : "border-slate-200"
        } ${props.readOnly ? "bg-slate-50 text-slate-600" : ""}`}
      />
    </label>
  )
}
