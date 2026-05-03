import { getProducts, getRegion } from "@lib/data"
import { PRANAJIVA_CONTEXT, type OccasionConfig } from "@lib/constants"
import type { OccasionCollection } from "@lib/types/product-contract"
import ProductPreview from "@modules/products/components/product-preview"

type Props = {
  occasion: OccasionConfig
}

export default async function PremiumRecommendations({ occasion }: Props) {
  // Only render for occasions that have showPremium enabled
  if (!occasion.showPremium) return null

  const context = PRANAJIVA_CONTEXT[occasion.slug]
  if (!context) return null

  const region = await getRegion()
  if (!region) return null

  // Fetch wellness products for this occasion
  const { previews } = await getProducts({
    type: "wellness",
    collection: occasion.slug,
    limit: 4,
  })

  // Fallback: any wellness products
  let products = previews
  if (products.length === 0) {
    const fallback = await getProducts({ type: "wellness", limit: 4 })
    products = fallback.previews
  }

  if (products.length === 0) return null

  return (
    <section className="relative overflow-hidden">
      {/* Premium gradient background — distinct from regular sections */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50/50 to-purple-50/30" />

      <div className="relative content-container py-10 small:py-14">
        {/* Header with premium accent */}
        <div className="flex flex-col items-center text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 text-[10px] font-semibold uppercase tracking-widest mb-3">
            🌿 PranaJiva
          </span>
          <h3 className="font-heading font-bold text-2xl small:text-3xl text-grey-90">
            {context.headline}
          </h3>
          <p className="text-sm text-ui-fg-muted mt-2 max-w-md">
            {context.tagline}
          </p>
        </div>

        {/* Products grid — premium card treatment */}
        <ul className="grid grid-cols-2 small:grid-cols-4 gap-4 small:gap-6">
          {products.map((product) => (
            <li key={product.id} className="relative">
              {/* Gold accent border */}
              <div className="rounded-2xl border border-amber-200/60 p-0.5 bg-gradient-to-b from-amber-100/40 to-transparent">
                <ProductPreview
                  productPreview={product}
                  region={region}
                />
              </div>
            </li>
          ))}
        </ul>

        {/* Bottom divider — subtle premium accent line */}
        <div className="mt-10 flex justify-center">
          <div className="w-16 h-0.5 rounded-full bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
        </div>
      </div>
    </section>
  )
}
