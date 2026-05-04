import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getOccasions } from "@lib/data/dynamic"
import {
  FadeInSection,
  StaggerGrid,
  StaggerItem,
} from "@modules/common/components/motion"

const GRADIENTS = [
  "from-orange-50 to-rose-50",
  "from-purple-50 to-indigo-50",
  "from-amber-50 to-yellow-50",
  "from-emerald-50 to-teal-50",
  "from-pink-50 to-fuchsia-50",
  "from-sky-50 to-cyan-50",
  "from-rose-50 to-pink-50",
]

export default async function OccasionGrid() {
  const occasions = await getOccasions()

  if (occasions.length === 0) return null

  return (
    <section id="occasions" className="content-container py-16 small:py-24">
      <FadeInSection className="text-center mb-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cf-purple/5 text-cf-purple text-xs font-semibold uppercase tracking-wider mb-4">
          🎉 Celebrations
        </span>
        <h2 className="font-heading font-bold text-3xl small:text-4xl text-grey-90 mb-3">
          What are you celebrating?
        </h2>
        <p className="text-grey-50 text-sm small:text-base max-w-md mx-auto">
          Pick your occasion and discover curated collections just for you.
        </p>
      </FadeInSection>

      {/* Bento grid: first item large, rest smaller */}
      <StaggerGrid className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4 auto-rows-[180px] small:auto-rows-[200px]">
        {occasions.map((occasion, index) => {
          const isLarge = index === 0
          const gradient = GRADIENTS[index % GRADIENTS.length]

          return (
            <StaggerItem
              key={occasion.slug}
              className={isLarge ? "col-span-2 row-span-2" : ""}
            >
              <LocalizedClientLink
                href={`/occasions/${occasion.slug}`}
                className={`group relative flex flex-col items-center justify-center h-full rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} border border-grey-10 hover:border-cf-orange/30 hover:shadow-lg transition-all duration-300`}
              >
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-cf-orange/0 group-hover:bg-cf-orange/5 transition-colors duration-300" />

                {/* Emoji */}
                <span className={`relative ${isLarge ? "text-6xl small:text-7xl" : "text-4xl small:text-5xl"} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  {occasion.emoji}
                </span>

                {/* Label */}
                <span className={`relative font-heading font-semibold ${isLarge ? "text-lg small:text-xl" : "text-sm small:text-base"} text-grey-80 group-hover:text-cf-orange transition-colors duration-200`}>
                  {occasion.label}
                </span>

                {/* Tagline */}
                <span className={`relative text-xs text-grey-50 mt-1 ${isLarge ? "block" : "hidden small:block"}`}>
                  {occasion.tagline}
                </span>

                {/* Arrow on hover */}
                <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                  <svg className="w-3.5 h-3.5 text-cf-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </LocalizedClientLink>
            </StaggerItem>
          )
        })}
      </StaggerGrid>
    </section>
  )
}
