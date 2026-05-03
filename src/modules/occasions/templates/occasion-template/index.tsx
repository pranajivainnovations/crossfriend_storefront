import { Suspense } from "react"
import type { OccasionConfig } from "@lib/constants"
import OccasionHero from "@modules/occasions/components/occasion-hero"
import OccasionSection from "@modules/occasions/components/occasion-section"
import QuickAddKit from "@modules/occasions/components/quick-add-kit"
import SuggestedBundle from "@modules/products/components/suggested-bundle"
import PremiumRecommendations from "@modules/products/components/premium-recommendations"

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

export default function OccasionTemplate({
  occasion,
}: {
  occasion: OccasionConfig
}) {
  // Filter section order based on showPremium setting
  const sections = occasion.showPremium
    ? occasion.sectionOrder
    : occasion.sectionOrder.filter((t) => t !== "wellness")

  return (
    <div>
      {/* Hero */}
      <OccasionHero occasion={occasion} />

      {/* Quick-Add Kit */}
      <QuickAddKit occasion={occasion.slug} />

      {/* Product sections in priority order */}
      {sections.map((type) => (
        <Suspense key={type} fallback={<SectionSkeleton />}>
          <OccasionSection type={type} occasion={occasion} />
        </Suspense>
      ))}

      {/* PranaJiva premium section — only for eligible occasions */}
      {occasion.showPremium && (
        <Suspense fallback={null}>
          <PremiumRecommendations occasion={occasion} />
        </Suspense>
      )}

      {/* Suggested bundle */}
      <Suspense fallback={null}>
        <SuggestedBundle occasion={occasion} />
      </Suspense>
    </div>
  )
}
