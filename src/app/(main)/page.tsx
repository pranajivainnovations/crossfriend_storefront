import { Product } from "@medusajs/medusa"
import { Metadata } from "next"

import { getCollectionsList, getProductsList, getRegion } from "@lib/data"
import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import TrustBar from "@modules/home/components/trust-bar"
import OccasionGrid from "@modules/home/components/occasion-grid"
import CategoryStrip from "@modules/home/components/category-strip"
import HowItWorks from "@modules/home/components/how-it-works"
import Testimonials from "@modules/home/components/testimonials"
import CtaBanner from "@modules/home/components/cta-banner"
import { ProductCollectionWithPreviews } from "types/global"
import { cache } from "react"

// Never prerender — always fetch fresh from Medusa at request time
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
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
      const { collections } = await getCollectionsList(0, 3)

      if (!collections) {
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
  const collections = await getCollectionsWithProducts()
  const region = await getRegion()

  if (!collections || !region) {
    return null
  }

  return (
    <>
      {/* Hero — full-width immersive header */}
      <Hero />

      {/* Trust signals — builds confidence immediately */}
      <TrustBar />

      {/* Occasion grid — visual, bento-style browsing */}
      <OccasionGrid />

      {/* Quick category strip — horizontal scroll */}
      <CategoryStrip />

      {/* Featured product collections */}
      <div className="bg-grey-5/50">
        <ul className="flex flex-col">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>

      {/* How it works — 3 steps */}
      <HowItWorks />

      {/* Customer testimonials */}
      <Testimonials />

      {/* Bottom CTA banner */}
      <CtaBanner />
    </>
  )
}
