"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { OCCASIONS, PRODUCT_TYPE_LABELS } from "@lib/constants"
import { PRODUCT_TYPES } from "@lib/types/product-contract"

export default function StoreFilters() {
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
          {OCCASIONS.map((o) => (
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

      {/* Type filter chips */}
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
          {PRODUCT_TYPES.map((t) => {
            const info = PRODUCT_TYPE_LABELS[t]
            return (
              <button
                key={t}
                onClick={() =>
                  setFilter("type", activeType === t ? "" : t)
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeType === t
                    ? "bg-cf-orange text-white border-cf-orange"
                    : "bg-white text-grey-80 border-ui-border-base hover:border-cf-orange"
                }`}
              >
                {info.emoji} {info.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
