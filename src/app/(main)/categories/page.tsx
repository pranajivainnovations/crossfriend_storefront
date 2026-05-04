import { Metadata } from "next"
import { listCategories } from "@lib/data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  FadeInSection,
  StaggerGrid,
  StaggerItem,
} from "@modules/common/components/motion"

export const revalidate = 300

export const metadata: Metadata = {
  title: "All Categories",
  description:
    "Browse all product categories — cakes, decorations, gifts, costumes, wellness products, toys, and more.",
  openGraph: {
    title: "Shop by Category | CrossFriend",
    description:
      "Browse all product categories — cakes, decorations, gifts, costumes, wellness, toys, and more.",
  },
}

// Category emoji map (extensible for new categories like toys)
const CATEGORY_EMOJI: Record<string, string> = {
  cake: "🎂",
  cakes: "🎂",
  decor: "🎊",
  decorations: "🎊",
  gift: "🎁",
  gifts: "🎁",
  costume: "🎭",
  costumes: "🎭",
  wellness: "🌿",
  premium: "✨",
  toys: "🧸",
  games: "🎮",
  balloons: "🎈",
  flowers: "💐",
  candles: "🕯️",
}

function getCategoryEmoji(handle: string): string {
  const lower = handle.toLowerCase()
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return "🛍️"
}

export default async function CategoriesPage() {
  const categories = await listCategories()

  // Only show parent categories (top-level)
  const parentCategories = categories?.filter(
    (cat) => !cat.parent_category_id
  )

  return (
    <div className="bg-cf-warm min-h-screen">
      <div className="content-container py-12 small:py-20">
        {/* Hero heading */}
        <FadeInSection className="text-center mb-12">
          <h1 className="cf-heading text-3xl small:text-5xl mb-3">
            Shop by <span className="gradient-cf-text">Category</span>
          </h1>
          <p className="text-ui-fg-subtle text-base small:text-lg max-w-lg mx-auto">
            Find exactly what you need. From cakes to costumes, toys to
            decorations — everything for your celebration.
          </p>
        </FadeInSection>

        {/* Categories grid */}
        <StaggerGrid className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4 small:gap-6 max-w-5xl mx-auto">
          {parentCategories?.map((category) => (
            <StaggerItem key={category.id}>
              <LocalizedClientLink
                href={`/categories/${category.handle}`}
                className="group block"
              >
                <div className="card-cf p-5 small:p-6 text-center hover-lift h-full flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
                  {/* Gradient hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cf-orange/5 to-cf-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                      {getCategoryEmoji(category.handle)}
                    </span>
                    <h2 className="cf-heading text-base small:text-lg group-hover:text-cf-orange transition-colors">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-xs text-ui-fg-subtle line-clamp-2 max-w-[200px]">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              </LocalizedClientLink>
            </StaggerItem>
          ))}
        </StaggerGrid>

        {(!parentCategories || parentCategories.length === 0) && (
          <div className="text-center py-20 text-ui-fg-muted">
            <p className="text-lg">No categories available yet.</p>
            <p className="text-sm mt-2">Check back soon — new categories like toys are coming!</p>
          </div>
        )}
      </div>
    </div>
  )
}
