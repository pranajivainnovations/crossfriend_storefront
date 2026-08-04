import { Cart } from "@medusajs/medusa"

/**
 * Address, shipping, and payment are set together in one call now (see checkout/initialize) — there's
 * no meaningful partial state between them for the UI to route to anymore, so this only ever needs to
 * decide between "still need an address" and "everything's resolved, go straight to review."
 */
export function getCheckoutStep(
  cart: Omit<Cart, "beforeInsert" | "beforeUpdate" | "afterUpdateOrLoad">
) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  }
  return "review"
}
