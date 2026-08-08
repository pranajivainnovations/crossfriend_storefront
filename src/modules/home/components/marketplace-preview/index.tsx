import Link from "next/link"

import { getRegion } from "@lib/data"
import { listMarketplaceProducts } from "@lib/data/marketplace"
import MarketplaceGrid from "@modules/marketplace/components/marketplace-grid"

/**
 * A taste of the marketplace on the homepage.
 *
 * Named "Fresh from local bakers" rather than "Popular Near You" on purpose. We have no popularity
 * signal for baker products — the marketplace has just launched, so there are no order counts to
 * rank by — and products are not geo-filtered, so "near you" would be a second claim we cannot
 * back. This is the most recently published listings, and the heading says something true about
 * them. Renaming it is one line once order counts exist and pincode filtering lands.
 *
 * Renders nothing at all when there are no published products. An empty "Fresh from local bakers"
 * strip on a homepage reads as a broken site; the intent cards above already give visitors
 * somewhere to go.
 */
export default async function MarketplacePreview() {
  const [region, result] = await Promise.all([
    getRegion("in"),
    listMarketplaceProducts({ limit: 8, page: 1 }),
  ])

  if (!region || result.products.length === 0) {
    return null
  }

  return (
    <section className="content-container py-12" aria-labelledby="marketplace-preview-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="marketplace-preview-heading" className="text-xl-semi text-grey-90">
            Fresh from local bakers
          </h2>
          <p className="mt-1 text-base-regular text-grey-50">
            Ready to order and on its way today.
          </p>
        </div>
        <Link
          href="/ready-to-order"
          className="text-base-semi text-cf-purple hover:text-cf-purple-700 hover:underline"
        >
          See everything →
        </Link>
      </div>

      <MarketplaceGrid products={result.products} region={region} />
    </section>
  )
}
