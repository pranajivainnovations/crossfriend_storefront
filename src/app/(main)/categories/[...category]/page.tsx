import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: { category: string[] }
  searchParams: {
    sortBy?: SortOptions
    page?: string
  }
}

export async function generateStaticParams() {
  try {
    const product_categories = await listCategories()

    if (!product_categories) {
      return []
    }

    return product_categories.map((category) => ({
      category: [category.handle],
    }))
  } catch (error) {
    return []
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
      title: `${title} | CrossFriend`,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  const { product_categories } = await getCategoryByHandle(
    params.category
  ).then((product_categories) => product_categories)

  if (!product_categories) {
    notFound()
  }

  return (
    <CategoryTemplate
      categories={product_categories}
      sortBy={sortBy}
      page={page}
    />
  )
}
