import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getBakerBySlug } from "@lib/data/bakers"
import { getProductsById, getRegion } from "@lib/data"
import transformProductPreview from "@lib/util/transform-product-preview"
import BakerBadges from "@modules/bakers/components/baker-badges"
import ProductPreview from "@modules/products/components/product-preview"
import {
  ORGANIZATION_ID,
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScriptProps,
  plainText,
} from "@lib/util/seo"

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getBakerBySlug(params.slug)
  if (!data) return { title: "Baker not found" }

  const { baker } = data
  const location = [baker.city, baker.state].filter(Boolean).join(", ")
  const description =
    plainText(baker.bio, 155) ||
    `Order cakes and desserts from ${baker.name}${location ? ` in ${location}` : ""} on CrossFriend.`

  return {
    // The bakery's own name plus where it is. "Butter Berry" alone competes with every bakery of
    // that name in the country; "Butter Berry, Meerut" is what someone nearby actually types.
    title: location ? `${baker.name} — ${location}` : baker.name,
    description,
    openGraph: {
      title: baker.name,
      description,
      images: baker.coverUrl || baker.photoUrl ? [baker.coverUrl || baker.photoUrl!] : undefined,
    },
    alternates: {
      canonical: `/bakers/${params.slug}`,
    },
  }
}

/**
 * A baker's public profile, and everything they have published.
 *
 * Products are resolved in two steps on purpose. This route returns the Medusa product IDS the
 * baker owns (ownership lives in baker_network), and those are then passed to Medusa's own product
 * API — so prices, regions and sales-channel rules are applied by Medusa rather than reimplemented
 * here. A product the baker owns but has not published never appears in the id list at all, and
 * would also be filtered by Medusa even if it did.
 *
 * "Order" goes through the existing cart and checkout. There is no second ordering path.
 */
export default async function BakerProfilePage({ params }: Props) {
  const data = await getBakerBySlug(params.slug)
  if (!data) {
    notFound()
  }

  const { baker, productIds } = data
  const location = [baker.city, baker.state].filter(Boolean).join(", ")

  // Only ask Medusa for products if this baker actually has any — an empty `id` filter would
  // otherwise return the entire catalogue.
  const region = await getRegion("in")
  const priced =
    productIds.length && region
      ? await getProductsById({ ids: productIds, regionId: region.id }).catch(() => [])
      : []

  // Same transform the store and category pages use, so a baker's products carry identical price
  // formatting and preview shape to every other product card in the storefront.
  const products =
    region && priced ? priced.map((p) => transformProductPreview(p, region)) : []

  /**
   * Bakery is a subtype of FoodEstablishment, which is a LocalBusiness — the type Google uses for
   * "cake shop near me". City and state are the strongest signal here, so they are always present
   * even when the street address is not, which is the normal case: we hold the area a bakery serves
   * long before we hold its doorway.
   *
   * Deliberately NO aggregateRating. `rating` and `reviewCount` on this profile come from Google
   * Places, not from customers of CrossFriend. Marking up a third party's ratings as though they
   * were our own breaks Google's own rule that review markup must reflect reviews collected by the
   * site, and risks a manual action against the whole domain. When CrossFriend collects its own
   * reviews, this is where they belong.
   */
  const bakerUrl = absoluteUrl(`/bakers/${params.slug}`)
  const bakeryJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": `${bakerUrl}#bakery`,
    name: baker.name,
    url: bakerUrl,
    description:
      plainText(baker.bio, 300) ||
      `${baker.name}${location ? ` in ${location}` : ""} sells cakes and desserts on CrossFriend.`,
    address: {
      "@type": "PostalAddress",
      ...(baker.city ? { addressLocality: baker.city } : {}),
      ...(baker.state ? { addressRegion: baker.state } : {}),
      ...(baker.pincode ? { postalCode: baker.pincode } : {}),
      addressCountry: "IN",
    },
    parentOrganization: { "@id": ORGANIZATION_ID },
  }

  const bakerImage = baker.photoUrl || baker.coverUrl
  if (bakerImage) bakeryJsonLd.image = [bakerImage]
  if (baker.websiteUrl) bakeryJsonLd.sameAs = [baker.websiteUrl]
  if (baker.specialties?.length) bakeryJsonLd.knowsAbout = baker.specialties
  if (products.length) {
    bakeryJsonLd.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: `Products from ${baker.name}`,
      itemListElement: products.slice(0, 30).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/products/${product.handle}`),
        name: product.title,
      })),
    }
  }

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Bakers", path: "/bakers" },
    { name: baker.name, path: `/bakers/${params.slug}` },
  ])

  return (
    <div className="pb-16">
      <script {...jsonLdScriptProps(bakeryJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbs)} />
      {/* Cover */}
      <div className="relative h-48 w-full overflow-hidden bg-cf-purple-100 small:h-64">
        {baker.coverUrl ? (
          <Image
            src={baker.coverUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-cf-purple-100 via-cf-warm to-cf-yellow-light" />
        )}
      </div>

      <div className="content-container">
        {/* Identity */}
        <div className="-mt-12 flex flex-col gap-y-4 small:-mt-14 small:flex-row small:items-end small:gap-x-6">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-large border-4 border-white bg-cf-purple-50 small:h-28 small:w-28">
            {baker.photoUrl ? (
              <Image
                src={baker.photoUrl}
                alt={baker.name}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-3xl font-bold text-cf-purple-300" aria-hidden="true">
                  {baker.name.trim().charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-x-2">
              <h1 className="text-2xl-semi text-grey-90">{baker.name}</h1>
              <BakerBadges blueTick={baker.blueTick} trustBadge={baker.trustBadge} />
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-base-regular text-grey-50">
              {baker.rating != null && (
                <span className="flex items-center gap-x-1 text-grey-70">
                  <span className="text-cf-yellow" aria-hidden="true">★</span>
                  <span className="font-semibold tabular-nums">{baker.rating.toFixed(1)}</span>
                  {baker.reviewCount > 0 && <span>({baker.reviewCount} reviews)</span>}
                </span>
              )}
              {location && <span>{location}</span>}
              {baker.turnaroundHours != null && (
                <span>
                  Usually ready in{" "}
                  {baker.turnaroundHours < 24
                    ? `${baker.turnaroundHours} hrs`
                    : `${Math.round(baker.turnaroundHours / 24)} day${
                        Math.round(baker.turnaroundHours / 24) === 1 ? "" : "s"
                      }`}
                </span>
              )}
            </div>
          </div>
        </div>

        {baker.bio && (
          <p className="mt-6 max-w-3xl text-base-regular leading-relaxed text-grey-70">
            {baker.bio}
          </p>
        )}

        {baker.specialties.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {baker.specialties.map((tag) => (
              <li
                key={tag}
                className="rounded-circle bg-cf-purple-50 px-3 py-1 text-small-regular text-cf-purple-700"
              >
                {tag.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        )}

        {/* Products */}
        <section className="mt-12">
          <h2 className="mb-6 text-xl-semi text-grey-90">Ready to Order</h2>

          {products.length === 0 ? (
            <div className="rounded-large border border-dashed border-grey-20 px-6 py-14 text-center">
              <p className="text-base-semi text-grey-70">Nothing listed just yet</p>
              <p className="mt-2 text-base-regular text-grey-50">
                {baker.name} hasn&apos;t published any items yet. In the meantime you can{" "}
                <Link href="/ai-cake-studio" className="text-cf-purple underline">
                  design your own cake
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul
              className="grid grid-cols-2 gap-x-6 gap-y-8 small:grid-cols-3 medium:grid-cols-4"
              data-testid="baker-products"
            >
              {products.map((product) => (
                <li key={product.id}>
                  <ProductPreview productPreview={product} region={region!} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-12">
          <Link
            href="/bakers"
            className="text-base-regular text-cf-purple underline hover:text-cf-purple-700"
          >
            ← All bakers
          </Link>
        </div>
      </div>
    </div>
  )
}
