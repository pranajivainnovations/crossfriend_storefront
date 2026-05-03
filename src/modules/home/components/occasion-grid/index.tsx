import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { OCCASIONS } from "@lib/constants"
import {
  FadeInSection,
  StaggerGrid,
  StaggerItem,
} from "@modules/common/components/motion"

export default function OccasionGrid() {
  return (
    <section id="occasions" className="content-container py-12 small:py-20">
      <FadeInSection className="text-center mb-10">
        <h2 className="cf-heading text-2xl small:text-4xl mb-3">
          Shop by <span className="gradient-cf-text">Occasion</span>
        </h2>
        <p className="text-ui-fg-subtle text-sm small:text-base max-w-md mx-auto">
          Find everything you need for your celebration — curated by occasion.
        </p>
      </FadeInSection>

      <StaggerGrid className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-5 gap-4">
        {OCCASIONS.map((occasion) => (
          <StaggerItem key={occasion.slug}>
            <LocalizedClientLink
              href={`/occasions/${occasion.slug}`}
              className="group relative flex flex-col items-center justify-center rounded-2xl p-6 small:p-8 bg-gradient-to-br hover-lift card-cf text-center"
            >
              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${occasion.gradient} opacity-5 group-hover:opacity-15 transition-opacity duration-300`}
              />

              {/* Emoji */}
              <span className="relative text-4xl small:text-5xl mb-3 group-hover:animate-bounce-in">
                {occasion.emoji}
              </span>

              {/* Label */}
              <span className="relative font-heading font-semibold text-sm small:text-base text-grey-80 group-hover:text-cf-orange transition-colors">
                {occasion.label}
              </span>

              {/* Tagline */}
              <span className="relative text-xs text-ui-fg-muted mt-1 hidden small:block">
                {occasion.tagline}
              </span>
            </LocalizedClientLink>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  )
}
