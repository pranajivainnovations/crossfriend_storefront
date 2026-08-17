import { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getCollectionByHandle,
  getCollectionsList,
} from "@lib/data"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export const dynamic = "force-dynamic"

type Props = {
  params: { handle: string }
  searchParams: {
    page?: string
    sortBy?: SortOptions
  }
}

export const PRODUCT_LIMIT = 12

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await getCollectionByHandle(params.handle)

  // Empty metadata, not notFound() — see the note in products/[handle]/page.tsx. notFound() here
  // renders the 404 page with a 200 status, which Search Console files as a Soft 404. The page
  // component below calls notFound() for the same condition and sets a real 404.
  if (!collection) {
    return {}
  }

  const metadata = {
    title: collection.title,
    description: `Shop the ${collection.title} collection on CrossFriend — cakes, gifts and celebration products from local bakers and makers.`,
    alternates: { canonical: `/collections/${params.handle}` },
  } as Metadata

  return metadata
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection) => collection
  )

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
    />
  )
}
