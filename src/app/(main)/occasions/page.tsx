import { Metadata } from "next"
import { getOccasions } from "@lib/data/dynamic"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  FadeInSection,
  StaggerGrid,
  StaggerItem,
} from "@modules/common/components/motion"

export const revalidate = 300

export const metadata: Metadata = {
  title: "All Occasions | CrossFriend",
  description:
    "Browse celebrations by occasion — birthdays, anniversaries, festivals, kids events, and more.",
  openGraph: {
    title: "Shop by Occasion | CrossFriend",
    description:
      "Browse celebrations by occasion — birthdays, anniversaries, festivals, kids events, and more.",
  },
}

export default async function OccasionsPage() {
  const occasions = await getOccasions()

  return (
    <div className="bg-cf-warm min-h-screen">
      <div className="content-container py-12 small:py-20">
        {/* Heading */}
        <FadeInSection className="text-center mb-12">
          <h1 className="cf-heading text-3xl small:text-5xl mb-3">
            Shop by <span className="gradient-cf-text">Occasion</span>
          </h1>
          <p className="text-ui-fg-subtle text-base small:text-lg max-w-md mx-auto">
            Every celebration deserves something special. Pick your occasion and
            we&apos;ll curate the perfect selection.
          </p>
        </FadeInSection>

        {/* Occasion cards grid */}
        <StaggerGrid className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {occasions.map((occasion) => (
            <StaggerItem key={occasion.slug}>
              <LocalizedClientLink
                href={`/occasions/${occasion.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-white hover-lift block"
              >
                {/* Gradient background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${occasion.gradient} opacity-5 group-hover:opacity-15 transition-opacity duration-300`}
                />

                <div className="relative p-8 flex flex-col items-center text-center gap-3">
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {occasion.emoji}
                  </span>
                  <h2 className="font-heading font-semibold text-xl text-grey-80 group-hover:text-cf-orange transition-colors">
                    {occasion.label}
                  </h2>
                  <p className="text-sm text-ui-fg-muted leading-relaxed">
                    {occasion.tagline}
                  </p>
                  <span className="mt-2 text-sm font-medium text-cf-orange opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Explore →
                  </span>
                </div>
              </LocalizedClientLink>
            </StaggerItem>
          ))}
        </StaggerGrid>

        {occasions.length === 0 && (
          <div className="text-center py-20 text-ui-fg-muted">
            <p className="text-lg">No occasions available yet.</p>
            <p className="text-sm mt-2">Check back soon — new occasions are coming!</p>
          </div>
        )}
      </div>
    </div>
  )
}
