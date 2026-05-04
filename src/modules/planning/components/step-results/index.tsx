"use client"

import { useEffect, useState, useTransition } from "react"
import { usePlanning } from "@modules/planning/context/planning-context"
import { fetchWizardResults, type WizardResultsPayload } from "@modules/planning/actions"
import type { DynamicOccasion } from "@lib/data/dynamic"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { ProductPreviewType } from "types/global"

function ProductCard({
  product,
  dimmed = false,
  onClose,
}: {
  product: ProductPreviewType
  dimmed?: boolean
  onClose: () => void
}) {
  return (
    <div
      className={`flex gap-3 p-3 rounded-xl bg-white border border-ui-border-base hover:border-cf-orange transition-colors ${
        dimmed ? "opacity-70" : ""
      }`}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-grey-10 overflow-hidden shrink-0">
        {product.thumbnail && (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0">
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="text-sm font-medium text-grey-80 hover:text-cf-orange transition-colors truncate"
        >
          {product.title}
        </LocalizedClientLink>
        <span className="text-xs text-ui-fg-muted mt-0.5">
          {product.price?.calculated_price || ""}
        </span>
      </div>

      {/* View button */}
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        onClick={onClose}
        className="self-center shrink-0 px-3 py-1.5 text-xs font-medium rounded-full bg-cf-orange text-white hover:bg-cf-orange-dark transition-colors"
      >
        View
      </LocalizedClientLink>
    </div>
  )
}

export default function StepResults() {
  const { occasion, budget, goBack, close } = usePlanning()
  const [data, setData] = useState<WizardResultsPayload | null>(null)
  const [isPending, startTransition] = useTransition()
  const [occasionConfig, setOccasionConfig] = useState<DynamicOccasion | null>(null)

  useEffect(() => {
    if (!occasion) return

    // Fetch occasion config dynamically
    fetch("/api/occasions")
      .then((res) => res.json())
      .then((d) => {
        const found = (d.occasions as DynamicOccasion[])?.find(
          (o) => o.slug === occasion
        )
        if (found) setOccasionConfig(found)
      })
      .catch(() => {})

    startTransition(async () => {
      const results = await fetchWizardResults(
        occasion,
        budget?.min,
        budget?.max
      )
      setData(results)
    })
  }, [occasion, budget])

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="cf-heading text-2xl small:text-3xl mb-1 text-center">
        Your {occasionConfig?.label}{" "}
        <span className="gradient-cf-text">Plan</span> {occasionConfig?.emoji}
      </h2>
      <p className="text-sm text-ui-fg-muted mb-6 text-center">
        {budget
          ? `Showing ${budget.label} picks first`
          : "All products for your celebration"}
      </p>

      {/* Loading */}
      {isPending && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-8 h-8 border-3 border-cf-orange border-t-transparent rounded-full animate-ring" />
          <span className="text-sm text-ui-fg-muted">Finding the best picks...</span>
        </div>
      )}

      {/* Results */}
      {data && !isPending && (
        <div className="w-full max-w-lg space-y-6 max-h-[50vh] overflow-y-auto pr-1">
          {/* In-budget products */}
          {data.inBudget.length > 0 && (
            <div className="space-y-2">
              {budget && (
                <span className="text-xs font-semibold uppercase tracking-wider text-cf-orange">
                  ✨ In your budget
                </span>
              )}
              {data.inBudget.map((product) => (
                <ProductCard key={product.id} product={product} onClose={close} />
              ))}
            </div>
          )}

          {/* More options (out of budget) */}
          {data.morePicks.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ui-fg-muted">
                More options
              </span>
              {data.morePicks.map((product) => (
                <ProductCard key={product.id} product={product} dimmed onClose={close} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {data.inBudget.length === 0 && data.morePicks.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-3 block">🔍</span>
              <p className="text-sm text-ui-fg-muted">
                No products found yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-ui-border-base w-full max-w-lg justify-between">
        <button
          onClick={goBack}
          className="text-sm text-ui-fg-muted hover:text-ui-fg-base transition-colors"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <LocalizedClientLink
            href={`/occasions/${occasion}`}
            onClick={close}
            className="text-sm font-medium text-cf-orange hover:text-cf-orange-dark transition-colors"
          >
            View Full Collection →
          </LocalizedClientLink>
          <button
            onClick={close}
            className="btn-cf-primary !py-2 !px-4 text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
