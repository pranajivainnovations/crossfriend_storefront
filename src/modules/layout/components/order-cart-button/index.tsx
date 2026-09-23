import Link from "next/link"

import { getOrderCart } from "@lib/data/orders-cart"
import { rupees } from "@lib/money"

/**
 * The cart in the nav.
 *
 * ── Why this is a link and not a dropdown any more ─────────────────────────────────────────────
 * The one it replaces opened a hovering panel that listed the items, which meant the nav rendered
 * line items on every page of the site — and, because a Medusa cart does not carry its own titles
 * or thumbnails, enriched them against the product service first. Two round trips on every
 * navigation to show something most people never look at.
 *
 * What people use it for is knowing there is something in the cart and getting to it. That is a
 * count and a link, and the cart page itself is one tap away.
 */
export default async function OrderCartButton() {
  const cart = await getOrderCart().catch(() => null)
  const count = cart?.items.reduce((n, i) => n + i.qty, 0) ?? 0

  return (
    <Link
      href="/cart"
      data-testid="nav-cart-link"
      className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900"
    >
      <span className="relative">
        <span aria-hidden className="text-lg">🛒</span>
        {count > 0 && (
          <span className="absolute -right-2 -top-1 grid h-4 min-w-[1rem] place-items-center rounded-full bg-cf-purple-700 px-1 text-[10px] font-semibold tabular-nums text-white">
            {count}
          </span>
        )}
      </span>
      {/* The total is worth showing where there is room — it is the number people are tracking. */}
      {count > 0 && (
        <span className="hidden tabular-nums small:inline">{rupees(cart!.payablePaise)}</span>
      )}
      <span className="sr-only">
        {count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart, empty"}
      </span>
    </Link>
  )
}
