import { Metadata } from "next"
import { getCollectionsList } from "@lib/data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  FadeInSection,
  StaggerGrid,
  StaggerItem,
} from "@modules/common/components/motion"

export const revalidate = 300

export const metadata: Metadata = {
  title: "All Collections",
  description:
    "Browse our curated collections — birthday essentials, anniversary specials, festive packs, kids party kits, and more.",
  openGraph: {
    title: "Shop by Collection | CrossFriend",
    description:
      "Browse our curated collections — birthday essentials, anniversary specials, festive packs, and more.",
  },
}

export default async function CollectionsPage() {
  const { collections } = await getCollectionsList(0, 100)

  return (
    <div className="bg-cf-warm min-h-screen">
      <div className="content-container py-12 small:py-20">
        {/* Hero heading */}
        <FadeInSection className="text-center mb-12">
          <h1 className="cf-heading text-3xl small:text-5xl mb-3">
            Our <span className="gradient-cf-text">Collections</span>
          </h1>
          <p className="text-ui-fg-subtle text-base small:text-lg max-w-lg mx-auto">
            Thoughtfully curated product groups for every occasion. Browse and
            find exactly what you need.
          </p>
        </FadeInSection>

        {/* Collections grid */}
        <StaggerGrid className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {collections?.map((collection) => (
            <StaggerItem key={collection.id}>
              <LocalizedClientLink
                href={`/collections/${collection.handle}`}
                className="group block"
              >
                <div className="card-cf p-6 small:p-8 text-center hover-lift h-full flex flex-col justify-center min-h-[180px] relative overflow-hidden">
                  {/* Gradient accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cf-orange/5 to-cf-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10">
                    <h2 className="cf-heading text-lg small:text-xl mb-2 group-hover:text-cf-orange transition-colors">
                      {collection.title}
                    </h2>
                    {collection.metadata?.description && (
                      <p className="text-sm text-ui-fg-subtle line-clamp-2">
                        {collection.metadata.description as string}
                      </p>
                    )}
                    <span className="inline-block mt-3 text-sm font-medium text-cf-orange group-hover:translate-x-1 transition-transform">
                      Explore →
                    </span>
                  </div>
                </div>
              </LocalizedClientLink>
            </StaggerItem>
          ))}
        </StaggerGrid>

        {(!collections || collections.length === 0) && (
          <div className="text-center py-20 text-ui-fg-muted">
            <p className="text-lg">No collections available yet.</p>
            <p className="text-sm mt-2">Check back soon — we&apos;re adding new ones!</p>
          </div>
        )}
      </div>
    </div>
  )
}
