import { getProducts, getRegion } from "@lib/data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function OccasionSection({
  type,
  typeLabel,
  typeEmoji,
  occasionSlug,
}: {
  type: string
  typeLabel: string
  typeEmoji: string
  occasionSlug: string
}) {
  const region = await getRegion()

  // Call 1 — curated: products explicitly in this occasion's collection
  //           (these are handpicked by the admin for this occasion)
  // Call 2 — by type: all crossfriend products of this type
  //           (TYPE_OCCASION_MAP already guarantees this type belongs here)
  // Run both in parallel, then merge — curated first, no duplicates.
  const [{ previews: curated }, { previews: byType }] = await Promise.all([
    getProducts({ type: type as any, collection: occasionSlug as any, limit: 8 }),
    getProducts({ type: type as any, limit: 8 }),
  ])

  const curatedIds = new Set(curated.map((p) => p.id))
  const products = [
    ...curated,
    ...byType.filter((p) => !curatedIds.has(p.id)),
  ].slice(0, 8)

  // Nothing for this type at all — don't render the section
  if (products.length === 0 || !region) return null

  return (
    <section className="w-full">
      <div className="content-container py-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{typeEmoji}</span>
            <h2 className="cf-heading text-xl small:text-2xl">
              {typeLabel}
            </h2>
          </div>
          <LocalizedClientLink
            href={`/store?type=${type}&collection=${occasionSlug}`}
            className="text-sm font-medium text-cf-orange hover:text-cf-orange-dark transition-colors"
          >
            View All →
          </LocalizedClientLink>
        </div>

        {/* Horizontal scrollable row */}
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {products.map((product) => (
            <div
              key={product.id}
              className="min-w-[220px] max-w-[260px] snap-start shrink-0"
            >
              <ProductPreview productPreview={product} isFeatured={false} region={region} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
