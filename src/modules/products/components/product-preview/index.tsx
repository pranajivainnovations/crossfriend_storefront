import { Text } from "@medusajs/ui"

import { ProductPreviewType } from "types/global"

import { retrievePricedProductById } from "@lib/data"
import { getProductPrice } from "@lib/util/get-product-price"
import { getProductType, isCake, getMetadata } from "@lib/util/product-guards"
import { Region } from "@medusajs/medusa"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import QuickAddButton from "./quick-add"

export default async function ProductPreview({
  productPreview,
  isFeatured,
  region,
}: {
  productPreview: ProductPreviewType
  isFeatured?: boolean
  region: Region
}) {
  const pricedProduct = await retrievePricedProductById({
    id: productPreview.id,
    regionId: region.id,
  }).then((product) => product)

  if (!pricedProduct) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
    region,
  })

  const productType = getProductType(pricedProduct)
  const meta = getMetadata(pricedProduct)
  const isCakeProduct = productType === "cake"

  // Badge logic
  const badges: { label: string; color: string }[] = []
  if (meta.brand === "pranajiva") {
    badges.push({ label: "Premium", color: "bg-cf-purple text-white" })
  }
  if (meta.is_addon) {
    badges.push({ label: "Add-on", color: "bg-cf-yellow/80 text-grey-90" })
  }
  if (cheapestPrice?.price_type === "sale") {
    badges.push({ label: "Sale", color: "bg-cf-coral text-white" })
  }

  // Quick-add: use first variant for non-cake products with single variant
  const canQuickAdd =
    !isCakeProduct && pricedProduct.variants?.length === 1
  const quickAddVariantId = canQuickAdd ? pricedProduct.variants?.[0]?.id : null

  return (
    <LocalizedClientLink
      href={`/products/${productPreview.handle}`}
      className="group block"
    >
      <div className="card-cf overflow-hidden" data-testid="product-wrapper">
        {/* Image container with hover zoom */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-ui-bg-subtle">
          <Thumbnail
            thumbnail={productPreview.thumbnail}
            size="square"
            isFeatured={isFeatured}
            className="!rounded-none !shadow-none !p-0 group-hover:scale-105 transition-transform duration-300 ease-out"
          />

          {/* Badges */}
          {badges.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${badge.color}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}

          {/* Quick-add overlay (non-cake single-variant only) */}
          {quickAddVariantId && (
            <div className="absolute bottom-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 z-10">
              <QuickAddButton variantId={quickAddVariantId} />
            </div>
          )}

          {/* Cake "Customize" hint */}
          {isCakeProduct && (
            <div className="absolute bottom-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 z-10">
              <span className="block w-full text-center py-2 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-semibold text-cf-orange">
                🎂 Customize →
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 px-1">
          <Text
            className="text-sm font-medium text-grey-80 truncate"
            data-testid="product-title"
          >
            {productPreview.title}
          </Text>
          <div className="flex items-center gap-x-2 mt-1">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
