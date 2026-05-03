import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"
import { getProducts, getRegion } from "@lib/data"
import { isAddon } from "@lib/util/product-guards"
import { getProductPrice } from "@lib/util/get-product-price"
import type { OccasionCollection } from "@lib/types/product-contract"
import AddOnSelectorClient from "./client"

type Props = {
  product: PricedProduct
}

export default async function AddOnSelector({ product }: Props) {
  const region = await getRegion()
  if (!region) return null

  const occasionSlug = product.collection?.handle as
    | OccasionCollection
    | undefined

  // Fetch products from the same collection, look for add-ons
  let addOnProducts: PricedProduct[] = []

  if (occasionSlug) {
    const { products } = await getProducts({
      collection: occasionSlug,
      limit: 20,
    })
    addOnProducts = products.filter(
      (p) => isAddon(p) && p.id !== product.id
    )
  }

  // Fallback: fetch all add-ons if none found in same collection
  if (addOnProducts.length === 0) {
    const { products } = await getProducts({ limit: 30 })
    addOnProducts = products
      .filter((p) => isAddon(p) && p.id !== product.id)
      .slice(0, 6)
  }

  if (addOnProducts.length === 0) return null

  // Transform to serializable data for the client component
  const addOns = addOnProducts
    .map((p) => {
      const firstVariant = p.variants?.[0]
      if (!firstVariant?.id) return null

      const { cheapestPrice } = getProductPrice({ product: p, region })

      return {
        productId: p.id!,
        variantId: firstVariant.id,
        title: p.title || "",
        thumbnail: p.thumbnail || null,
        price: cheapestPrice?.calculated_price || "",
      }
    })
    .filter(Boolean) as {
    productId: string
    variantId: string
    title: string
    thumbnail: string | null
    price: string
  }[]

  if (addOns.length === 0) return null

  return <AddOnSelectorClient addOns={addOns} />
}
