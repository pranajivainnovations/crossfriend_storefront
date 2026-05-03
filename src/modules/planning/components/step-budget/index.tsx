"use client"

import { BUDGET_RANGES, usePlanning } from "@modules/planning/context/planning-context"
import { OCCASION_MAP } from "@lib/constants"

export default function StepBudget() {
  const { occasion, selectBudget, skipBudget, goBack } = usePlanning()

  const occasionLabel = occasion ? OCCASION_MAP[occasion]?.label : ""

  return (
    <div className="flex flex-col items-center">
      <h2 className="cf-heading text-2xl small:text-3xl mb-2 text-center">
        What&apos;s your <span className="gradient-cf-text">budget</span>?
      </h2>
      <p className="text-sm text-ui-fg-muted mb-8 text-center max-w-sm">
        We&apos;ll prioritize {occasionLabel} products in your range — but
        you&apos;ll still see everything.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {BUDGET_RANGES.map((range) => (
          <button
            key={range.label}
            onClick={() => selectBudget(range)}
            className="flex items-center justify-between px-5 py-4 rounded-xl bg-white border-2 border-transparent hover:border-cf-orange hover:shadow-md transition-all duration-200 text-left group"
          >
            <span className="font-heading font-medium text-grey-80 group-hover:text-cf-orange transition-colors">
              {range.label}
            </span>
            <span className="text-ui-fg-muted text-sm group-hover:text-cf-orange transition-colors">
              →
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-6">
        <button
          onClick={goBack}
          className="text-sm text-ui-fg-muted hover:text-ui-fg-base transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={skipBudget}
          className="text-sm font-medium text-cf-orange hover:text-cf-orange-dark transition-colors"
        >
          Skip — show me everything
        </button>
      </div>
    </div>
  )
}
