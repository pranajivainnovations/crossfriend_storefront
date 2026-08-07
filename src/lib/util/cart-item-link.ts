import { LineItem } from "@medusajs/medusa"

/**
 * The product page href for a cart line item, or null when the item shouldn't link anywhere.
 *
 * Two separate reasons an item has no usable link:
 *
 * 1. `variant.product` is missing. Line items are rendered from whatever the cart endpoint returned,
 *    and enrichment can legitimately leave an item un-enriched, so the product relation isn't
 *    guaranteed. Reading `.handle` off it directly throws inside a client component, which blanks the
 *    whole cart page rather than one row.
 *
 * 2. It's an AI Studio cake. Those products are created with status "draft" on purpose (see the
 *    backend's /store/ai-studio/product route) so they never appear in the public catalog — but the
 *    Medusa *store* API filters drafts out entirely, so /products/<handle> renders "Page not found".
 *    Linking there sends the customer to a dead end from inside their own cart.
 */
export function getCartItemHref(
  item: Pick<LineItem, "variant">
): string | null {
  const product = item.variant?.product

  if (!product?.handle) {
    return null
  }

  const isAiStudioCake =
    (product.metadata as Record<string, unknown> | null)?.aiCakeStudio === true

  if (isAiStudioCake) {
    return null
  }

  return `/products/${product.handle}`
}
