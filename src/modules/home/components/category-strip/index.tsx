import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { PRODUCT_TYPE_LABELS } from "@lib/constants"
import type { ProductType } from "@lib/types/product-contract"

export default function CategoryStrip() {
  const types = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]

  return (
    <section className="content-container py-8">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
        <span className="text-sm font-medium text-ui-fg-muted whitespace-nowrap shrink-0">
          Quick shop:
        </span>
        {types.map((type) => {
          const item = PRODUCT_TYPE_LABELS[type]
          return (
            <LocalizedClientLink
              key={type}
              href={item.href}
              className="chip-cf whitespace-nowrap shrink-0"
            >
              <span>{item.emoji}</span>
              {item.label}
            </LocalizedClientLink>
          )
        })}
        <LocalizedClientLink
          href="/store"
          className="chip-cf whitespace-nowrap shrink-0 !bg-cf-orange !text-white"
        >
          View All →
        </LocalizedClientLink>
      </div>
    </section>
  )
}
