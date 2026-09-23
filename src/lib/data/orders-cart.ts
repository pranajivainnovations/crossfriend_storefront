import { cookies } from "next/headers"

/**
 * Our cart, as the storefront sees it.
 *
 * ── What changed, and why it is worth the churn ────────────────────────────────────────────────
 * A studio cake used to become a real Medusa product before it could be bought — a draft product
 * with a variant, a shipping profile, a sales channel and an `inventory_quantity` of zero — because
 * Medusa's `addItem` took a variantId. Adding a cake to a cart therefore meant writing to the
 * catalogue, which is why `/store/ai-studio/product` existed and why its file is a catalogue of
 * comments about bugs caught live.
 *
 * Here a design is added by its own id with `kind: "studio_design"`. Nothing is written to the
 * catalogue, and the price comes from the pricing engine on the server, where the caller cannot
 * influence it.
 *
 * ── Why the cart id lives in its own cookie ────────────────────────────────────────────────────
 * `_medusa_cart_id` still points at Medusa carts while both pipelines exist. Reusing it would mean
 * one cookie naming a row in two different tables depending on which code last ran, which is the
 * kind of thing that looks fine until a customer's cart silently empties.
 */

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9001"

export const CART_COOKIE = "cf_cart_id"

export type ItemKind = "catalogue" | "studio_design"

export interface OrderCartItem {
  id: string
  kind: ItemKind
  refId: string
  title: string
  qty: number
  unitPricePaise: number
  linePaise: number
  spec: Record<string, unknown>
}

/**
 * What the wallet allows here, and why.
 *
 * The cart used to carry only `creditAppliedPaise` — how much was already on. That is enough to
 * draw a discount line and nothing else: the page could not say what the balance was, how much of
 * it was usable, or why the usable part was smaller. `limitedBy` is what lets the copy explain
 * itself instead of presenting a number the customer has to take on trust.
 *
 * Null for a guest, and null if the wallet could not be read.
 */
export interface CreditQuote {
  balancePaise: number
  applicablePaise: number
  appliedPaise: number
  limitedBy: "balance" | "cap" | "order" | "nothing_to_apply"
  capPercent: number
}

export interface OrderCart {
  id: string
  customerId: string | null
  brand: string
  pincode: string | null
  status: string
  items: OrderCartItem[]
  subtotalPaise: number
  deliveryPaise: number
  creditAppliedPaise: number
  payablePaise: number
  credit?: CreditQuote | null
}

function authHeaders(): Record<string, string> {
  const token = cookies().get("_medusa_jwt")?.value
  return {
    "Content-Type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * Every call returns the whole cart, so nothing here needs a follow-up read.
 *
 * That is the shape the backend routes were built for: one round trip per customer action. At
 * roughly 350ms a hop, a "now fetch the cart again" after each write is latency the customer pays
 * for nothing.
 */
async function call(
  path: string,
  init: RequestInit & { method: string }
): Promise<{ cart: OrderCart | null; error?: string; code?: string }> {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init.headers ?? {}) },
      cache: "no-store",
    })
    const body = (await res.json().catch(() => ({}))) as any
    if (!res.ok) {
      return { cart: null, error: body?.error ?? "Something went wrong with your cart.", code: body?.code }
    }
    return { cart: body.cart ?? null }
  } catch {
    return { cart: null, error: "We could not reach your cart. Please check your connection." }
  }
}

/** The cart this browser should use, creating one only if there is nothing to find. */
export async function getOrCreateOrderCart(pincode?: string | null): Promise<OrderCart | null> {
  const existing = cookies().get(CART_COOKIE)?.value
  const { cart } = await call("/store/cart", {
    method: "POST",
    body: JSON.stringify({ cart_id: existing ?? undefined, pincode: pincode ?? undefined }),
  })
  return cart
}

export async function getOrderCart(): Promise<OrderCart | null> {
  const cartId = cookies().get(CART_COOKIE)?.value
  if (!cartId) return null
  const { cart } = await call(`/store/cart?cart_id=${encodeURIComponent(cartId)}`, { method: "GET" })
  return cart
}

export async function addOrderCartItem(input: {
  cartId: string
  kind: ItemKind
  refId: string
  qty?: number
  spec?: Record<string, unknown>
}): Promise<{ cart: OrderCart | null; error?: string }> {
  return call("/store/cart/items", {
    method: "POST",
    body: JSON.stringify({
      cart_id: input.cartId,
      kind: input.kind,
      ref_id: input.refId,
      qty: input.qty ?? 1,
      /* What the customer configured. There is deliberately no price field — the server resolves
         it, so there is nothing here a modified page could use to choose its own. */
      spec: input.spec ?? {},
    }),
  })
}

export async function setOrderCartItemQty(input: {
  cartId: string
  itemId: string
  qty: number
}): Promise<{ cart: OrderCart | null; error?: string }> {
  return call(`/store/cart/items/${encodeURIComponent(input.itemId)}`, {
    method: "POST",
    body: JSON.stringify({ cart_id: input.cartId, qty: input.qty }),
  })
}

export async function setOrderCartCredit(input: {
  cartId: string
  action: "apply" | "remove"
}): Promise<{ cart: OrderCart | null; error?: string }> {
  return call("/store/cart/credit", {
    method: "POST",
    body: JSON.stringify({ cart_id: input.cartId, action: input.action }),
  })
}

/**
 * Place the order and get back how to pay it.
 *
 * One call where there used to be four — address, shipping method, create payment sessions, select
 * one — and the response already carries everything the payment window needs. The cart id can come
 * back different: signing in may have merged a guest cart into one the customer already had, and
 * the caller has to follow that rather than keep pointing at an abandoned row.
 */
export async function placeOrderAndPay(input: {
  cartId: string
  address: Record<string, unknown>
}): Promise<
  | {
      ok: true
      order: { id: string; display_id: number; payable_paise: number }
      payment: {
        key_id: string
        order_id: string
        amount: number
        currency: string
        name: string
        prefill: Record<string, string | undefined>
        notes: Record<string, string>
      }
      cartId: string
    }
  | { ok: false; error: string; code?: string }
> {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/checkout/place`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ cart_id: input.cartId, address: input.address }),
      cache: "no-store",
    })
    const body = (await res.json().catch(() => ({}))) as any

    if (!res.ok) {
      return { ok: false, error: body?.error ?? "Could not place your order.", code: body?.code }
    }
    return { ok: true, order: body.order, payment: body.payment, cartId: body.cart_id }
  } catch {
    return { ok: false, error: "We could not reach us just now. Please try again." }
  }
}

/**
 * Tell the server the browser saw a payment complete.
 *
 * Optional, and the caller must treat it that way: the webhook confirms the same order
 * independently. A `pending` answer means "we have your order, we are confirming" — never an
 * invitation to pay again.
 */
export async function confirmOrderPayment(input: {
  orderId?: string
  razorpayOrderId: string
  razorpayPaymentId?: string
  razorpaySignature?: string
}): Promise<
  | { confirmed: true; order: { id: string; display_id: number } }
  | { confirmed: false; pending: boolean; message: string }
> {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/checkout/confirm`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        order_id: input.orderId,
        razorpay_order_id: input.razorpayOrderId,
        razorpay_payment_id: input.razorpayPaymentId,
        razorpay_signature: input.razorpaySignature,
      }),
      cache: "no-store",
    })
    const body = (await res.json().catch(() => ({}))) as any

    if (body?.confirmed) return { confirmed: true, order: body.order }
    return {
      confirmed: false,
      pending: true,
      message:
        body?.message ??
        "We have your order and are confirming the payment. You will get a message shortly — there is no need to pay again.",
    }
  } catch {
    /* Even a total failure here is "pending", because the order exists and the webhook will land
       it. Anything that sounds like an error invites a second payment. */
    return {
      confirmed: false,
      pending: true,
      message:
        "We have your order and are confirming the payment. You will get a message shortly — there is no need to pay again.",
    }
  }
}

/* ── orders ───────────────────────────────────────────────────────────────────────────────────── */

export interface PlacedOrderItem {
  id: string
  kind: ItemKind
  refId: string
  title: string
  qty: number
  unitPricePaise: number
  linePaise: number
  spec: Record<string, unknown>
}

export interface PlacedOrderView {
  id: string
  displayId: number
  brand: string
  subtotalPaise: number
  deliveryPaise: number
  creditAppliedPaise: number
  payablePaise: number
  paymentStatus: "awaiting" | "paid" | "failed" | "refunded"
  status: string
  address: Record<string, string>
  createdAt: string
  items: PlacedOrderItem[]
  events: { status: string; at: string; note: string | null }[]
}

/**
 * One order, for the customer who placed it.
 *
 * Null covers both "no such order" and "not yours" — the backend does not distinguish, because a
 * 403 would confirm that an id exists. The page treats either as not found.
 */
export async function getPlacedOrder(orderId: string): Promise<PlacedOrderView | null> {
  try {
    const res = await fetch(
      `${MEDUSA_BACKEND_URL}/store/orders/${encodeURIComponent(orderId)}`,
      { headers: authHeaders(), cache: "no-store" }
    )
    if (!res.ok) return null
    const body = (await res.json()) as { order?: PlacedOrderView }
    return body.order ?? null
  } catch {
    return null
  }
}
