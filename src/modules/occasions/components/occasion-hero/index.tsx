import type { OccasionConfig } from "@lib/constants"
import ConfettiBg from "@modules/common/components/confetti-bg"
import UrgencyBanner from "@modules/common/components/urgency-banner"

export default function OccasionHero({
  occasion,
}: {
  occasion: OccasionConfig
}) {
  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-br ${occasion.gradient} bg-opacity-10`}
    >
      {/* Soft warm overlay so gradient doesn't overpower text */}
      <div className="absolute inset-0 bg-cf-warm/80" />
      <ConfettiBg className="opacity-30" />

      <div className="relative z-10 content-container py-12 small:py-20 flex flex-col items-center text-center gap-4">
        {/* Emoji badge */}
        <span className="text-4xl small:text-6xl animate-bounce-in">
          {occasion.emoji}
        </span>

        {/* Heading */}
        <h1 className="cf-heading text-2xl small:text-5xl leading-tight">
          {occasion.label}{" "}
          <span className="gradient-cf-text">Celebration</span>
        </h1>

        {/* Tagline */}
        <p className="text-ui-fg-subtle text-base small:text-lg max-w-md leading-relaxed">
          {occasion.tagline}
        </p>

        {/* Urgency for cakes */}
        {occasion.sectionOrder[0] === "cake" && (
          <div className="mt-2">
            <UrgencyBanner />
          </div>
        )}
      </div>
    </div>
  )
}
