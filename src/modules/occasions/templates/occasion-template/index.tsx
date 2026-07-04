import { Suspense } from "react"
import type { DynamicOccasion } from "@lib/data/dynamic"
import { getProductTypes } from "@lib/data/dynamic"
import { getOccasionTypes } from "@lib/config/occasion-map.server"
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
  // Fetch all crossfriend product types, then keep only those
  // that type-occasion-map.json says belong on this occasion page.
  // Edit src/lib/config/type-occasion-map.json + call /api/revalidate to update without redeployment.
  const allTypes = await getProductTypes()
  const mappedTypeValues = getOccasionTypes(occasion.slug)
  const productTypes = allTypes.filter((pt) =>
    mappedTypeValues.includes(pt.value as any)
  )

  return (
    <div>
      {/* Hero */}
      <OccasionHero occasion={occasion} />

      {/* Quick-Add Kit */}
      <QuickAddKit occasion={occasion.slug as any} />

      {/* Product sections — only types mapped to this occasion */}
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
