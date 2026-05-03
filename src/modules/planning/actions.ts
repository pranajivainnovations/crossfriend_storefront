"use server"

import { getProducts, getRegion } from "@lib/data"
import type { OccasionCollection } from "@lib/types/product-contract"
import type { ProductPreviewType } from "types/global"

export interface WizardResultsPayload {
  /** Products that match the budget range (sorted to top) */
  inBudget: ProductPreviewType[]
  /** Products outside the budget range (shown in "More options") */
  morePicks: ProductPreviewType[]
  /** Currency code for display */
  currencyCode: string
}

/**
 * Server action: fetch curated products for the planning wizard.
 * Soft budget filter — in-range on top, rest below.
 */
export async function fetchWizardResults(
  occasion: OccasionCollection,
  budgetMin?: number,
  budgetMax?: number | null
): Promise<WizardResultsPayload> {
  const region = await getRegion()
  const currencyCode = region?.currency_code || "inr"

  const { products, previews } = await getProducts({
    collection: occasion,
    limit: 30,
  })

  if (!budgetMin && !budgetMax) {
    // No budget selected — return everything
    return { inBudget: previews, morePicks: [], currencyCode }
  }

  // Soft filter: split into in-budget and out-of-budget
  const inBudget: ProductPreviewType[] = []
  const morePicks: ProductPreviewType[] = []

  for (let i = 0; i < previews.length; i++) {
    const preview = previews[i]
    const product = products[i]

    // Get the cheapest variant price (in the smallest currency unit)
    const cheapestPrice = product.variants
      ?.map((v) => v.prices?.find((p) => p.currency_code === currencyCode)?.amount)
      .filter((p): p is number => p != null)
      .sort((a, b) => a - b)[0]

    if (cheapestPrice == null) {
      // No price info — put in morePicks
      morePicks.push(preview)
      continue
    }

    const min = budgetMin ?? 0
    const max = budgetMax ?? Infinity

    if (cheapestPrice >= min && cheapestPrice <= max) {
      inBudget.push(preview)
    } else {
      morePicks.push(preview)
    }
  }

  return { inBudget, morePicks, currencyCode }
}
