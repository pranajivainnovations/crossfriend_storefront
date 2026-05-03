import React from "react"
import { CreditCard } from "@medusajs/icons"

import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"
import PayPal from "@modules/common/icons/paypal"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "stripe-ideal": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "stripe-bancontact": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  manual: {
    title: "Test payment",
    icon: <CreditCard />,
  },
  // Add more payment providers here
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]

// ============================================
// CrossFriend — Occasion & Navigation Config
// ============================================

import type { ProductType, OccasionCollection } from "@lib/types/product-contract"

export interface OccasionConfig {
  slug: OccasionCollection
  label: string
  tagline: string
  emoji: string
  /** Section display priority — which product types appear first on the occasion page */
  sectionOrder: ProductType[]
  /** Whether PranaJiva / wellness products are shown for this occasion */
  showPremium: boolean
  gradient: string
}

export const OCCASIONS: OccasionConfig[] = [
  {
    slug: "birthday",
    label: "Birthday",
    tagline: "Make their day unforgettable",
    emoji: "🎂",
    sectionOrder: ["cake", "decor", "gift", "costume"],
    showPremium: false,
    gradient: "from-cf-orange to-cf-coral",
  },
  {
    slug: "anniversary",
    label: "Anniversary",
    tagline: "Celebrate your love story",
    emoji: "💝",
    sectionOrder: ["cake", "gift", "wellness", "decor"],
    showPremium: true,
    gradient: "from-cf-pink to-cf-purple",
  },
  {
    slug: "festival",
    label: "Festivals",
    tagline: "Spread the festive joy",
    emoji: "🪔",
    sectionOrder: ["gift", "wellness", "decor", "cake"],
    showPremium: true,
    gradient: "from-cf-yellow to-cf-orange",
  },
  {
    slug: "kids",
    label: "Kids Events",
    tagline: "Fun for the little ones",
    emoji: "🎈",
    sectionOrder: ["costume", "cake", "decor", "gift"],
    showPremium: false,
    gradient: "from-cf-purple to-cf-pink",
  },
  {
    slug: "special",
    label: "Special Moments",
    tagline: "Because every moment matters",
    emoji: "✨",
    sectionOrder: ["gift", "cake", "decor", "wellness"],
    showPremium: true,
    gradient: "from-cf-coral to-cf-purple",
  },
]

/** Quick lookup: slug → config */
export const OCCASION_MAP = Object.fromEntries(
  OCCASIONS.map((o) => [o.slug, o])
) as Record<OccasionCollection, OccasionConfig>

/** Product type display labels for nav / filters */
export const PRODUCT_TYPE_LABELS: Record<ProductType, { label: string; href: string; emoji: string }> = {
  cake: { label: "Cakes", href: "/store?type=cake", emoji: "🎂" },
  decor: { label: "Decorations", href: "/store?type=decor", emoji: "🎊" },
  gift: { label: "Gifts", href: "/store?type=gift", emoji: "🎁" },
  costume: { label: "Costumes", href: "/store?type=costume", emoji: "🎭" },
  wellness: { label: "Premium / Wellness", href: "/store?type=wellness", emoji: "🌿" },
}

// ============================================
// Quick-Add Celebration Kit Definitions
// ============================================

export interface KitItem {
  /** Product type to look up — first matching product with kit_eligible metadata is used */
  type: ProductType
  label: string
  /** How many units to add to cart */
  quantity: number
}

export interface KitConfig {
  label: string
  description: string
  emoji: string
  items: KitItem[]
}

/**
 * Quick-add kit composition per occasion.
 * Uses default (first / cheapest) variant for speed.
 * User can customize in cart.
 */
export const OCCASION_KITS: Record<OccasionCollection, KitConfig> = {
  birthday: {
    label: "Birthday Kit",
    description: "Cake + Decor + Gift — everything to get started",
    emoji: "🎉",
    items: [
      { type: "cake", label: "Birthday Cake", quantity: 1 },
      { type: "decor", label: "Basic Decor Pack", quantity: 1 },
      { type: "gift", label: "Gift", quantity: 1 },
    ],
  },
  anniversary: {
    label: "Anniversary Kit",
    description: "Cake + Gift + Wellness — a romantic touch",
    emoji: "💐",
    items: [
      { type: "cake", label: "Anniversary Cake", quantity: 1 },
      { type: "gift", label: "Gift", quantity: 1 },
      { type: "wellness", label: "Wellness Item", quantity: 1 },
    ],
  },
  festival: {
    label: "Festival Kit",
    description: "Gift + Decor — festive essentials",
    emoji: "🪔",
    items: [
      { type: "gift", label: "Festival Gift", quantity: 1 },
      { type: "decor", label: "Festive Decor", quantity: 1 },
    ],
  },
  kids: {
    label: "Kids Party Kit",
    description: "Cake + Costume + Decor — party ready!",
    emoji: "🎈",
    items: [
      { type: "cake", label: "Kids Cake", quantity: 1 },
      { type: "costume", label: "Costume", quantity: 1 },
      { type: "decor", label: "Party Decor", quantity: 1 },
    ],
  },
  special: {
    label: "Celebration Kit",
    description: "Gift + Cake — a thoughtful combo",
    emoji: "✨",
    items: [
      { type: "gift", label: "Gift", quantity: 1 },
      { type: "cake", label: "Cake", quantity: 1 },
    ],
  },
}

// ============================================
// PranaJiva Premium — Contextual Config
// ============================================

export interface PremiumConfig {
  headline: string
  tagline: string
}

/**
 * Contextual PranaJiva / wellness messaging per occasion.
 * Only occasions with `showPremium: true` should display these.
 */
export const PRANAJIVA_CONTEXT: Partial<Record<OccasionCollection, PremiumConfig>> = {
  anniversary: {
    headline: "Premium Wellness Picks",
    tagline: "Elevate your anniversary with self-care & intimate wellness gifts",
  },
  festival: {
    headline: "Ritual & Wellness Gifting",
    tagline: "Traditional wellness essentials to enrich festive celebrations",
  },
  special: {
    headline: "Premium Picks by PranaJiva",
    tagline: "Curated wellness gifts for life's meaningful moments",
  },
}
