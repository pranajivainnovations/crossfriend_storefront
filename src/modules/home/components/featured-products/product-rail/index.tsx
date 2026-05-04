import { Region } from "@medusajs/medusa"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"
import { ProductCollectionWithPreviews } from "types/global"

export default function ProductRail({
  collection,
  region,
}: {
  collection: ProductCollectionWithPreviews
  region: Region
}) {
  const { products } = collection

  if (!products) {
    return null
  }

  return (
    <div className="content-container py-12 small:py-16">
      <div className="flex justify-between items-end mb-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cf-orange mb-1 block">
            Collection
          </span>
          <h2 className="font-heading font-bold text-xl small:text-2xl text-grey-90">
            {collection.title}
          </h2>
        </div>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          <span className="flex items-center gap-1 text-sm font-medium text-cf-orange hover:text-cf-orange-dark transition-colors">
            View all
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-4 gap-y-8 small:gap-x-6">
        {products.map((product) => (
          <li key={product.id}>
            <ProductPreview
              productPreview={product}
              region={region}
              isFeatured
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
