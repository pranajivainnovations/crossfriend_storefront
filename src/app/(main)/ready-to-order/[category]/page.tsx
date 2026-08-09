import { Metadata } from "next"
import { notFound } from "next/navigation"

import { MARKETPLACE_CATEGORIES } from "@lib/data/marketplace"
import MarketplaceTemplate from "@modules/marketplace/templates"

export const dynamic = "force-dynamic"

type Props = {
  params: { category: string }
  searchParams: { page?: string }
}

/**
 * Only the handles in the Ready-to-Order tree are valid routes. Anything else 404s rather than
 * rendering an empty grid — an unknown category is a broken link, and saying so is more useful
 * than implying the category exists but happens to be empty.
 */
function findCategory(handle: string) {
  return MARKETPLACE_CATEGORIES.find((c) => c.handle === handle.toLowerCase())
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = findCategory(params.category)
  if (!category) return { title: "Not found" }

  return {
    title: category.label,
    description: `${category.label} from local bakers on CrossFriend — ready to order and deliver.`,
    openGraph: {
      title: category.label,
      description: `${category.label} from local bakers, ready to deliver.`,
    },
    alternates: { canonical: `/ready-to-order/${params.category}` },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = findCategory(params.category)
  if (!category) {
    notFound()
  }

  const page = Math.max(parseInt(searchParams.page || "1", 10) || 1, 1)
  return <MarketplaceTemplate categoryHandle={category.handle} page={page} />
}
