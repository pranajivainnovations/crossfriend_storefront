"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { DynamicOccasion, DynamicProductType } from "@lib/data/dynamic"

export default function StoreFilters({
  occasions,
  productTypes,
}: {
  occasions: DynamicOccasion[]
  productTypes: DynamicProductType[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeOccasion = searchParams.get("collection") || ""
  const activeType = searchParams.get("type") || ""

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 when filtering
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-5 mb-6">
      {/* Occasion filter chips */}
      {occasions.length > 0 && (
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-ui-fg-muted mb-2 block">
            Occasion
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("collection", "")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !activeOccasion
                  ? "bg-cf-orange text-white border-cf-orange"
                  : "bg-white text-grey-80 border-ui-border-base hover:border-cf-orange"
              }`}
            >
              All
            </button>
            {occasions.map((o) => (
              <button
                key={o.slug}
                onClick={() =>
                  setFilter("collection", activeOccasion === o.slug ? "" : o.slug)
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeOccasion === o.slug
                    ? "bg-cf-orange text-white border-cf-orange"
                    : "bg-white text-grey-80 border-ui-border-base hover:border-cf-orange"
                }`}
              >
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Type filter chips */}
      {productTypes.length > 0 && (
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-ui-fg-muted mb-2 block">
            Category
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("type", "")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !activeType
                  ? "bg-cf-orange text-white border-cf-orange"
                  : "bg-white text-grey-80 border-ui-border-base hover:border-cf-orange"
              }`}
            >
              All
            </button>
            {productTypes.map((pt) => (
              <button
                key={pt.value}
                onClick={() =>
                  setFilter("type", activeType === pt.value ? "" : pt.value)
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeType === pt.value
                    ? "bg-cf-orange text-white border-cf-orange"
                    : "bg-white text-grey-80 border-ui-border-base hover:border-cf-orange"
                }`}
              >
                {pt.emoji} {pt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
