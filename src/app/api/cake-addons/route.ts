import { medusaClient } from "@lib/config"
import { NextResponse } from "next/server"
import type { Addon } from "@modules/ai-cake-studio/types"

/**
 * GET /api/cake-addons
 *
 * Fetches all active cake add-on products from Medusa under the
 * "cake-addons" product category.
 *
 * Each add-on product should have these metadata fields set in the
 * Medusa admin:
 *   - emoji       : e.g. "🕯️"
 *   - suggestFor  : comma-separated occasions/styles, e.g. "Birthday,Kids"
 *   - price       : (optional) override price in ₹; if omitted, the cheapest
 *                   variant's price is used (amount / 100 to convert paise → ₹)
 *
 * Returns { addons: Addon[] }. Returns an empty array (never 500s to the
 * client) so the price estimator can fall back to its built-in list.
 */
export async function GET() {
  try {
    // 1. Resolve the cake-addons category
    const { product_categories } = await medusaClient.productCategories.list(
      { handle: "cake-addons", limit: 1 } as Record<string, unknown>,
      { next: { tags: ["cake-addons"] } }
    )

    if (!product_categories || product_categories.length === 0) {
      // Category not yet created in Medusa admin — fall back gracefully
      return NextResponse.json({ addons: [] })
    }

    const categoryId = product_categories[0].id

    // 2. Fetch products in that category (expand variants + prices)
    const { products } = await medusaClient.products.list(
      {
        category_id: [categoryId],
        limit: 50,
        expand: "variants,variants.prices",
      } as Record<string, unknown>,
      { next: { tags: ["cake-addons"] } }
    )

    // 3. Transform each Medusa product → Addon
    const addons: Addon[] = products.map((product) => {
      const meta = (product.metadata ?? {}) as Record<string, unknown>

      // Pick cheapest variant by price amount
      const variants = (product.variants ?? []) as Array<{
        id: string
        prices?: Array<{ amount: number; currency_code: string }>
      }>
      const cheapest = variants
        .filter((v) => v.prices && v.prices.length > 0)
        .sort(
          (a, b) =>
            (a.prices?.[0]?.amount ?? Infinity) -
            (b.prices?.[0]?.amount ?? Infinity)
        )[0]

      // Price: prefer metadata override (₹), else variant amount / 100 (paise → ₹)
      const price =
        meta.price != null
          ? Number(meta.price)
          : cheapest?.prices?.[0]?.amount != null
          ? Math.round(cheapest.prices[0].amount / 100)
          : 0

      // suggestFor: stored as "Birthday,Kids" in metadata
      const suggestForRaw = String(meta.suggestFor ?? "")
      const suggestFor = suggestForRaw
        ? suggestForRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : []

      return {
        id: product.id!,
        productId: product.id!,
        variantId: cheapest?.id,
        label: product.title ?? "",
        description:
          (product as unknown as { subtitle?: string }).subtitle ??
          product.description ??
          "",
        price,
        emoji: String(meta.emoji ?? "🎁"),
        suggestFor,
        thumbnail: product.thumbnail ?? null,
      }
    })

    return NextResponse.json({ addons })
  } catch (error) {
    console.error("[CakeAddons] Failed to fetch add-ons from Medusa", error)
    // Return empty so the estimator falls back to built-in list
    return NextResponse.json({ addons: [] })
  }
}
