import { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getProductByHandle,
  getProductsList,
  getRegion,
  listRegions,
  retrievePricedProductById,
} from "@lib/data"
import { Region } from "@medusajs/medusa"
import { productToItem, toMajorUnits } from "@lib/analytics/ecommerce"
import TrackEvent from "@modules/analytics/components/track-event"
import ProductTemplate from "@modules/products/templates"
import { buildProductJsonLd } from "@lib/util/product-jsonld"
import { breadcrumbJsonLd, jsonLdScriptProps, plainText } from "@lib/util/seo"

/**
 * Dynamic, but not cache-hostile.
 *
 * force-dynamic is back because this page fetches catalogue data through the Medusa client and
 * touches no cookies, so without it Next prerenders it during `next build`. That works locally,
 * where MEDUSA_BACKEND_URL points at the live backend, and fails inside Docker, where it points at
 * localhost:9001 and nothing is listening — which is exactly how it broke the image build.
 *
 * fetchCache is set explicitly because force-dynamic otherwise implies `force-no-store` for every
 * fetch in the route, layouts included. That is what previously stopped getSiteSettings,
 * getAnnouncement and getTaxonomy from ever caching despite each asking for `revalidate: 60`.
 * "default-cache" keeps rendering per-request while letting those honour their own revalidate.
 */
export const dynamic = "force-dynamic"
export const fetchCache = "default-cache"

type Props = {
  params: { handle: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = params

  const { product } = await getProductByHandle(handle).then(
    (product) => product
  )

  /**
   * Returns empty metadata rather than calling notFound() here.
   *
   * notFound() inside generateMetadata renders the not-found UI but leaves the response status at
   * 200, because metadata resolves after the status has been committed. The page then looks like a
   * 404 to a human and reads as a normal page to a crawler — which is precisely Search Console's
   * definition of a Soft 404, and was the site's single largest indexing bucket (231 pages).
   *
   * The status has to come from the page component below, which calls notFound() for the same
   * condition and does produce a real 404. Metadata for a page that will not render is unused.
   */
  if (!product) {
    return {}
  }

  /**
   * seo_title and seo_description are written at product creation by the baker portal
   * (buildBakerProductMetadata), capped at the lengths search engines actually display — and until
   * now nothing read them back. Prefer the curated copy, fall back to the description.
   *
   * plainText also fixes a subtler bug in the old code: `description.slice(0, 160)` could cut a
   * word in half and, if the description contained markup, emit a fragment of a tag into a meta
   * tag.
   */
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const seoTitle =
    typeof metadata.seo_title === "string" && metadata.seo_title.trim()
      ? metadata.seo_title.trim()
      : product.title
  const description =
    (typeof metadata.seo_description === "string" && metadata.seo_description.trim()
      ? metadata.seo_description.trim()
      : plainText(product.description, 160)) ||
    `Buy ${product.title} online at CrossFriend. Same-day delivery available.`

  return {
    title: seoTitle,
    description,
    openGraph: {
      title: seoTitle,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
    alternates: {
      canonical: `/products/${handle}`,
    },
  }
}

const getPricedProductByHandle = async (handle: string, region: Region) => {
  const { product } = await getProductByHandle(handle).then(
    (product) => product
  )

  if (!product || !product.id) {
    return null
  }

  const pricedProduct = await retrievePricedProductById({
    id: product.id,
    regionId: region.id,
  })

  return pricedProduct
}

export default async function ProductPage({ params }: Props) {
  const region = await getRegion()

  if (!region) {
    notFound()
  }

  const pricedProduct = await getPricedProductByHandle(params.handle, region)

  if (!pricedProduct) {
    notFound()
  }

  // Returns null when there is nothing truthful to say — no variants, or no real price. Emitting
  // a Product block with a zero price is worse than emitting nothing.
  const productJsonLd = buildProductJsonLd({
    product: pricedProduct,
    region,
    handle: params.handle,
  })

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Shop", path: "/store" },
    { name: pricedProduct.title ?? params.handle, path: `/products/${params.handle}` },
  ])

  return (
    <>
      {productJsonLd && <script {...jsonLdScriptProps(productJsonLd)} />}
      <script {...jsonLdScriptProps(breadcrumbs)} />
      {/* Keyed on the handle so navigating between two products reports both, while a re-render of
          the same one does not. */}
      <TrackEvent
        name="view_item"
        dedupeKey={pricedProduct.handle ?? undefined}
        payload={{
          currency: region.currency_code?.toUpperCase(),
          value: toMajorUnits(
            pricedProduct.variants?.[0]?.calculated_price ?? 0,
            region.currency_code
          ),
          items: [
            productToItem(pricedProduct, {
              price: pricedProduct.variants?.[0]?.calculated_price ?? undefined,
              currencyCode: region.currency_code,
            }),
          ],
        }}
      />
      <ProductTemplate product={pricedProduct} region={region} />
    </>
  )
}
