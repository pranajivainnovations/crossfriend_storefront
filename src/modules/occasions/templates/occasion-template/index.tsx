import { Suspense } from "react"
import type { DynamicOccasion } from "@lib/data/dynamic"
import { getProductTypes } from "@lib/data/dynamic"
import OccasionHero from "@modules/occasions/components/occasion-hero"
import OccasionSection from "@modules/occasions/components/occasion-section"
import QuickAddKit from "@modules/occasions/components/quick-add-kit"
import SuggestedBundle from "@modules/products/components/suggested-bundle"

function SectionSkeleton() {
  return (
    <div className="content-container py-8 animate-pulse">
      <div className="h-6 w-40 bg-grey-10 rounded mb-6" />
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[220px] h-64 bg-grey-10 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default async function OccasionTemplate({
  occasion,
}: {
  occasion: DynamicOccasion
}) {
  // Fetch all product types dynamically — show sections for each type
  const productTypes = await getProductTypes()

  return (
    <div>
      {/* Hero */}
      <OccasionHero occasion={occasion} />

      {/* Quick-Add Kit */}
      <QuickAddKit occasion={occasion.slug as any} />

      {/* Product sections — one per product type (dynamically fetched) */}
      {productTypes.map((pt) => (
        <Suspense key={pt.value} fallback={<SectionSkeleton />}>
          <OccasionSection
            type={pt.value}
            typeLabel={pt.label}
            typeEmoji={pt.emoji}
            occasionSlug={occasion.slug}
          />
        </Suspense>
      ))}

      {/* Suggested bundle */}
      <Suspense fallback={null}>
        <SuggestedBundle occasion={occasion} />
      </Suspense>
    </div>
  )
}
