import { Metadata } from "next"
import { getCollectionsList } from "@lib/data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  FadeInSection,
  StaggerGrid,
  StaggerItem,
} from "@modules/common/components/motion"

/**
 * Dynamic, but not cache-hostile.
 *
 * force-dynamic is back because this page fetches catalogue data through the Medusa client and
 * touches no cookies, so without it Next prerenders it during `next build`. That works locally,
 * where MEDUSA_BACKEND_URL points at the live backend, and fails inside Docker, where it points at
 * localhost:9001 and nothing is listening — which is exactly how it broke the image build.
 *
 * fetchCache is set explicitly because force-dynamic otherwise implies `force-no-store` for every
 * fetch in the route, layouts included. That is what previously stopped getSiteSettings,
 * getAnnouncement and getTaxonomy from ever caching despite each asking for `revalidate: 60`.
 * "default-cache" keeps rendering per-request while letting those honour their own revalidate.
 */
export const dynamic = "force-dynamic"
export const fetchCache = "default-cache"

export const metadata: Metadata = {
  alternates: { canonical: "/collections" },
  title: "All Collections",
  description:
    "Browse our curated collections — birthday essentials, anniversary specials, festive packs, kids party kits, and more.",
  openGraph: {
    title: "Shop by Collection",
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
                    {collection.metadata?.description ? (
                      <p className="text-sm text-ui-fg-subtle line-clamp-2">
                        {String(collection.metadata.description)}
                      </p>
                    ) : null}
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
