import { ProductCollection } from "@medusajs/medusa"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
}: {
  sortBy?: SortOptions
  collection: ProductCollection
  page?: string
}) {
  const pageNumber = page ? parseInt(page) : 1

  return (
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
      <RefinementList sortBy={sortBy || "created_at"} />
      <div className="w-full">
        {/* Breadcrumb for SEO */}
        <nav className="flex items-center gap-1.5 text-xs text-ui-fg-muted mb-4 flex-wrap">
          <LocalizedClientLink
            href="/"
            className="hover:text-cf-orange transition-colors"
          >
            Home
          </LocalizedClientLink>
          <span>/</span>
          <LocalizedClientLink
            href="/collections"
            className="hover:text-cf-orange transition-colors"
          >
            Collections
          </LocalizedClientLink>
          <span>/</span>
          <span className="text-ui-fg-base">{collection.title}</span>
        </nav>

        <div className="mb-8">
          <h1 className="cf-heading text-2xl small:text-3xl">
            {collection.title}
          </h1>
          {collection.metadata?.description && (
            <p className="text-sm text-ui-fg-subtle mt-2 max-w-2xl">
              {collection.metadata.description as string}
            </p>
          )}
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sortBy || "created_at"}
            page={pageNumber}
            collectionId={collection.id}
          />
        </Suspense>
      </div>
    </div>
  )
}
