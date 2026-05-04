"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

type CategoryFiltersProps = {
  activeType?: string
  activeTags?: string
}

const CategoryFilters = ({ activeType, activeTags }: CategoryFiltersProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      // Reset page on filter change
      params.delete("page")
      return params.toString()
    },
    [searchParams]
  )

  const handleTypeChange = (type: string) => {
    const newType = activeType === type ? null : type
    const query = createQueryString({ type: newType })
    router.push(`${pathname}${query ? `?${query}` : ""}`)
  }

  const handleTagToggle = (tag: string) => {
    const currentTags = activeTags ? activeTags.split(",") : []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag]
    const query = createQueryString({
      tags: newTags.length > 0 ? newTags.join(",") : null,
    })
    router.push(`${pathname}${query ? `?${query}` : ""}`)
  }

  const clearFilters = () => {
    const query = createQueryString({ type: null, tags: null })
    router.push(`${pathname}${query ? `?${query}` : ""}`)
  }

  const hasActiveFilters = !!activeType || !!activeTags

  const activeTagsList = activeTags ? activeTags.split(",") : []

  // Common product types for CrossFriend
  const productTypes = [
    "cake",
    "decoration",
    "gift",
    "costume",
    "toy",
    "balloon",
    "candle",
    "flower",
  ]

  // Common tags
  const commonTags = [
    "birthday",
    "wedding",
    "anniversary",
    "baby-shower",
    "christmas",
    "diwali",
    "holi",
    "valentine",
    "premium",
    "bestseller",
  ]

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-ui-fg-muted uppercase tracking-wide">
          Filter by
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-cf-orange hover:text-cf-orange/80 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        {productTypes.map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              activeType === type
                ? "bg-cf-orange text-white border-cf-orange"
                : "bg-white border-ui-border-base text-ui-fg-subtle hover:border-cf-orange hover:text-cf-orange"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2">
        {commonTags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagToggle(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              activeTagsList.includes(tag)
                ? "bg-cf-pink text-white border-cf-pink"
                : "bg-white border-ui-border-base text-ui-fg-subtle hover:border-cf-pink hover:text-cf-pink"
            }`}
          >
            {tag.replace(/-/g, " ")}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilters
