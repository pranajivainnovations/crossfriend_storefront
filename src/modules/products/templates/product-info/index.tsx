import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductType, isCake, getMetadata } from "@lib/util/product-guards"
import CakeUrgencyBadge from "@modules/products/components/cake-urgency-badge"

type ProductInfoProps = {
  product: PricedProduct
}

/**
 * Turns the baker's stored lead time into the phrase a customer needs.
 *
 * The stored number is the upper bound of the band the baker chose, so this reads as "ready within
 * X" rather than an exact promise. Days are used past 24 hours because nobody plans a cake in
 * 48-hour units.
 */
function formatLeadTime(hours: number): string | undefined {
  if (!Number.isFinite(hours) || hours < 0) return undefined
  if (hours === 0) return "Ready now"
  if (hours <= 12) return `Ready in about ${hours} hours`
  if (hours <= 24) return "Ready same day"

  const days = Math.round(hours / 24)
  if (days <= 7) return `Ready in about ${days} day${days === 1 ? "" : "s"}`
  return "Ready in over a week"
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const productType = getProductType(product)
  const meta = getMetadata(product)
  const isCakeProduct = isCake(product)

  // Not part of the typed ProductMetadata contract — these are written by the baker portal at
  // product-creation time and are absent on every house-catalogue product, so they are read
  // defensively rather than added to the shared contract.
  const rawMeta = (product.metadata ?? {}) as Record<string, unknown>
  const bakerName = typeof rawMeta.baker_name === "string" ? rawMeta.baker_name : undefined
  const bakerSlug = typeof rawMeta.baker_slug === "string" ? rawMeta.baker_slug : undefined

  // Lead time the baker committed to, stored as the upper bound of a band in hours.
  const prepHours = Number(rawMeta.prep_hours)
  const readyIn = Number.isFinite(prepHours) ? formatLeadTime(prepHours) : undefined

  // Derive type label from product type value
  const typeLabel = productType
    ? productType.charAt(0).toUpperCase() + productType.slice(1)
    : undefined

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
          {product.collection && (
            <>
              <LocalizedClientLink
                href={`/collections/${product.collection.handle}`}
                className="hover:text-cf-orange transition-colors"
              >
                {product.collection.title}
              </LocalizedClientLink>
              <span>/</span>
            </>
          )}
          {typeLabel && (
            <>
              <LocalizedClientLink
                href={`/store?type=${productType}`}
                className="hover:text-cf-orange transition-colors"
              >
                {typeLabel}
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

        {/* Who made it. Read from product metadata, which is denormalised at creation time, so a
            product page costs no extra query to attribute. Ownership itself lives in
            baker_network.baker_products — this is a rendering cache, never an authority. */}
        {bakerName && (
          <div className="rounded-large border border-cf-purple-100 bg-cf-purple-50 px-4 py-3">
            <div className="flex items-center gap-x-2">
              <span className="text-small-regular text-grey-50">From</span>
              {bakerSlug ? (
                <LocalizedClientLink
                  href={`/bakers/${bakerSlug}`}
                  className="text-base-semi text-cf-purple-700 hover:underline"
                >
                  {bakerName}
                </LocalizedClientLink>
              ) : (
                <span className="text-base-semi text-grey-90">{bakerName}</span>
              )}
            </div>
            {readyIn && (
              <p className="mt-1 text-small-regular text-grey-60">
                <span aria-hidden="true">🕒</span> {readyIn}
              </p>
            )}
          </div>
        )}

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
