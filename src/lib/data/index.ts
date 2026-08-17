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

/**
 * The sales channel CrossFriend trades on.
 *
 * Resolved from the backend rather than an env var: a mistyped id would put every cart on the
 * wrong channel and make every CrossFriend product silently un-addable, with a symptom ("add to
 * cart does nothing") that points nowhere near the cause.
 *
 * Cached per request by React and for an hour in the data cache — a sales channel is created once
 * and never changes, so this costs one round trip an hour rather than one per cart.
 */
export const getCrossFriendSalesChannelId = cache(async function () {
  try {
    const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"
    const res = await fetch(`${backendUrl}/store/crossfriend/sales-channel`, {
      next: { revalidate: 3600, tags: ["sales-channel"] },
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data?.salesChannelId as string | null) ?? null
  } catch {
    return null
  }
})

// Cart actions
export async function createCart(data = {}) {
  const headers = getMedusaHeaders(["cart"])

  // Medusa refuses a line item whose product is not on the cart's sales channel, and the store's
  // DEFAULT channel is Pranajiva's — so without this, nothing in the CrossFriend catalogue can be
  // added to a cart. Falls back to Medusa's default when unresolved, which is the behaviour this
  // had before, rather than failing to create a cart at all.
  const salesChannelId = await getCrossFriendSalesChannelId()

  return medusaClient.carts
    .create(
      { ...(salesChannelId ? { sales_channel_id: salesChannelId } : {}), ...data },
      headers
    )
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

  // Belt-and-suspenders against a real Medusa v1 behavior: cartService.update() re-derives every line
  // item's price from its variant whenever region_id/customer_id is present in the update call — the
  // standard checkout's address step does exactly that, which can silently corrupt an AI Cake Studio
  // item's custom price earlier in the flow. There's an async cart.updated subscriber that repairs this
  // too, but it depends on the event bus (Redis) actually delivering the event — this synchronous call
  // guarantees correctness right at the moment that matters, regardless of that.
  try {
    const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"
    await fetch(`${backendUrl}/store/ai-studio/cart/repair`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartId }),
      cache: "no-store",
    })
  } catch (error) {
    console.error("[completeCart] AI cake price repair check failed", error)
  }

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
  const salesChannelId = await getCrossFriendSalesChannelId()

  return medusaClient.products
    .list(
      {
        id: ids,
        region_id: regionId,
        // Required, not optional. With sales channels enabled, a products query that names no
        // channel is answered from the store's DEFAULT channel — which here is Pranajiva's. A
        // CrossFriend product then comes back as simply "not found", with no error to explain it.
        // That silently emptied baker profiles until it was caught.
        ...(salesChannelId ? { sales_channel_id: [salesChannelId] } : {}),
      } as Record<string, unknown>,
      headers
    )
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
  const salesChannelId = await getCrossFriendSalesChannelId()

  const product = await medusaClient.products
    .list(
      {
        handle,
        // Same reason as getProductsById: without a channel this resolves against the store's
        // default (Pranajiva's), so every baker product 404s on its own detail page.
        ...(salesChannelId ? { sales_channel_id: [salesChannelId] } : {}),
      } as Record<string, unknown>,
      headers
    )
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

  const [region, salesChannelId] = await Promise.all([
    getRegion(countryCode),
    getCrossFriendSalesChannelId(),
  ])

  if (!region) {
    return emptyResponse
  }

  // Without a channel this returns the DEFAULT channel's products — which on this shared install is
  // Pranajiva's wellness catalogue, never CrossFriend's. Returning nothing is the safer failure:
  // an empty grid is confusing, the other brand's products are wrong.
  if (!salesChannelId) {
    console.error("[data] crossfriend sales channel unresolved — refusing to list products")
    return emptyResponse
  }

  const { products: allProducts, count } = await medusaClient.products
    .list(
      {
        limit,
        offset: pageParam,
        region_id: region.id,
        sales_channel_id: [salesChannelId],
        ...queryParams,
      } as Record<string, unknown>,
      { next: { tags: ["products"] } }
    )
    .then((res) => res)
    .catch((err) => {
      throw err
    })

  // Previously this fetched a fixed 100 rows and filtered `metadata.brand` in JavaScript. That was
  // wrong twice over: the store API cannot filter on metadata at all, so the 100-row window was
  // taken from the WRONG channel and the brand filter matched nothing — every category, collection
  // and store page was structurally empty. It also made `count` a count of one page rather than of
  // the result set, so pagination lied. Sales channel is an indexed relation the API filters on
  // server-side, which is both correct and the only thing that scales.
  const transformedProducts = (allProducts ?? []).map((product) =>
    transformProductPreview(product, region!)
  )

  const total = count ?? transformedProducts.length
  const nextPage = total > pageParam + limit ? pageParam + limit : null

  return {
    response: { products: transformedProducts, count: total },
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
    typeFilter,
    tagsFilter,
  }: {
    page?: number
    queryParams?: StoreGetProductsParams
    sortBy?: SortOptions
    countryCode?: string
    typeFilter?: string
    tagsFilter?: string
  }): Promise<{
    response: { products: ProductPreviewType[]; count: number }
    nextPage: number | null
    queryParams?: StoreGetProductsParams
  }> {
    const limit = queryParams?.limit || 12

    const [region, salesChannelId] = await Promise.all([
      getRegion(countryCode),
      getCrossFriendSalesChannelId(),
    ])

    const empty = {
      response: { products: [] as ProductPreviewType[], count: 0 },
      nextPage: null,
      queryParams,
    }

    if (!region) return empty

    // See getProductsList: no channel means the default channel, which is Pranajiva's.
    if (!salesChannelId) {
      console.error("[data] crossfriend sales channel unresolved — refusing to list products")
      return empty
    }

    // Type is resolved to an id and filtered in Postgres rather than compared in JavaScript. The
    // old approach compared `p.type?.value` over a 100-row window taken from the wrong channel, so
    // it matched nothing regardless of what was asked for.
    let typeId: string | null = null
    if (typeFilter) {
      typeId = await resolveProductTypeId(typeFilter)
      if (!typeId) {
        // An unknown type is an empty result, not an unfiltered one — silently ignoring the filter
        // is how `?type=costume` used to return the entire catalogue.
        return empty
      }
    }

    // Sorting stays in memory because price sorting needs the calculated price, which Medusa
    // computes per region AFTER the query — there is no column to ORDER BY. Everything that CAN be
    // filtered server-side now is, so this window holds CrossFriend products only rather than
    // whatever the first 100 rows of another brand's catalogue happened to be.
    const { products: rawProducts } = await medusaClient.products
      .list(
        {
          limit: 100,
          offset: 0,
          region_id: region.id,
          sales_channel_id: [salesChannelId],
          ...(typeId ? { type_id: [typeId] } : {}),
          ...queryParams,
        } as Record<string, unknown>,
        { next: { tags: ["products"] } }
      )
      .then((res) => res)
      .catch((err) => {
        throw err
      })

    let filteredProducts = rawProducts ?? []

    // Tags remain a JavaScript filter: the store API's `tags` parameter takes tag IDs, while our
    // URLs carry human-readable tag values.
    if (tagsFilter) {
      const filterTags = tagsFilter.split(",").map((t) => t.trim().toLowerCase())
      filteredProducts = filteredProducts.filter((p) =>
        filterTags.some((ft) =>
          p.tags?.some((t) => t.value.toLowerCase() === ft)
        )
      )
    }

    // Transform to preview type
    const transformedProducts = filteredProducts.map((product) =>
      transformProductPreview(product, region!)
    )

    const count = transformedProducts.length
    const sortedProducts = sortProducts(transformedProducts, sortBy)

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

/**
 * One canonical fetch of every CrossFriend collection, memoized for the lifetime of a request.
 *
 * The brand filter is applied in memory, so asking the API for a "page" never meant much anyway —
 * a limit of 3 could come back with zero CrossFriend collections. Fetching the whole (small) set
 * once and slicing locally is both more correct and dramatically cheaper: React's cache() keys on
 * arguments, so the old per-limit calls meant the homepage (limit 3), the occasions helper (100)
 * and the footer (6) each paid their own round trip to render a single page.
 */
const fetchAllCollections = cache(async function (): Promise<
  ProductCollection[]
> {
  return medusaClient.collections
    .list({ limit: 100, offset: 0 }, { next: { tags: ["collections"] } })
    .then(({ collections }) =>
      collections.filter(
        (col) =>
          String(col.metadata?.brand || "").toLowerCase() === "crossfriend"
      )
    )
    .catch((err) => {
      throw err
    })
})

export const getCollectionsList = cache(async function (
  offset: number = 0,
  limit: number = 100
): Promise<{ collections: ProductCollection[]; count: number }> {
  const all = await fetchAllCollections()

  return {
    collections: all.slice(offset, offset + limit),
    count: all.length,
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
    .list({ expand: "category_children", limit: 100 }, headers)
    .then(({ product_categories }) =>
      product_categories.filter(
        (cat) =>
          String(cat.metadata?.brand || "").toLowerCase() === "crossfriend"
      )
    )
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
  const { product_categories } = await medusaClient.productCategories
    .list({ limit, offset }, { next: { tags: ["categories"] } })
    .catch((err) => {
      throw err
    })

  const filtered = product_categories.filter(
    (cat) =>
      String(cat.metadata?.brand || "").toLowerCase() === "crossfriend"
  )

  return {
    product_categories: filtered,
    count: filtered.length,
  }
})

export const getCategoryByHandle = cache(async function (
  categoryHandle: string[]
): Promise<{
  product_categories: ProductCategoryWithChildren[]
}> {
  const product_categories = [] as ProductCategoryWithChildren[]

  for (const handle of categoryHandle) {
    const category = await medusaClient.productCategories
      .list(
        {
          handle: handle,
          expand: "category_children",
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

export async function resolveProductTypeId(
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

  const [region, salesChannelId] = await Promise.all([
    getRegion(),
    getCrossFriendSalesChannelId(),
  ])
  if (!region) {
    return { products: [], count: 0, previews: [] }
  }

  // Occasion sections and quick-add kits both come through here. Without the channel this returned
  // the default channel — Pranajiva's — so an occasion page could only ever render the other
  // brand's products or, more usually, nothing at all.
  if (!salesChannelId) {
    console.error("[CrossFriend] sales channel unresolved — getProducts() refusing to list")
    return { products: [], count: 0, previews: [] }
  }

  // Build query params
  const queryParams: StoreGetProductsParams = {
    limit,
    offset,
    region_id: region.id,
    sales_channel_id: [salesChannelId],
  } as StoreGetProductsParams

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
