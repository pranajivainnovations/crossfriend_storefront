import { notFound } from "next/navigation"
import { Suspense } from "react"

import { ProductCategoryWithChildren } from "types/global"
import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { OCCASIONS } from "@lib/constants"

export default function CategoryTemplate({
  categories,
  sortBy,
  page,
}: {
  categories: ProductCategoryWithChildren[]
  sortBy?: SortOptions
  page?: string
}) {
  const pageNumber = page ? parseInt(page) : 1

  const category = categories[categories.length - 1]
  const parents = categories.slice(0, categories.length - 1)

  if (!category) notFound()

  return (
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container" data-testid="category-container">
      <RefinementList sortBy={sortBy || "created_at"} data-testid="sort-by-container" />
      <div className="w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-ui-fg-muted mb-4 flex-wrap">
          <LocalizedClientLink
            href="/"
            className="hover:text-cf-orange transition-colors"
          >
            Home
          </LocalizedClientLink>
          <span>/</span>
          <LocalizedClientLink
            href="/store"
            className="hover:text-cf-orange transition-colors"
          >
            Store
          </LocalizedClientLink>
          {parents.map((parent) => (
            <span key={parent.id} className="flex items-center gap-1.5">
              <span>/</span>
              <LocalizedClientLink
                href={`/categories/${parent.handle}`}
                className="hover:text-cf-orange transition-colors"
              >
                {parent.name}
              </LocalizedClientLink>
            </span>
          ))}
          <span>/</span>
          <span className="text-ui-fg-base">{category.name}</span>
        </nav>

        {/* Heading */}
        <div className="mb-4">
          <h1
            className="cf-heading text-2xl small:text-3xl"
            data-testid="category-page-title"
          >
            {category.name}
          </h1>
        </div>

        {category.description && (
          <p className="mb-6 text-sm text-ui-fg-subtle leading-relaxed max-w-2xl">
            {category.description}
          </p>
        )}

        {/* Occasion quick-links */}
        <div className="flex flex-wrap gap-2 mb-6">
          {OCCASIONS.map((o) => (
            <LocalizedClientLink
              key={o.slug}
              href={`/occasions/${o.slug}`}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-ui-border-base text-grey-80 hover:border-cf-orange hover:text-cf-orange transition-colors"
            >
              {o.emoji} {o.label}
            </LocalizedClientLink>
          ))}
        </div>

        {/* Child categories */}
        {category.category_children &&
          category.category_children.length > 0 && (
            <div className="mb-6">
              <ul className="flex flex-wrap gap-2">
                {category.category_children.map((c) => (
                  <li key={c.id}>
                    <InteractiveLink href={`/categories/${c.handle}`}>
                      {c.name}
                    </InteractiveLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sortBy || "created_at"}
            page={pageNumber}
            categoryId={category.id}
          />
        </Suspense>
      </div>
    </div>
  )
}
