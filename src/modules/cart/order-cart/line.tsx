"use client"

import Image from "next/image"
import { useState, useTransition } from "react"

import { rupees } from "@lib/money"
import type { OrderCartItem } from "@lib/data/orders-cart"
import { changeQuantity, removeLine } from "../order-actions"

/**
 * One line in the cart.
 *
 * ── Why a studio cake reads differently from a catalogue item ──────────────────────────────────
 * Because it is different, and flattening the two would throw away the thing the customer spent
 * ten minutes on. A cake carries the design they generated and the choices they made — size,
 * flavour, tiers, a message — and those are what tell them this is the right cake before they pay
 * for it. A jar of moringa powder has a name and a price, and needs nothing else.
 *
 * Both come from the same `spec`, which is why the cart never had to know about product types.
 */

function specLine(spec: Record<string, unknown>): string {
  const parts = [
    spec.weight,
    spec.tiers ? `${spec.tiers} tiers` : null,
    spec.shape,
    spec.flavor,
  ]
    .filter(Boolean)
    .map(String)
  return parts.join(" · ")
}

export default function CartLine({ item }: { item: OrderCartItem }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (fn: () => Promise<{ error: string | null }>) =>
    start(async () => {
      setError(null)
      const { error } = await fn()
      if (error) setError(error)
    })

  const image = typeof item.spec.designImageUrl === "string" ? item.spec.designImageUrl : null
  const message = typeof item.spec.cakeMessage === "string" ? item.spec.cakeMessage : null
  const details = specLine(item.spec)

  return (
    <li className="flex gap-4 border-b border-slate-100 py-5 last:border-0">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {image ? (
          <Image src={image} alt={item.title} fill sizes="96px" className="object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-2xl">🎂</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
          <span className="text-sm font-semibold tabular-nums text-slate-900">
            {rupees(item.linePaise)}
          </span>
        </div>

        {details && <p className="mt-0.5 text-xs text-slate-500">{details}</p>}
        {message && (
          <p className="mt-1 truncate text-xs italic text-slate-500">&ldquo;{message}&rdquo;</p>
        )}

        <div className="mt-3 flex items-center gap-3">
          {/* A made-to-order cake is one cake. Quantity is offered where it means something. */}
          {item.kind === "catalogue" ? (
            <div className="inline-flex items-center rounded-lg border border-slate-200">
              <button
                type="button"
                aria-label="Fewer"
                disabled={pending}
                onClick={() => run(() => changeQuantity(item.id, item.qty - 1))}
                className="px-2.5 py-1 text-slate-600 disabled:opacity-40"
              >
                −
              </button>
              <span className="min-w-[2ch] px-1 text-center text-sm tabular-nums">{item.qty}</span>
              <button
                type="button"
                aria-label="More"
                disabled={pending}
                onClick={() => run(() => changeQuantity(item.id, item.qty + 1))}
                className="px-2.5 py-1 text-slate-600 disabled:opacity-40"
              >
                +
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-500">
              {rupees(item.unitPricePaise)} · made to order
            </span>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => removeLine(item.id))}
            className="text-xs text-slate-500 underline underline-offset-2 disabled:opacity-40"
          >
            {pending ? "Removing…" : "Remove"}
          </button>
        </div>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </li>
  )
}
