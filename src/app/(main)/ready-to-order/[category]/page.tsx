import { Metadata } from "next"
import { notFound } from "next/navigation"

import { MARKETPLACE_CATEGORIES } from "@lib/data/marketplace"
import MarketplaceTemplate from "@modules/marketplace/templates"

/**
 * Dynamic, but not cache-hostile.
 *
 * force-dynamic is back because this page fetches catalogue data through the Medusa client and
 * touches no cookies, so without it Next prerenders it during `next build`. That works locally,
 * where MEDUSA_BACKEND_URL points at the live backend, and fails inside Docker, where it points at
 * localhost:9001 and nothing is listening — which is exactly how it broke the image build.
 *
 * fetchCache is set explicitly because force-dynamic otherwise implies `force-no-store` for every
 * fetch in the route, layouts included. That is what previously stopped getSiteSettings,
 * getAnnouncement and getTaxonomy from ever caching despite each asking for `revalidate: 60`.
 * "default-cache" keeps rendering per-request while letting those honour their own revalidate.
 */
export const dynamic = "force-dynamic"
export const fetchCache = "default-cache"

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
