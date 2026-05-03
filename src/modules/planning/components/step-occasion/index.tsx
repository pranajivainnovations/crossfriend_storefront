"use client"

import { OCCASIONS } from "@lib/constants"
import { usePlanning } from "@modules/planning/context/planning-context"

export default function StepOccasion() {
  const { selectOccasion } = usePlanning()

  return (
    <div className="flex flex-col items-center">
      <h2 className="cf-heading text-2xl small:text-3xl mb-2 text-center">
        What&apos;s the <span className="gradient-cf-text">occasion</span>?
      </h2>
      <p className="text-sm text-ui-fg-muted mb-8 text-center">
        Pick one and we&apos;ll curate the perfect plan for you.
      </p>

      <div className="grid grid-cols-2 small:grid-cols-3 gap-3 w-full max-w-lg">
        {OCCASIONS.map((occasion) => (
          <button
            key={occasion.slug}
            onClick={() => selectOccasion(occasion.slug)}
            className="group relative flex flex-col items-center gap-2 p-5 rounded-xl bg-white border-2 border-transparent hover:border-cf-orange hover:shadow-md transition-all duration-200 hover-lift"
          >
            <span className="text-3xl group-hover:animate-bounce-in">
              {occasion.emoji}
            </span>
            <span className="font-heading font-medium text-sm text-grey-80 group-hover:text-cf-orange transition-colors">
              {occasion.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
