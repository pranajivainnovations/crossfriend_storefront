export interface InspirationCard {
  id: string
  category: string
  styleLabel: string
  emoji: string
  gradient: string
  imagePath: string
  imageAlt: string
  description: string
  tags: string[]
}

export interface CakeStyle {
  id: string
  label: string
  emoji: string
}

export interface ColorPalette {
  id: string
  label: string
  colors: string[]
}

export interface CakeTheme {
  id: string
  label: string
  emoji: string
}

export interface GeneratedDesign {
  id: string
  title: string
  description: string
  gradient: string
  style: string
  liked: boolean
}

export interface AiAnalysis {
  complexity: string
  difficulty: string
  estimatedCost: string
  bakingTime: string
  recommendedSkill: string
  serves: string
  weight: string
  flavour: string
  bakeryReadiness: number
  aiConfidence: number
}

export interface Baker {
  id: string
  name: string
  specialty: string
  rating: number
  reviews: number
  distance: string
  startingPrice: string
  deliveryTime: string
  avatarGradient: string
  verified: boolean
  badge: string
}

export interface HowItWorksStep {
  step: number
  title: string
  description: string
  icon: string
  accent: string
}

export interface ShowcaseCreation {
  id: string
  title: string
  subtitle: string
  tag: string
  imagePath: string
  imageAlt: string
}

export interface StudioState {
  prompt: string
  style: string
  theme: string
  generating: boolean
  generated: boolean
  selectedDesignId: string | null
}

// ─── Price Estimator ────────────────────────────────────────────────────────

export interface EstimatorSelections {
  weight: string
  tiers: string
  shape: string
  flavor: string
  eggless: boolean
  expressDelivery: boolean
  midnightDelivery: boolean
}

export interface Addon {
  id: string
  label: string
  description: string
  price: number
  emoji: string
  suggestFor: string[]
  /** Medusa product ID — present when the add-on comes from the database */
  productId?: string
  /** Medusa variant ID — used to add the add-on to the cart as a line item */
  variantId?: string
  /** Product thumbnail URL from Medusa */
  thumbnail?: string | null
}

export interface PricingFactors {
  basePrice: number
  currency: string
  factors: {
    weight: Record<string, number>
    tiers: Record<string, number>
    shape: Record<string, number>
    style: Record<string, number>
    flavor: Record<string, number>
    eggless: number
    expressDelivery: number
    midnightDelivery: number
    messageOnCake: number
    photoOnCake: number
  }
}

export interface StudioConfigSelector {
  value: string
  label: string
  serves?: string
  emoji?: string
}

export interface StudioConfig {
  pricing: PricingFactors
  selectors: {
    weights: StudioConfigSelector[]
    tiers: StudioConfigSelector[]
    shapes: StudioConfigSelector[]
    flavors: StudioConfigSelector[]
    styles: StudioConfigSelector[]
    occasions: StudioConfigSelector[]
  }
  addons: Addon[]
}

