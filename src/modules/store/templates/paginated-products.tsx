import { getProductsListWithSort, getRegion, getCollectionByHandle } from "@lib/data"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  collectionHandle,
  categoryId,
  productsIds,
  typeFilter,
  tagsFilter,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  collectionHandle?: string
  categoryId?: string
  productsIds?: string[]
  typeFilter?: string
  tagsFilter?: string
}) {
  const region = await getRegion()

  if (!region) {
    return null
  }

  const queryParams: PaginatedProductsParams = {
    limit: PRODUCT_LIMIT,
  }

  // Resolve collection handle to ID if needed
  let resolvedCollectionId = collectionId
  if (!resolvedCollectionId && collectionHandle) {
    try {
      const collection = await getCollectionByHandle(collectionHandle)
      resolvedCollectionId = collection?.id
    } catch {
      // Collection not found, skip filter
    }
  }

  if (resolvedCollectionId) {
    queryParams["collection_id"] = [resolvedCollectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  const {
    response: { products, count },
  } = await getProductsListWithSort({
    page,
    queryParams,
    sortBy,
    typeFilter,
    tagsFilter,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <ul className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8" data-testid="products-list">
        {products.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview productPreview={p} region={region} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && <Pagination data-testid="product-pagination" page={page} totalPages={totalPages} />}
    </>
  )
}
