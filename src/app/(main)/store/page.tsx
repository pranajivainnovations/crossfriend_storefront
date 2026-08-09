import { Metadata } from "next"

import StoreTemplate from "@modules/store/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getTaxonomy } from "@lib/data/taxonomy"

export const dynamic = "force-dynamic"

type StoreSearchParams = {
  sortBy?: SortOptions
  page?: string
  type?: string
  collection?: string
}

/**
 * Per-filter metadata, replacing a static export that gave every variant of this page an identical
 * title and no canonical at all.
 *
 * Two problems that fixes:
 *
 * 1. `/store`, `/store?type=cake` and `/store?type=costume` were indistinguishable to a crawler —
 *    same title, same description, no canonical to tell them apart. Six type URLs competing as
 *    duplicates of one another is worse than having one, and the sitemap lists all of them.
 * 2. The page supplied its own brand suffix while the root layout's title template already
 *    appends one — so the tag rendered the brand name twice. The suffix belongs to the template,
 *    not to the page. The same bug was present on fifteen other pages.
 *
 * The label comes from the taxonomy rather than a hardcoded map, so a type added in OPS gets a
 * correct title with no code change — the same rule the rest of the storefront now follows.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: StoreSearchParams
}): Promise<Metadata> {
  const typeValue = searchParams.type?.trim()
  const collection = searchParams.collection?.trim()

  if (!typeValue && !collection) {
    return {
      title: "Shop Everything",
      description:
        "Browse every CrossFriend product — cakes, decorations, gifts, costumes and toys. Filter by occasion or by what you're looking for.",
      alternates: { canonical: "/store" },
    }
  }

  const taxonomy = await getTaxonomy().catch(() => null)
  const type = typeValue
    ? taxonomy?.types.find((t) => t.value === typeValue)
    : undefined
  const occasion = collection
    ? taxonomy?.occasions.find((o) => o.handle === collection)
    : undefined

  const typeLabel = type?.label ?? typeValue
  const occasionLabel = occasion?.label ?? collection

  const title =
    typeLabel && occasionLabel
      ? `${typeLabel} for ${occasionLabel}`
      : typeLabel
        ? `${typeLabel} — Shop Online`
        : `${occasionLabel} Shop`

  const description =
    typeLabel && occasionLabel
      ? `Shop ${typeLabel.toLowerCase()} for ${occasionLabel.toLowerCase()} on CrossFriend, from local bakers and makers.`
      : typeLabel
        ? `Shop ${typeLabel.toLowerCase()} on CrossFriend — made and delivered by local bakers and makers.`
        : `Everything you need for ${occasionLabel?.toLowerCase()} on CrossFriend.`

  // Canonical carries the filter, so each filtered view is its own page rather than a duplicate of
  // the bare catalogue. Sort and page are deliberately excluded — they reorder the same set and
  // would otherwise mint a distinct canonical per sort order.
  const params = new URLSearchParams()
  if (typeValue) params.set("type", typeValue)
  if (collection) params.set("collection", collection)

  return {
    title,
    description,
    alternates: { canonical: `/store?${params.toString()}` },
  }
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
  searchParams: StoreSearchParams
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
