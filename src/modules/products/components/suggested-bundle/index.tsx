import { getProducts, getRegion } from "@lib/data"
import { getProductPrice } from "@lib/util/get-product-price"
import { PRODUCT_TYPE_LABELS, type OccasionConfig } from "@lib/constants"
import type { ProductType } from "@lib/types/product-contract"
import SuggestedBundleClient, { type BundleItem } from "./client"

type Props = {
  occasion: OccasionConfig
}

export default async function SuggestedBundle({ occasion }: Props) {
  const region = await getRegion()
  if (!region) return null

  // Pick the top 3 types for this occasion's bundle
  const bundleTypes = occasion.sectionOrder.slice(0, 3)

  const items: BundleItem[] = []

  for (const type of bundleTypes) {
    const { products } = await getProducts({
      type,
      collection: occasion.slug,
      limit: 1,
    })

    // Fallback to any product of this type
    let product = products[0]
    if (!product) {
      const fallback = await getProducts({ type, limit: 1 })
      product = fallback.products[0]
    }

    if (!product || !product.variants?.[0]?.id) continue

    const { cheapestPrice } = getProductPrice({ product, region })
    const typeInfo = PRODUCT_TYPE_LABELS[type]

    items.push({
      type: typeInfo.label,
      typeEmoji: typeInfo.emoji,
      title: product.title || "",
      thumbnail: product.thumbnail || null,
      variantId: product.variants[0].id,
      price: cheapestPrice?.calculated_price || "",
    })
  }

  if (items.length < 2) return null

  return (
    <SuggestedBundleClient
      occasionLabel={occasion.label}
      occasionEmoji={occasion.emoji}
      items={items}
    />
  )
}
