import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

// Never prerender — always fetch fresh from Medusa at request time
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse cakes, decorations, gifts, costumes, toys & wellness products for every celebration. Same-day delivery available.",
  keywords: [
    "buy cakes online",
    "party decorations",
    "celebration gifts",
    "costumes",
    "toys",
    "wellness products",
    "same day delivery",
  ],
  openGraph: {
    title: "Shop All Products | CrossFriend",
    description:
      "Browse cakes, decorations, gifts, costumes & wellness products for every celebration.",
  },
}

type Params = {
  searchParams: {
    sortBy?: SortOptions
    page?: string
    collection?: string
    type?: string
  }
}

export default async function StorePage({ searchParams }: Params) {
  const { sortBy, page, collection, type } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      collectionHandle={collection}
      typeFilter={type}
    />
  )
}
