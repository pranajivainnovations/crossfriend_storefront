import { Product } from "@medusajs/medusa"
import { Metadata } from "next"

import { getCollectionsList, getProductsList, getRegion } from "@lib/data"
import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import OccasionGrid from "@modules/home/components/occasion-grid"
import CategoryStrip from "@modules/home/components/category-strip"
import UrgencyBanner from "@modules/common/components/urgency-banner"
import { ProductCollectionWithPreviews } from "types/global"
import { cache } from "react"

export const metadata: Metadata = {
  title: "CrossFriend — Make Every Celebration Unforgettable",
  description:
    "Plan your perfect celebration. Shop cakes, decorations, gifts, costumes and more — all in one place.",
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
      {/* Hero with gradient + confetti + CTAs */}
      <Hero />

      {/* Same-day delivery urgency banner */}
      <div className="content-container mt-4">
        <UrgencyBanner />
      </div>

      {/* Occasion grid — 5 celebration categories */}
      <OccasionGrid />

      {/* Quick category chips */}
      <CategoryStrip />

      {/* Featured product rails by collection */}
      <div className="bg-cf-warm/40">
        <ul className="flex flex-col">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
