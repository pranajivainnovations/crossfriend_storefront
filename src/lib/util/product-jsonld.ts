import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"

import { computeAmount } from "@lib/util/prices"
import { RegionInfo } from "types/global"
import { CalculatedVariant } from "types/medusa"
import { ORGANIZATION_ID, absoluteUrl, plainText } from "@lib/util/seo"

/**
 * Product + Offer structured data — the thing that turns a plain blue link into a result showing
 * price and availability. This is the single highest-value piece of SEO work on the site, and the
 * product page previously emitted none at all.
 *
 * Two rules held throughout:
 *
 * 1. Nothing is invented. There are no reviews, so there is no aggregateRating — fabricating one
 *    is both a lie and a manual-action risk. Fields we cannot substantiate are omitted rather
 *    than guessed.
 * 2. Anything that would contradict the page is omitted. Structured data that disagrees with
 *    visible content is worse than none, because it is treated as an attempt to mislead.
 */

interface ProductMetadata {
  baker_name?: unknown
  baker_slug?: unknown
  seo_description?: unknown
  contains?: unknown
  [key: string]: unknown
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

/**
 * Medusa v1 tracks stock per variant. A variant is purchasable when it is not inventory-managed,
 * when it allows backorder, or when it actually has stock. Anything else is genuinely unavailable
 * and must be reported as such — claiming InStock for something that cannot be bought is the
 * fastest way to lose rich results entirely.
 */
function isPurchasable(variant: { manage_inventory?: boolean; allow_backorder?: boolean; inventory_quantity?: number }): boolean {
  if (variant.manage_inventory === false) return true
  if (variant.allow_backorder) return true
  return (variant.inventory_quantity ?? 0) > 0
}

export function buildProductJsonLd({
  product,
  region,
  handle,
}: {
  product: PricedProduct
  region: RegionInfo
  handle: string
}): Record<string, unknown> | null {
  const variants = (product.variants ?? []) as unknown as CalculatedVariant[]
  if (variants.length === 0) return null

  const url = absoluteUrl(`/products/${handle}`)
  const metadata = (product.metadata ?? {}) as ProductMetadata
  const bakerName = asString(metadata.baker_name)
  const bakerSlug = asString(metadata.baker_slug)
  const currency = region.currency_code?.toUpperCase() || "INR"

  // Prices are stored in minor units. computeAmount applies the currency's divisor and the
  // region's tax rate, so the number here matches what the customer is actually shown.
  const priced = variants
    .map((variant) => ({
      variant,
      amount: computeAmount({
        amount: variant.calculated_price,
        region,
        includeTaxes: false,
      }),
    }))
    .filter((entry) => Number.isFinite(entry.amount) && entry.amount > 0)

  if (priced.length === 0) return null

  const amounts = priced.map((entry) => entry.amount)
  const low = Math.min(...amounts)
  const high = Math.max(...amounts)
  const anyPurchasable = priced.some((entry) => isPurchasable(entry.variant))
  const availability = anyPurchasable
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock"

  // Deduplicated: the thumbnail is normally also the first gallery image, and listing the same
  // URL twice makes the markup look padded for no gain.
  const image = Array.from(
    new Set(
      [product.thumbnail, ...(product.images ?? []).map((i) => i.url)].filter(
        (value): value is string => Boolean(value)
      )
    )
  )

  const description =
    plainText(asString(metadata.seo_description) ?? product.description, 300) ||
    `${product.title} from CrossFriend.`

  /**
   * A single variant gets a plain Offer; several get an AggregateOffer with the real range. Using
   * one price for a multi-size cake would advertise a number the customer may never see.
   */
  const offers =
    priced.length === 1
      ? {
          "@type": "Offer",
          url,
          priceCurrency: currency,
          price: low.toFixed(2),
          availability,
          itemCondition: "https://schema.org/NewCondition",
          seller: bakerName
            ? { "@type": "Organization", name: bakerName }
            : { "@id": ORGANIZATION_ID },
        }
      : {
          "@type": "AggregateOffer",
          url,
          priceCurrency: currency,
          lowPrice: low.toFixed(2),
          highPrice: high.toFixed(2),
          offerCount: priced.length,
          availability,
          seller: bakerName
            ? { "@type": "Organization", name: bakerName }
            : { "@id": ORGANIZATION_ID },
        }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.title,
    description,
    url,
    offers,
  }

  if (image.length) jsonLd.image = image
  if (product.handle) jsonLd.sku = product.handle

  // brand is the maker, not the marketplace — a customer searching a bakery by name should be
  // able to find its products.
  if (bakerName) {
    jsonLd.brand = { "@type": "Brand", name: bakerName }
    if (bakerSlug) {
      jsonLd.manufacturer = {
        "@type": "Organization",
        name: bakerName,
        url: absoluteUrl(`/bakers/${bakerSlug}`),
      }
    }
  }

  // Allergen information is a legal obligation on the page anyway; surfacing it as a property
  // makes it machine-readable rather than buried in prose.
  const contains = Array.isArray(metadata.contains)
    ? metadata.contains.filter((item): item is string => typeof item === "string")
    : []
  if (contains.length) {
    jsonLd.additionalProperty = contains.map((item) => ({
      "@type": "PropertyValue",
      name: "Contains",
      value: item,
    }))
  }

  return jsonLd
}
