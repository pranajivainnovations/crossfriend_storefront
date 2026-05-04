import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"
import { getProducts, getRegion } from "@lib/data"
import { getProductType } from "@lib/util/product-guards"
import { getOccasionBySlug, getProductTypes } from "@lib/data/dynamic"
import ProductPreview from "../product-preview"

type Props = {
  product: PricedProduct
}

export default async function CelebrationRelated({ product }: Props) {
  const region = await getRegion()
  if (!region) return null

  const currentType = getProductType(product)
  const occasionSlug = product.collection?.handle
  const occasion = occasionSlug ? await getOccasionBySlug(occasionSlug) : null

  if (!occasion || !currentType) return null

  // Get all product types dynamically, exclude current
  const allTypes = await getProductTypes()
  const otherTypes = allTypes.filter((t) => t.value !== currentType)

  // Fetch 2 products per other type
  const sections = await Promise.all(
    otherTypes.slice(0, 3).map(async (pt) => {
      const { previews } = await getProducts({
        type: pt.value as any,
        collection: occasionSlug!,
        limit: 2,
      })
      return { type: pt.value, label: pt.label, emoji: pt.emoji, previews }
    })
  )

  const populated = sections.filter((s) => s.previews.length > 0)
  if (populated.length === 0) return null

  return (
    <div className="bg-cf-warm py-12">
      <div className="content-container">
        <div className="text-center mb-8">
          <span className="text-base">{occasion.emoji}</span>
          <h3 className="cf-heading text-2xl mt-1">
            Complete Your{" "}
            <span className="gradient-cf-text">
              {occasion.label}
            </span>{" "}
            Celebration
          </h3>
          <p className="text-sm text-ui-fg-muted mt-2">
            Don&apos;t forget these — perfect additions for your celebration
          </p>
        </div>

        <div className="space-y-8">
          {populated.map(({ type, label, emoji, previews }) => (
            <div key={type}>
              <h4 className="text-sm font-semibold text-ui-fg-muted uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span>{emoji}</span>
                {label}
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
          ))}
        </div>
      </div>
    </div>
  )
}
