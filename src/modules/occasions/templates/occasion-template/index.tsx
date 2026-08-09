import { Suspense } from "react"
import type { DynamicOccasion } from "@lib/data/dynamic"
import { getProductTypes } from "@lib/data/dynamic"
import { getOccasionTypeValues } from "@lib/data/taxonomy"
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
  // Which type sections this occasion shows, and in what order — both come from the taxonomy
  // matrix (OPS → Taxonomy), so adding "Bouquets to Anniversary" is a checkbox, not a deploy.
  //
  // The matrix decides ORDER, so the sections are built by walking it rather than by filtering the
  // type list: filtering would silently re-impose the type registry's own ordering and discard the
  // per-occasion sequence ops set. Both calls share one taxonomy fetch (React cache).
  const [allTypes, mappedValues] = await Promise.all([
    getProductTypes(),
    getOccasionTypeValues(occasion.slug),
  ])
  const byValue = new Map(allTypes.map((t) => [t.value, t]))
  const productTypes = mappedValues
    .map((v) => byValue.get(v))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

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
