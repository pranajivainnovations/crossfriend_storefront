import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductTypes } from "@lib/data/dynamic"

export default async function CategoryStrip() {
  const types = await getProductTypes()

  if (types.length === 0) return null

  return (
    <section className="content-container py-8">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
        <span className="text-sm font-medium text-ui-fg-muted whitespace-nowrap shrink-0">
          Quick shop:
        </span>
        {types.map((item) => (
          <LocalizedClientLink
            key={item.value}
            href={item.href}
            className="chip-cf whitespace-nowrap shrink-0"
          >
            <span>{item.emoji}</span>
            {item.label}
          </LocalizedClientLink>
        ))}
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
