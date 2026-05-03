import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductType, isCake, getMetadata } from "@lib/util/product-guards"
import { PRODUCT_TYPE_LABELS, OCCASION_MAP } from "@lib/constants"
import type { OccasionCollection } from "@lib/types/product-contract"
import CakeUrgencyBadge from "@modules/products/components/cake-urgency-badge"

type ProductInfoProps = {
  product: PricedProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const productType = getProductType(product)
  const meta = getMetadata(product)
  const isCakeProduct = isCake(product)

  // Determine occasion from collection
  const occasionSlug = product.collection?.handle as OccasionCollection | undefined
  const occasionConfig = occasionSlug ? OCCASION_MAP[occasionSlug] : undefined
  const typeLabel = productType ? PRODUCT_TYPE_LABELS[productType] : undefined

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-ui-fg-muted flex-wrap">
          <LocalizedClientLink
            href="/"
            className="hover:text-cf-orange transition-colors"
          >
            Home
          </LocalizedClientLink>
          <span>/</span>
          {occasionConfig && (
            <>
              <LocalizedClientLink
                href={`/occasions/${occasionSlug}`}
                className="hover:text-cf-orange transition-colors"
              >
                {occasionConfig.emoji} {occasionConfig.label}
              </LocalizedClientLink>
              <span>/</span>
            </>
          )}
          {typeLabel && (
            <>
              <LocalizedClientLink
                href={typeLabel.href}
                className="hover:text-cf-orange transition-colors"
              >
                {typeLabel.label}
              </LocalizedClientLink>
              <span>/</span>
            </>
          )}
          <span className="text-ui-fg-base truncate max-w-[200px]">
            {product.title}
          </span>
        </nav>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          {meta.brand === "pranajiva" && (
            <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-cf-purple text-white">
              PranaJiva Premium
            </span>
          )}
          {meta.is_addon && (
            <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-cf-yellow/80 text-grey-90">
              Add-on
            </span>
          )}
        </div>

        {/* Collection link */}
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-cf-orange transition-colors"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}

        {/* Title */}
        <Heading
          level="h2"
          className="cf-heading text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {/* Cake urgency */}
        {isCakeProduct && <CakeUrgencyBadge />}

        {/* Description */}
        <Text
          className="text-medium text-ui-fg-subtle leading-relaxed"
          data-testid="product-description"
        >
          {product.description}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
