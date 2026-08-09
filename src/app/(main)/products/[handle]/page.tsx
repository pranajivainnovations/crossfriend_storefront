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
import ProductTemplate from "@modules/products/templates"
import { buildProductJsonLd } from "@lib/util/product-jsonld"
import { breadcrumbJsonLd, jsonLdScriptProps, plainText } from "@lib/util/seo"

export const dynamic = "force-dynamic"

type Props = {
  params: { handle: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = params

  const { product } = await getProductByHandle(handle).then(
    (product) => product
  )

  if (!product) {
    notFound()
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
      <ProductTemplate product={pricedProduct} region={region} />
    </>
  )
}
