import Link from "next/link"

import { rupees } from "@lib/money"
import type { PlacedOrderView } from "@lib/data/orders-cart"

/**
 * What happens after they pay.
 *
 * ── Why payment status and order status are shown apart ────────────────────────────────────────
 * Because they genuinely are apart, and this is the page where that pays off. An order exists from
 * the moment it is placed; the money lands separately, sometimes seconds later and sometimes — with
 * UPI collect — minutes later on another device. Flattening the two into one "confirmed" would mean
 * either lying for a few seconds or making the customer refresh to find out.
 *
 * So a customer who arrives before the webhook sees a real order with the payment still settling,
 * and is told not to pay again. That sentence is the entire reason the pipeline was rebuilt.
 */

const STEPS: { key: string; label: string }[] = [
  { key: "placed", label: "Order placed" },
  { key: "accepted", label: "Baker assigned" },
  { key: "making", label: "Being made" },
  { key: "out_for_delivery", label: "On its way" },
  { key: "delivered", label: "Delivered" },
]

export default function OrderConfirmed({ order }: { order: PlacedOrderView }) {
  const paid = order.paymentStatus === "paid"
  const reached = new Set(order.events.map((e) => e.status))
  const currentIndex = STEPS.findIndex((s) => s.key === order.status)

  return (
    <div className="content-container py-10">
      <div className="mx-auto max-w-2xl">
        <div
          className={`rounded-2xl border p-6 text-center ${
            paid ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="text-4xl">{paid ? "🎉" : "⏳"}</div>
          <h1
            className={`mt-3 text-xl font-bold ${paid ? "text-emerald-900" : "text-amber-900"}`}
          >
            {paid ? "Your order is confirmed" : "Payment is settling"}
          </h1>
          <p className={`mt-2 text-sm ${paid ? "text-emerald-800" : "text-amber-900"}`}>
            {paid
              ? "We have sent the details to your mobile."
              : "We have your order. Some payment methods take a minute to clear — there is no need to pay again."}
          </p>
          <p className="mt-3 font-mono text-sm tabular-nums text-slate-700">
            Order #{order.displayId}
          </p>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-900">What happens next</h2>
          <ol className="mt-3 space-y-0">
            {STEPS.map((step, i) => {
              const done = reached.has(step.key) || i < currentIndex
              const now = i === currentIndex
              return (
                <li key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                        done || now
                          ? "bg-cf-purple-700 text-white"
                          : "border border-slate-200 bg-white text-slate-300"
                      }`}
                    >
                      {done && !now ? "✓" : i + 1}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        className={`w-px flex-1 ${done ? "bg-cf-purple-300" : "bg-slate-200"}`}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={`text-sm ${
                        now
                          ? "font-semibold text-slate-900"
                          : done
                          ? "text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    {now && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {/* Honest about the one step that is a person, not a system. */}
                        {step.key === "placed"
                          ? "We are matching your cake with a baker near you."
                          : "We will message you when this changes."}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Your order</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0 text-slate-600">
                  {item.qty > 1 && <span className="tabular-nums">{item.qty}× </span>}
                  {item.title}
                </span>
                <span className="shrink-0 tabular-nums text-slate-900">
                  {rupees(item.linePaise)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Subtotal</dt>
              <dd className="tabular-nums text-slate-900">{rupees(order.subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Delivery</dt>
              <dd className="font-medium text-emerald-700">Free</dd>
            </div>
            {order.creditAppliedPaise > 0 && (
              <div className="flex justify-between">
                <dt className="text-cf-purple-700">Celebration credit</dt>
                <dd className="tabular-nums text-cf-purple-700">
                  −{rupees(order.creditAppliedPaise)}
                </dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
              <dt className="text-slate-900">{paid ? "Paid" : "To pay"}</dt>
              <dd className="tabular-nums text-slate-900">{rupees(order.payablePaise)}</dd>
            </div>
          </dl>
        </section>

        {order.address?.address_1 && (
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Delivering to</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {[order.address.first_name, order.address.last_name].filter(Boolean).join(" ")}
              <br />
              {order.address.address_1}
              {order.address.address_2 ? `, ${order.address.address_2}` : ""}
              <br />
              {[order.address.city, order.address.province, order.address.postal_code]
                .filter(Boolean)
                .join(", ")}
              <br />
              <span className="tabular-nums">{order.address.phone}</span>
            </p>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/account/orders"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700"
          >
            My orders
          </Link>
          <Link
            href="/ai-cake-studio"
            className="rounded-xl bg-gradient-to-r from-cf-purple-700 via-cf-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Design another
          </Link>
        </div>
      </div>
    </div>
  )
}
