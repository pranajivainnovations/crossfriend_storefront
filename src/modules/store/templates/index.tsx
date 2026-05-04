import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreFilters from "@modules/store/components/store-filters"
import { getOccasions, getProductTypes } from "@lib/data/dynamic"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  collectionHandle,
  typeFilter,
}: {
  sortBy?: SortOptions
  page?: string
  collectionHandle?: string
  typeFilter?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1

  const [occasions, productTypes] = await Promise.all([
    getOccasions(),
    getProductTypes(),
  ])

  return (
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container" data-testid="category-container">
      <RefinementList sortBy={sortBy || "created_at"} />
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="cf-heading text-2xl small:text-3xl" data-testid="store-page-title">
            Shop <span className="gradient-cf-text">Everything</span>
          </h1>
          <p className="text-sm text-ui-fg-muted mt-1">
            Browse all celebration products — filter by occasion or category
          </p>
        </div>

        {/* Occasion + Type filter chips (dynamic) */}
        <StoreFilters occasions={occasions} productTypes={productTypes} />

        <Suspense key={`${sortBy}-${pageNumber}-${typeFilter}-${collectionHandle}`} fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sortBy || "created_at"}
            page={pageNumber}
            typeFilter={typeFilter}
            collectionHandle={collectionHandle}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
