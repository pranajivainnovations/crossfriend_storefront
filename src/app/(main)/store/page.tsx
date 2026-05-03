import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Shop All Products | CrossFriend",
  description:
    "Browse cakes, decorations, gifts, costumes & wellness products for every celebration.",
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
  const { sortBy, page } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
    />
  )
}
