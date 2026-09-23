"use server"

import { cookies } from "next/headers"
import { revalidatePath, revalidateTag } from "next/cache"

import {
  CART_COOKIE,
  addOrderCartItem,
  getOrCreateOrderCart,
  getOrderCart,
  setOrderCartCredit,
  setOrderCartItemQty,
  type OrderCart,
} from "@lib/data/orders-cart"

/**
 * What the cart page can do.
 *
 * ── Why each returns the cart ──────────────────────────────────────────────────────────────────
 * The backend answers every write with the whole cart, totals included, so nothing here needs a
 * follow-up read. At roughly 350ms a round trip, "now fetch it again to redraw the total" is
 * latency the customer pays for nothing.
 *
 * Only async functions are exported from this file. A plain constant exported from a "use server"
 * module becomes a server-action reference, which type-checks, builds, and then fails at render.
 */

export interface CartActionState {
  cart: OrderCart | null
  error: string | null
}

export async function changeQuantity(itemId: string, qty: number): Promise<CartActionState> {
  const cartId = cookies().get(CART_COOKIE)?.value
  if (!cartId) return { cart: null, error: "Your cart has expired. Please start again." }

  const { cart, error } = await setOrderCartItemQty({ cartId, itemId, qty })

  revalidateTag("cart")
  revalidatePath("/cart")
  return { cart, error: error ?? null }
}

export async function removeLine(itemId: string): Promise<CartActionState> {
  return changeQuantity(itemId, 0)
}

/**
 * Put wallet credit on the order, or take it off.
 *
 * Neither takes an amount. How much can be applied is the backend's answer, from the balance and
 * the cart it reads itself — there is no field here a modified page could use to choose a larger
 * discount, which is the same reasoning that keeps the redemption cap on the server.
 */
export async function applyCredit(): Promise<CartActionState> {
  return credit("apply")
}

export async function removeCredit(): Promise<CartActionState> {
  return credit("remove")
}

async function credit(action: "apply" | "remove"): Promise<CartActionState> {
  const cartId = cookies().get(CART_COOKIE)?.value
  if (!cartId) return { cart: null, error: "Your cart has expired. Please start again." }

  const { cart, error } = await setOrderCartCredit({ cartId, action })

  revalidateTag("cart")
  revalidatePath("/cart")
  return { cart, error: error ?? null }
}

/** Read for a client component that needs to refresh itself after something else changed. */
export async function refreshCart(): Promise<OrderCart | null> {
  return getOrderCart()
}

/**
 * Add a catalogue item — a ready-to-deliver cake, an add-on, a Pranajiva product.
 *
 * ── Why this exists alongside the studio's own add ─────────────────────────────────────────────
 * A design goes in as `studio_design` and is priced by the pricing engine from its selections. A
 * catalogue line goes in as `catalogue`, and the price comes from the variant's own money_amount.
 * Both are resolved on the server; neither takes a price from the caller.
 *
 * ── Why the signature matches the Medusa action it replaces ────────────────────────────────────
 * Deliberately identical to `addToCart` in ./actions — same argument object, and the same "a string
 * means it failed, nothing means it worked" contract that `occasions/actions.ts` already branches
 * on. Five call sites swap one import line and nothing else, which is the difference between a
 * mechanical change and five chances to get a rewrite subtly wrong.
 *
 * The bug this fixes: those call sites wrote to a Medusa cart while /cart read ours, so an item
 * added from the catalogue moved the old counter and then showed up nowhere.
 */
export async function addCatalogueToCart({
  variantId,
  quantity,
  metadata,
}: {
  variantId: string
  quantity: number
  metadata?: Record<string, unknown>
}): Promise<string | undefined> {
  if (!variantId) return "Missing product variant ID"

  const cart = await getOrCreateOrderCart()
  if (!cart) return "Could not start your cart. Please try again."

  const { cart: updated, error } = await addOrderCartItem({
    cartId: cart.id,
    kind: "catalogue",
    refId: variantId,
    qty: quantity,
    /* Delivery date, time slot and cake message travel as the line's spec, the same field a design
       uses for its selections. Frozen onto the order at placement, so editing the product later
       cannot change what someone was told they bought. */
    spec: metadata ?? {},
  })

  if (!updated) return error ?? "Error adding item to cart"

  /* Get-or-create may have made a new cart, and the id has to survive the response — without this
     the next request starts over and the item appears to vanish. */
  cookies().set(CART_COOKIE, updated.id, {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    path: "/",
  })

  revalidateTag("cart")
  /* The nav counter lives in the root layout, outside this route segment, so revalidateTag alone
     leaves it stale until a manual refresh. Same reason the Medusa action did this. */
  revalidatePath("/", "layout")
  return undefined
}
