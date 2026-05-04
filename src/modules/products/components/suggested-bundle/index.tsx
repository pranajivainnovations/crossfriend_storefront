import { getProducts, getRegion } from "@lib/data"
import { getProductPrice } from "@lib/util/get-product-price"
import { getProductTypes } from "@lib/data/dynamic"
import type { DynamicOccasion } from "@lib/data/dynamic"
import SuggestedBundleClient, { type BundleItem } from "./client"

type Props = {
  occasion: DynamicOccasion
}

export default async function SuggestedBundle({ occasion }: Props) {
  const region = await getRegion()
  if (!region) return null

  // Fetch product types dynamically and pick top 3 for the bundle
  const allTypes = await getProductTypes()
  const bundleTypes = allTypes.slice(0, 3)

  const items: BundleItem[] = []

  for (const pt of bundleTypes) {
    const { products } = await getProducts({
      type: pt.value as any,
      collection: occasion.slug as any,
      limit: 1,
    })

    // Fallback to any product of this type
    let product = products[0]
    if (!product) {
      const fallback = await getProducts({ type: pt.value as any, limit: 1 })
      product = fallback.products[0]
    }

    if (!product || !product.variants?.[0]?.id) continue

    const { cheapestPrice } = getProductPrice({ product, region })

    items.push({
      type: pt.label,
      typeEmoji: pt.emoji,
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
