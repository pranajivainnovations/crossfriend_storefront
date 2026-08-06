import { Cart } from "@medusajs/medusa"

/**
 * Address, shipping, and payment are set together in one call now (see checkout/initialize) — there's
 * no meaningful partial state between them for the UI to route to anymore, so this only ever needs to
 * decide between "still need an address" and "everything's resolved, go straight to review."
 *
 * Deliberately checks shipping_methods/payment_session too, not just shipping_address — an address can
 * exist on a cart without checkout/initialize ever having actually succeeded (a stale cart reused after
 * days, or a request that committed the address sub-step then failed before shipping/payment). If this
 * only checked address, a customer in that state would see the address marked "done" with no way left
 * to re-trigger the call that creates shipping/payment — stuck on a Review section with no button and
 * no visible next step. Mirror this in Review's own previousStepsCompleted check if either changes.
 */
export function getCheckoutStep(
  cart: Omit<Cart, "beforeInsert" | "beforeUpdate" | "afterUpdateOrLoad">
) {
  const paidByGiftcard =
    cart?.gift_cards && cart.gift_cards.length > 0 && cart.total === 0

  if (
    !cart?.shipping_address?.address_1 ||
    !cart.email ||
    !cart.shipping_methods?.length ||
    !(cart.payment_session || paidByGiftcard)
  ) {
    return "address"
  }
  return "review"
}
