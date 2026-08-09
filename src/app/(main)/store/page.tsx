import { Metadata } from "next"

import StoreTemplate from "@modules/store/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Shop Everything | CrossFriend",
  description:
    "Browse every CrossFriend product — cakes, decorations, gifts, costumes and toys. Filter by occasion or by what you're looking for.",
}

/**
 * The full CrossFriend catalogue, filtered by occasion and/or product type.
 *
 * This route was previously replaced by a permanent redirect to /ready-to-order, which quietly
 * broke the entire type navigation: around thirty links across the nav ribbon, mega-menu, side
 * menu, footer, homepage strip and occasion pages all point at `/store?type=...`, and the
 * marketplace page reads only `?page`. The query survived the redirect and was then discarded, so
 * a customer asking for Costumes was shown the same unfiltered grid as one asking for Cakes, with
 * nothing to indicate their filter had been dropped.
 *
 * StoreTemplate and StoreFilters were never deleted — they sat orphaned with no route to reach
 * them. This page reconnects them.
 *
 * ── /store vs /ready-to-order ───────────────────────────────────────────────────────────────────
 * They answer different questions and both are kept:
 *   /store          — the whole CrossFriend catalogue, sliced by occasion × type (this taxonomy)
 *   /ready-to-order — the baker marketplace, sliced by the Ready-to-Order category tree
 * The redirect is removed rather than reversed; neither is a duplicate of the other.
 */
export default async function StorePage({
  searchParams,
}: {
  searchParams: {
    sortBy?: SortOptions
    page?: string
    type?: string
    collection?: string
  }
}) {
  const { sortBy, page, type, collection } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      typeFilter={type}
      collectionHandle={collection}
    />
  )
}
