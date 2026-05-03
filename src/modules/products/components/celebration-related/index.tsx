import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"
import { getProducts, getRegion } from "@lib/data"
import { getProductType } from "@lib/util/product-guards"
import { PRODUCT_TYPE_LABELS, OCCASION_MAP } from "@lib/constants"
import type { OccasionCollection, ProductType } from "@lib/types/product-contract"
import ProductPreview from "../product-preview"

type Props = {
  product: PricedProduct
}

export default async function CelebrationRelated({ product }: Props) {
  const region = await getRegion()
  if (!region) return null

  const currentType = getProductType(product)
  const occasionSlug = product.collection?.handle as OccasionCollection | undefined
  const occasionConfig = occasionSlug ? OCCASION_MAP[occasionSlug] : undefined

  if (!occasionConfig || !currentType) return null

  // Get other product types for this occasion (exclude current type)
  const otherTypes = occasionConfig.sectionOrder.filter((t) => t !== currentType)

  // Fetch 2 products per other type
  const sections = await Promise.all(
    otherTypes.slice(0, 3).map(async (type) => {
      const { previews } = await getProducts({
        type,
        collection: occasionSlug!,
        limit: 2,
      })
      return { type, previews }
    })
  )

  const populated = sections.filter((s) => s.previews.length > 0)
  if (populated.length === 0) return null

  return (
    <div className="bg-cf-warm py-12">
      <div className="content-container">
        <div className="text-center mb-8">
          <span className="text-base">{occasionConfig.emoji}</span>
          <h3 className="cf-heading text-2xl mt-1">
            Complete Your{" "}
            <span className="gradient-cf-text">
              {occasionConfig.label}
            </span>{" "}
            Celebration
          </h3>
          <p className="text-sm text-ui-fg-muted mt-2">
            Don&apos;t forget these — perfect additions for your celebration
          </p>
        </div>

        <div className="space-y-8">
          {populated.map(({ type, previews }) => {
            const typeInfo = PRODUCT_TYPE_LABELS[type]
            return (
              <div key={type}>
                <h4 className="text-sm font-semibold text-ui-fg-muted uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span>{typeInfo.emoji}</span>
                  {typeInfo.label}
                </h4>
                <ul className="grid grid-cols-2 small:grid-cols-4 gap-4">
                  {previews.map((preview) => (
                    <li key={preview.id}>
                      <ProductPreview
                        productPreview={preview}
                        region={region}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
