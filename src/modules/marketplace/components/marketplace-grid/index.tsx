import Link from "next/link"
import { Region } from "@medusajs/medusa"

import type { MarketplaceProduct } from "@lib/data/marketplace"
import ProductPreview from "@modules/products/components/product-preview"

/**
 * The Ready-to-Order product grid.
 *
 * Reuses ProductPreview rather than styling a second card, so a marketplace product looks and
 * behaves identically to every other product in the storefront — same price formatting, same
 * thumbnail handling, same link. The only addition is the baker line underneath.
 *
 * That line matters: on a marketplace, who made the thing is part of what you are choosing. It
 * links straight to the baker so "more from them" is one tap, which is the whole point of having
 * baker profiles at all.
 */
export default function MarketplaceGrid({
  products,
  region,
}: {
  products: MarketplaceProduct[]
  region: Region
}) {
  return (
    <ul
      className="grid grid-cols-2 gap-x-4 gap-y-8 small:grid-cols-3 medium:grid-cols-4"
      data-testid="marketplace-grid"
    >
      {products.map((product) => (
        <li key={product.id}>
          <ProductPreview productPreview={product} region={region} />
          {product.bakerName && (
            <p className="mt-1 text-small-regular text-grey-50">
              {product.bakerSlug ? (
                <Link
                  href={`/bakers/${product.bakerSlug}`}
                  className="hover:text-cf-purple hover:underline"
                >
                  {product.bakerName}
                </Link>
              ) : (
                product.bakerName
              )}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
