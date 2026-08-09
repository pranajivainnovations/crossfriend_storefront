import { Product } from "@medusajs/medusa"
import { Metadata } from "next"

import { getCollectionsList, getProductsList, getRegion } from "@lib/data"
import { getOccasions } from "@lib/data/dynamic"
import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import TrustBar from "@modules/home/components/trust-bar"
import OccasionGrid from "@modules/home/components/occasion-grid"
import CategoryStrip from "@modules/home/components/category-strip"
import HowItWorks from "@modules/home/components/how-it-works"
import Testimonials from "@modules/home/components/testimonials"
import CtaBanner from "@modules/home/components/cta-banner"
// IntentPaths is retired: the hero now carries both intents itself — the prompt bar is the Studio
// path and "browse cakes ready to order" is the shop path. Two cards restating that immediately
// below the hero asked the same question twice.
import MarketplacePreview from "@modules/home/components/marketplace-preview"
import LocalBakers from "@modules/home/components/local-bakers"
import { ProductCollectionWithPreviews } from "types/global"
import { cache, Suspense } from "react"

// Never prerender — always fetch fresh from Medusa at request time
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "CrossFriend — Make Every Celebration Unforgettable",
  description:
    "Plan your perfect celebration. Shop cakes, decorations, gifts, costumes and more — all in one place. Same-day delivery available.",
  keywords: [
    "celebration",
    "birthday party",
    "cakes",
    "decorations",
    "gifts",
    "costumes",
    "party supplies",
    "anniversary",
    "festival",
    "kids party",
    "same day delivery",
  ],
  openGraph: {
    title: "CrossFriend — Make Every Celebration Unforgettable",
    description:
      "Plan your perfect celebration. Shop cakes, decorations, gifts, costumes and more — all in one place.",
    type: "website",
  },
}

const getCollectionsWithProducts = cache(
  async (): Promise<ProductCollectionWithPreviews[] | null> => {
    try {
      // Occasion collections are excluded here, not merely ordered around.
      //
      // Occasions ARE Medusa collections (that is how the taxonomy stores them), so an unfiltered
      // "first 3 collections" call returned Kids Events and Special Moments — which the occasion
      // grid two sections above already shows. The same three names appeared twice on one page
      // under two different headings.
      //
      // Featured means merchandising collections: Fancy Dresses, Corporate Gifting, Love.
      const [{ collections: all }, occasions] = await Promise.all([
        getCollectionsList(0, 20),
        getOccasions(),
      ])

      if (!all) {
        return null
      }

      const occasionHandles = new Set(occasions.map((o) => o.slug.toLowerCase()))
      const collections = all
        .filter((c) => !occasionHandles.has((c.handle ?? "").toLowerCase()))
        .slice(0, 3)

      if (collections.length === 0) {
        return null
    }

    const collectionIds = collections.map((collection) => collection.id)

    await Promise.all(
      collectionIds.map((id) =>
        getProductsList({
          queryParams: { collection_id: [id] },
        })
      )
    ).then((responses) =>
      responses.forEach(({ response, queryParams }) => {
        let collection

        if (collections) {
          collection = collections.find(
            (collection) => collection.id === queryParams?.collection_id?.[0]
          )
        }

        if (!collection) {
          return
        }

        collection.products = response.products as unknown as Product[]
      })
    )

    return collections as unknown as ProductCollectionWithPreviews[]
    } catch (error) {
      return null
    }
  }
)

export default async function Home() {
  // Independent — collections/products and region resolution don't depend on each other, so there's
  // no reason for the remote-DB round trips to happen one after another.
  const [collections, region] = await Promise.all([getCollectionsWithProducts(), getRegion()])

  if (!collections || !region) {
    return null
  }

  return (
    <>
      {/*
        Order is the design here.

        This page used to be nine sections of near-equal weight — hero, trust bar, intent cards,
        occasions, categories, marketplace, bakers, featured, how-it-works, testimonials, CTA — so
        nothing led and a visitor had no path through it. It now runs:

          1. WHAT THIS IS      the Studio, shown rather than described
          2. WHAT YOU CAN BUY  real products, ready to order
          3. HOW TO NARROW     occasions, then categories
          4. WHO MAKES IT      local bakers — trust, not navigation
          5. REASSURANCE       how it works, then proof

        Each async section streams inside its own Suspense boundary: without one, an async child
        blocks the whole document and the hero — which needs no data — would wait behind a product
        query before anything reached the browser.
      */}
      <Hero />

      {/* Deliberately directly under the hero and nowhere else. Delivery, payment and refund
          promises answer the doubt created by the hero's claim, so they belong against it. */}
      <TrustBar />

      {/* Real products, as high as the data allows. The hero sells the idea; this proves there is
          a shop behind it. Renders nothing when empty, so an onboarding marketplace shows no
          hollow heading. */}
      <Suspense fallback={<div className="h-96" />}>
        <MarketplacePreview />
      </Suspense>

      {/* Now that they have seen product, help them narrow: first by occasion (why they came),
          then by category (what they want). */}
      <Suspense fallback={<div className="h-96" />}>
        <OccasionGrid />
      </Suspense>

      <Suspense fallback={<div className="h-32" />}>
        <CategoryStrip />
      </Suspense>

      {/* Featured collections sit on a tinted band so the page has a seam here rather than one more
          white section in a run of them. */}
      <div className="bg-cf-warm/40">
        <ul className="flex flex-col">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>

      {/* Bakers are supply, not navigation — one quiet row, well below the fold. Making them a peer
          of the Studio and the shop would say CrossFriend is a directory, which it is not. */}
      <Suspense fallback={<div className="h-80" />}>
        <LocalBakers />
      </Suspense>

      <HowItWorks />

      <Testimonials />

      <CtaBanner />
    </>
  )
}
