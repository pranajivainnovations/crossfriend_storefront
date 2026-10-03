import Link from "next/link"

import { rupees } from "@lib/money"
import type { OrderSummary } from "@lib/data/orders-cart"

/**
 * The customer's own orders.
 *
 * ── What this replaces ─────────────────────────────────────────────────────────────────────────
 * A Medusa order list that, after the checkout moved, showed nothing a customer had actually bought
 * — their real orders were in orders.orders and this page read public."order". Somebody could place
 * an order, get a confirmation, and then find their account empty.
 *
 * ── Why payment and progress are separate columns ──────────────────────────────────────────────
 * The same reason the confirmation page keeps them apart. An order can be placed and settling, or
 * paid and not yet accepted, and a single merged "status" has to lie about one of them. Here they
 * sit side by side and neither has to stand in for the other.
 */

const STEP_LABEL: Record<string, string> = {
  placed: "Finding a baker",
  accepted: "Baker assigned",
  making: "Being made",
  out_for_delivery: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

const STEP_STYLE: Record<string, string> = {
  placed: "bg-amber-100 text-amber-900",
  accepted: "bg-sky-100 text-sky-900",
  making: "bg-indigo-100 text-indigo-900",
  out_for_delivery: "bg-violet-100 text-violet-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-slate-200 text-slate-600",
}

export default function MyOrders({ orders }: { orders: OrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-slate-600">You have not ordered anything yet.</p>
        <Link
          href="/ai-cake-studio"
          className="mt-4 inline-block rounded-xl bg-gradient-to-r from-cf-purple-700 via-cf-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Design a cake
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-3" data-testid="orders-list">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/details/${order.id}`}
            className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                    #{order.displayId}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STEP_STYLE[order.status] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {STEP_LABEL[order.status] ?? order.status}
                  </span>
                  {order.paymentStatus !== "paid" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                      {order.paymentStatus === "awaiting" ? "payment settling" : order.paymentStatus}
                    </span>
                  )}
                </div>

                {/* Titles, not ids — a list of order numbers is a list nobody can read. */}
                <p className="mt-1 truncate text-sm text-slate-600">
                  {order.titles.join(", ") || `${order.itemCount} item`}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {rupees(order.payablePaise)}
                </p>
                {order.creditAppliedPaise > 0 && (
                  <p className="text-xs tabular-nums text-cf-purple-700">
                    −{rupees(order.creditAppliedPaise)} credit
                  </p>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
