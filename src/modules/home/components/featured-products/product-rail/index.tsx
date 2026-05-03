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
          <h2 className="cf-heading text-xl small:text-2xl">{collection.title}</h2>
          <p className="text-sm text-ui-fg-muted mt-1">
            Handpicked for you
          </p>
        </div>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          View all
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-4 gap-y-8 small:gap-x-6 small:gap-y-12">
        {products.map((product) => (
          <li key={product.id} className="hover-lift">
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
