import {
  ProductCategory,
  ProductCollection,
  ProductType,
  Region,
  StoreGetProductsParams,
  StorePostAuthReq,
  StorePostCartsCartReq,
  StorePostCustomersCustomerAddressesAddressReq,
  StorePostCustomersCustomerAddressesReq,
  StorePostCustomersCustomerReq,
  StorePostCustomersReq,
} from "@medusajs/medusa"
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"
import { cache } from "react"

import sortProducts from "@lib/util/sort-products"
import transformProductPreview from "@lib/util/transform-product-preview"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { ProductCategoryWithChildren, ProductPreviewType } from "types/global"
import {
  PRODUCT_TYPES as CF_PRODUCT_TYPES,
  type ProductType as CfProductType,
  type OccasionCollection,
} from "@lib/types/product-contract"
import { getProductType } from "@lib/util/product-guards"

import { medusaClient } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cookies } from "next/headers"

const emptyResponse = {
  response: { products: [], count: 0 },
  nextPage: null,
}

/**
 * Function for getting custom headers for Medusa API requests, including the JWT token and cache revalidation tags.
 *
 * @param tags
 * @returns custom headers for Medusa API requests
 */
const getMedusaHeaders = (tags: string[] = []) => {
  const headers = {
    next: {
      tags,
    },
  } as Record<string, any>

  const token = cookies().get("_medusa_jwt")?.value

  if (token) {
    headers.authorization = `Bearer ${token}`
  } else {
    headers.authorization = ""
  }

  return headers
}

// Cart actions
export async function createCart(data = {}) {
  const headers = getMedusaHeaders(["cart"])

  return medusaClient.carts
    .create(data, headers)
    .then(({ cart }) => cart)
    .catch((err) => {
      console.log(err)
      return null
    })
}

export async function updateCart(cartId: string, data: StorePostCartsCartReq) {
  const headers = getMedusaHeaders(["cart"])

  return medusaClient.carts
    .update(cartId, data, headers)
    .then(({ cart }) => cart)
    .catch((error) => medusaError(error))
}

export const getCart = cache(async function (cartId: string) {
  const headers = getMedusaHeaders(["cart"])

  return medusaClient.carts
    .retrieve(cartId, headers)
    .then(({ cart }) => cart)
    .catch((err) => {
      console.log(err)
      return null
    })
})

export async function addItem({
  cartId,
  variantId,
  quantity,
  metadata,
}: {
  cartId: string
  variantId: string
  quantity: number
  metadata?: Record<string, unknown>
}) {
  const headers = getMedusaHeaders(["cart"])

  return medusaClient.carts.lineItems
    .create(cartId, { variant_id: variantId, quantity, metadata }, headers)
    .then(({ cart }) => cart)
    .catch((err) => {
      console.log(err)
      return null
    })
}

export async function updateItem({
  cartId,
  lineId,
  quantity,
}: {
  cartId: string
  lineId: string
  quantity: number
}) {
  const headers = getMedusaHeaders(["cart"])

  return medusaClient.carts.lineItems
    .update(cartId, lineId, { quantity }, headers)
    .then(({ cart }) => cart)
    .catch((err) => medusaError(err))
}

export async function removeItem({
  cartId,
  lineId,
}: {
  cartId: string
  lineId: string
}) {
  const headers = getMedusaHeaders(["cart"])

  return medusaClient.carts.lineItems
    .delete(cartId, lineId, headers)
    .then(({ cart }) => cart)
    .catch((err) => {
      console.log(err)
      return null
    })
}

export async function deleteDiscount(cartId: string, code: string) {
  const headers = getMedusaHeaders(["cart"])

  return medusaClient.carts
    .deleteDiscount(cartId, code, headers)
    .then(({ cart }) => cart)
    .catch((err) => {
      console.log(err)
      return null
    })
}

export async function createPaymentSessions(cartId: string) {
  const headers = getMedusaHeaders(["cart"])

  return medusaClient.carts
    .createPaymentSessions(cartId, headers)
    .then(({ cart }) => cart)
    .catch((err) => {
      console.log(err)
      return null
    })
}

export async function setPaymentSession({
  cartId,
  providerId,
}: {
  cartId: string
  providerId: string
}) {
  const headers = getMedusaHeaders(["cart"])

  return medusaClient.carts
    .setPaymentSession(cartId, { provider_id: providerId }, headers)
    .then(({ cart }) => cart)
    .catch((err) => medusaError(err))
}

export async function completeCart(cartId: string) {
  const headers = getMedusaHeaders(["cart"])

  return medusaClient.carts
    .complete(cartId, headers)
    .then((res) => res)
    .catch((err) => medusaError(err))
}

// Order actions
export const retrieveOrder = cache(async function (id: string) {
  const headers = getMedusaHeaders(["order"])

  return medusaClient.orders
    .retrieve(id, headers)
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
})

// Shipping actions
export const listCartShippingMethods = cache(async function (cartId: string) {
  const headers = getMedusaHeaders(["shipping"])

  return medusaClient.shippingOptions
    .listCartOptions(cartId, headers)
    .then(({ shipping_options }) => shipping_options)
    .catch((err) => {
      console.log(err)
      return null
    })
})

export async function addShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = getMedusaHeaders(["cart"])

  return medusaClient.carts
    .addShippingMethod(cartId, { option_id: shippingMethodId }, headers)
    .then(({ cart }) => cart)
    .catch((err) => medusaError(err))
}

// Authentication actions
export async function getToken(credentials: StorePostAuthReq) {
  return medusaClient.auth
    .getToken(credentials, {
      next: {
        tags: ["auth"],
      },
    })
    .then(({ access_token }) => {
      access_token &&
        cookies().set("_medusa_jwt", access_token, {
          maxAge: 60 * 60 * 24 * 7,
          httpOnly: true,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
        })
      return access_token
    })
    .catch((err) => {
      throw new Error("Wrong email or password.")
    })
}

export async function authenticate(credentials: StorePostAuthReq) {
  const headers = getMedusaHeaders(["auth"])

  return medusaClient.auth
    .authenticate(credentials, headers)
    .then(({ customer }) => customer)
    .catch((err) => medusaError(err))
}

export const getSession = cache(async function getSession() {
  const headers = getMedusaHeaders(["auth"])

  return medusaClient.auth
    .getSession(headers)
    .then(({ customer }) => customer)
    .catch((err) => medusaError(err))
})

// Customer actions
export async function getCustomer() {
  const headers = getMedusaHeaders(["customer"])

  return medusaClient.customers
    .retrieve(headers)
    .then(({ customer }) => customer)
    .catch((err) => null)
}

export async function createCustomer(data: StorePostCustomersReq) {
  const headers = getMedusaHeaders(["customer"])

  return medusaClient.customers
    .create(data, headers)
    .then(({ customer }) => customer)
    .catch((err) => medusaError(err))
}

export async function updateCustomer(data: StorePostCustomersCustomerReq) {
  const headers = getMedusaHeaders(["customer"])

  return medusaClient.customers
    .update(data, headers)
    .then(({ customer }) => customer)
    .catch((err) => medusaError(err))
}

export async function addShippingAddress(
  data: StorePostCustomersCustomerAddressesReq
) {
  const headers = getMedusaHeaders(["customer"])

  return medusaClient.customers.addresses
    .addAddress(data, headers)
    .then(({ customer }) => customer)
    .catch((err) => medusaError(err))
}

export async function deleteShippingAddress(addressId: string) {
  const headers = getMedusaHeaders(["customer"])

  return medusaClient.customers.addresses
    .deleteAddress(addressId, headers)
    .then(({ customer }) => customer)
    .catch((err) => medusaError(err))
}

export async function updateShippingAddress(
  addressId: string,
  data: StorePostCustomersCustomerAddressesAddressReq
) {
  const headers = getMedusaHeaders(["customer"])

  return medusaClient.customers.addresses
    .updateAddress(addressId, data, headers)
    .then(({ customer }) => customer)
    .catch((err) => medusaError(err))
}

export const listCustomerOrders = cache(async function (
  limit: number = 10,
  offset: number = 0
) {
  const headers = getMedusaHeaders(["customer"])

  return medusaClient.customers
    .listOrders({ limit, offset }, headers)
    .then(({ orders }) => orders)
    .catch((err) => medusaError(err))
})

// Region actions
export const listRegions = cache(async function () {
  return medusaClient.regions
    .list()
    .then(({ regions }) => regions)
    .catch((err) => {
      console.log(err)
      return null
    })
})

export const retrieveRegion = cache(async function (id: string) {
  const headers = getMedusaHeaders(["regions"])

  return medusaClient.regions
    .retrieve(id, headers)
    .then(({ region }) => region)
    .catch((err) => medusaError(err))
})

/**
 * India-only: Fixed country code.
 * Future: accept region param for city/area-based routing.
 */
const COUNTRY_CODE = process.env.NEXT_PUBLIC_DEFAULT_REGION || "in"

const regionMap = new Map<string, Region>()

export const getRegion = cache(async function (countryCode?: string) {
  const code = countryCode || COUNTRY_CODE
  try {
    if (regionMap.has(code)) {
      return regionMap.get(code)
    }

    const regions = await listRegions()

    if (!regions) {
      return null
    }

    regions.forEach((region) => {
      region.countries.forEach((c) => {
        regionMap.set(c.iso_2, region)
      })
    })

    const region = regionMap.get(code) || regionMap.values().next().value

    return region
  } catch (e: any) {
    console.log(e.toString())
    return null
  }
})

// Product actions
export const getProductsById = cache(async function ({
  ids,
  regionId,
}: {
  ids: string[]
  regionId: string
}) {
  const headers = getMedusaHeaders(["products"])

  return medusaClient.products
    .list({ id: ids, region_id: regionId }, headers)
    .then(({ products }) => products)
    .catch((err) => {
      console.log(err)
      return null
    })
})

export const retrievePricedProductById = cache(async function ({
  id,
  regionId,
}: {
  id: string
  regionId: string
}) {
  const headers = getMedusaHeaders(["products"])

  return medusaClient.products
    .retrieve(`${id}?region_id=${regionId}`, headers)
    .then(({ product }) => product)
    .catch((err) => {
      console.log(err)
      return null
    })
})

export const getProductByHandle = cache(async function (
  handle: string
): Promise<{ product: PricedProduct }> {
  const headers = getMedusaHeaders(["products"])

  const product = await medusaClient.products
    .list({ handle }, headers)
    .then(({ products }) => products[0])
    .catch((err) => {
      throw err
    })

  return { product }
})

export const getProductsList = cache(async function ({
  pageParam = 0,
  queryParams,
  countryCode,
}: {
  pageParam?: number
  queryParams?: StoreGetProductsParams
  countryCode?: string
}): Promise<{
  response: { products: ProductPreviewType[]; count: number }
  nextPage: number | null
  queryParams?: StoreGetProductsParams
}> {
  const limit = queryParams?.limit || 12

  const region = await getRegion(countryCode)

  if (!region) {
    return emptyResponse
  }

  const { products, count } = await medusaClient.products
    .list(
      {
        limit,
        offset: pageParam,
        region_id: region.id,
        ...queryParams,
      },
      { next: { tags: ["products"] } }
    )
    .then((res) => res)
    .catch((err) => {
      throw err
    })

  const transformedProducts = products.map((product) => {
    return transformProductPreview(product, region!)
  })

  const nextPage = count > pageParam + 1 ? pageParam + 1 : null

  return {
    response: { products: transformedProducts, count },
    nextPage,
    queryParams,
  }
})

export const getProductsListWithSort = cache(
  async function getProductsListWithSort({
    page = 0,
    queryParams,
    sortBy = "created_at",
    countryCode,
  }: {
    page?: number
    queryParams?: StoreGetProductsParams
    sortBy?: SortOptions
    countryCode?: string
  }): Promise<{
    response: { products: ProductPreviewType[]; count: number }
    nextPage: number | null
    queryParams?: StoreGetProductsParams
  }> {
    const limit = queryParams?.limit || 12

    const {
      response: { products, count },
    } = await getProductsList({
      pageParam: 0,
      queryParams: {
        ...queryParams,
        limit: 100,
      },
      countryCode,
    })

    const sortedProducts = sortProducts(products, sortBy)

    const pageParam = (page - 1) * limit

    const nextPage = count > pageParam + limit ? pageParam + limit : null

    const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

    return {
      response: {
        products: paginatedProducts,
        count,
      },
      nextPage,
      queryParams,
    }
  }
)

export const getHomepageProducts = cache(async function getHomepageProducts({
  collectionHandles,
  currencyCode,
  countryCode,
}: {
  collectionHandles?: string[]
  currencyCode: string
  countryCode?: string
}) {
  const collectionProductsMap = new Map<string, ProductPreviewType[]>()

  const { collections } = await getCollectionsList(0, 3)

  if (!collectionHandles) {
    collectionHandles = collections.map((collection) => collection.handle)
  }

  for (const handle of collectionHandles) {
    const products = await getProductsByCollectionHandle({
      handle,
      currencyCode,
      countryCode,
      limit: 3,
    })
    collectionProductsMap.set(handle, products.response.products)
  }

  return collectionProductsMap
})

// Collection actions
export const retrieveCollection = cache(async function (id: string) {
  return medusaClient.collections
    .retrieve(id, {
      next: {
        tags: ["collections"],
      },
    })
    .then(({ collection }) => collection)
    .catch((err) => {
      throw err
    })
})

export const getCollectionsList = cache(async function (
  offset: number = 0,
  limit: number = 100
): Promise<{ collections: ProductCollection[]; count: number }> {
  const collections = await medusaClient.collections
    .list({ limit, offset }, { next: { tags: ["collections"] } })
    .then(({ collections }) => collections)
    .catch((err) => {
      throw err
    })

  const count = collections.length

  return {
    collections,
    count,
  }
})

export const getCollectionByHandle = cache(async function (
  handle: string
): Promise<ProductCollection> {
  const collection = await medusaClient.collections
    .list({ handle: [handle] }, { next: { tags: ["collections"] } })
    .then(({ collections }) => collections[0])
    .catch((err) => {
      throw err
    })

  return collection
})

export const getProductsByCollectionHandle = cache(
  async function getProductsByCollectionHandle({
    pageParam = 0,
    limit = 100,
    handle,
    countryCode,
  }: {
    pageParam?: number
    handle: string
    limit?: number
    countryCode?: string
    currencyCode?: string
  }): Promise<{
    response: { products: ProductPreviewType[]; count: number }
    nextPage: number | null
  }> {
    const { id } = await getCollectionByHandle(handle).then(
      (collection) => collection
    )

    const { response, nextPage } = await getProductsList({
      pageParam,
      queryParams: { collection_id: [id], limit },
      countryCode,
    })
      .then((res) => res)
      .catch((err) => {
        throw err
      })

    return {
      response,
      nextPage,
    }
  }
)

// Category actions
export const listCategories = cache(async function () {
  const headers = {
    next: {
      tags: ["collections"],
    },
  } as Record<string, any>

  return medusaClient.productCategories
    .list({ expand: "category_children" }, headers)
    .then(({ product_categories }) => product_categories)
    .catch((err) => {
      throw err
    })
})

export const getCategoriesList = cache(async function (
  offset: number = 0,
  limit: number = 100
): Promise<{
  product_categories: ProductCategoryWithChildren[]
  count: number
}> {
  const { product_categories, count } = await medusaClient.productCategories
    .list({ limit, offset }, { next: { tags: ["categories"] } })
    .catch((err) => {
      throw err
    })

  return {
    product_categories,
    count,
  }
})

export const getCategoryByHandle = cache(async function (
  categoryHandle: string[]
): Promise<{
  product_categories: ProductCategoryWithChildren[]
}> {
  const handles = categoryHandle.map((handle: string, index: number) =>
    categoryHandle.slice(0, index + 1).join("/")
  )

  const product_categories = [] as ProductCategoryWithChildren[]

  for (const handle of handles) {
    const category = await medusaClient.productCategories
      .list(
        {
          handle: handle,
        },
        {
          next: {
            tags: ["categories"],
          },
        }
      )
      .then(({ product_categories: { [0]: category } }) => category)
      .catch((err) => {
        return {} as ProductCategory
      })

    product_categories.push(category)
  }

  return {
    product_categories,
  }
})

export const getProductsByCategoryHandle = cache(async function ({
  pageParam = 0,
  handle,
  countryCode,
}: {
  pageParam?: number
  handle: string
  countryCode?: string
  currencyCode?: string
}): Promise<{
  response: { products: ProductPreviewType[]; count: number }
  nextPage: number | null
}> {
  const { id } = await getCategoryByHandle([handle]).then(
    (res) => res.product_categories[0]
  )

  const { response, nextPage } = await getProductsList({
    pageParam,
    queryParams: { category_id: [id] },
    countryCode,
  })
    .then((res) => res)
    .catch((err) => {
      throw err
    })

  return {
    response,
    nextPage,
  }
})

// ============================================
// CrossFriend — Generic Data Layer
// ============================================

/**
 * Cached product-type lookup.
 * Resolves a type value string (e.g. "cake") to the Medusa type_id.
 * The map is populated lazily on first call.
 */
const productTypeMap = new Map<string, string>() // value → id

async function resolveProductTypeId(
  typeValue: string
): Promise<string | null> {
  if (productTypeMap.size === 0) {
    try {
      const { product_types } = await medusaClient.productTypes.list(
        { limit: 100 },
        { next: { tags: ["product-types"] } }
      )
      for (const pt of product_types) {
        productTypeMap.set(pt.value.toLowerCase(), pt.id)
      }
    } catch (err) {
      console.warn("[CrossFriend] Failed to fetch product types:", err)
      return null
    }
  }
  return productTypeMap.get(typeValue.toLowerCase()) ?? null
}

/**
 * Resolve an occasion slug (collection handle) to its Medusa collection.
 * Returns null if the collection doesn't exist.
 */
export const getCollectionBySlug = cache(async function (
  slug: string
): Promise<ProductCollection | null> {
  try {
    const collection = await getCollectionByHandle(slug)
    return collection ?? null
  } catch {
    return null
  }
})

// --- Generic getProducts() ---

export interface GetProductsOptions {
  /** Filter by CrossFriend product type value (cake, decor, gift, costume, wellness) */
  type?: CfProductType
  /** Filter by occasion collection slug (birthday, anniversary, festival, kids, special) */
  collection?: OccasionCollection | string
  /** Filter by Medusa tag IDs */
  tags?: string[]
  /** Max products to return (default 12) */
  limit?: number
  /** Pagination offset (default 0) */
  offset?: number
  /** Optional: Medusa collection_id to use directly (skips slug resolution) */
  collectionId?: string
}

export interface GetProductsResult {
  products: PricedProduct[]
  count: number
  /** Products transformed to preview format (with prices) */
  previews: ProductPreviewType[]
}

/**
 * Generic product fetcher for the CrossFriend storefront.
 *
 * Resolves human-friendly filters (type value, occasion slug) to Medusa IDs,
 * fetches products, and returns both raw PricedProduct[] and transformed previews.
 *
 * Runtime validation: logs warnings for products missing type or collection
 * in development. Never crashes on bad data.
 */
export const getProducts = cache(async function (
  options: GetProductsOptions = {}
): Promise<GetProductsResult> {
  const {
    type,
    collection,
    tags,
    limit = 12,
    offset = 0,
    collectionId,
  } = options

  const region = await getRegion()
  if (!region) {
    return { products: [], count: 0, previews: [] }
  }

  // Build query params
  const queryParams: StoreGetProductsParams = {
    limit,
    offset,
    region_id: region.id,
  }

  // Resolve type value → type_id
  if (type) {
    const typeId = await resolveProductTypeId(type)
    if (typeId) {
      queryParams.type_id = [typeId]
    } else {
      console.warn(
        `[CrossFriend] Product type "${type}" not found in Medusa. Returning empty.`
      )
      return { products: [], count: 0, previews: [] }
    }
  }

  // Resolve collection slug → collection_id
  if (collectionId) {
    queryParams.collection_id = [collectionId]
  } else if (collection) {
    const col = await getCollectionBySlug(collection)
    if (col) {
      queryParams.collection_id = [col.id]
    } else {
      console.warn(
        `[CrossFriend] Collection "${collection}" not found in Medusa. Returning empty.`
      )
      return { products: [], count: 0, previews: [] }
    }
  }

  // Tags
  if (tags && tags.length > 0) {
    queryParams.tags = tags
  }

  // Fetch
  const headers = getMedusaHeaders(["products"])
  let products: PricedProduct[] = []
  let count = 0

  try {
    const res = await medusaClient.products.list(queryParams, headers)
    products = res.products
    count = res.count
  } catch (err) {
    console.error("[CrossFriend] getProducts() failed:", err)
    return { products: [], count: 0, previews: [] }
  }

  // Runtime validation (dev only)
  if (process.env.NODE_ENV === "development") {
    for (const p of products) {
      const pType = getProductType(p)
      if (!pType) {
        console.warn(
          `[CrossFriend] Product "${p.title}" (${p.id}) has no valid type. ` +
            `Expected one of: ${CF_PRODUCT_TYPES.join(", ")}`
        )
      }
    }
  }

  // Transform to previews
  const previews = products.map((product) =>
    transformProductPreview(product, region!)
  )

  return { products, count, previews }
})
