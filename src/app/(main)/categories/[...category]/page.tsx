import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

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
  params: { category: string[] }
  searchParams: {
    sortBy?: SortOptions
    page?: string
    type?: string
    tags?: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { product_categories } = await getCategoryByHandle(
      params.category
    ).then((product_categories) => product_categories)

    const title = product_categories
      .map((category) => category.name)
      .join(" | ")

    const description =
      product_categories[product_categories.length - 1].description ??
      `${title} category.`

    return {
      title: `${title}`,
      description,
      alternates: {
        /**
         * Was `params.category.join("/")` — a relative value, resolved against metadataBase, so
         * /categories/cakes/birthday declared its canonical as /cakes/birthday: a URL that has
         * never existed on this site. A canonical pointing at a non-existent page is worse than
         * none at all, because it tells Google the real content lives somewhere unreachable.
         */
        canonical: `/categories/${params.category.join("/")}`,
      },
    }
  } catch (error) {
    // Empty metadata, not notFound() — see the note in products/[handle]/page.tsx. notFound() here
    // renders the 404 page with a 200 status, which Search Console files as a Soft 404. The page
    // component below now performs the same check and sets a real 404.
    return {}
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { sortBy, page, type, tags } = searchParams

  const { product_categories } = await getCategoryByHandle(
    params.category
  ).then((product_categories) => product_categories)

  /**
   * `!product_categories` never fired, which is why the 404 status had to come from
   * generateMetadata in the first place.
   *
   * getCategoryByHandle pushes one entry per requested handle and swallows its own errors, so an
   * unknown handle yields `[undefined]` — an array, non-empty, and therefore truthy. Every segment
   * has to resolve to a real category, so the check is per-entry rather than on the array.
   */
  if (!product_categories?.length || product_categories.some((category) => !category?.id)) {
    notFound()
  }

  return (
    <CategoryTemplate
      categories={product_categories}
      sortBy={sortBy}
      page={page}
      type={type}
      tags={tags}
    />
  )
}
