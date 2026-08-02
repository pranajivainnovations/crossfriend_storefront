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
  imageUrl?: string  // ← needs this
  /** Exact compiled prompt sent to the image provider — shown via "View AI Prompt" so it can be reused elsewhere */
  compiledPrompt?: string
  /** The underlying ai_studio.cake_designs id — always the raw backend id, unlike `id` above (which
   * gets a "showcase-" prefix for gallery-adopted designs to keep React keys unique). Sent to
   * /store/ai-studio/product so the backend can look up whether this customer already has a product
   * for this exact design, instead of only trusting frontend state that a page reload would lose. */
  designId?: string
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

export interface BakerProfile {
  id: string
  name: string
  /** All fields below this point are genuinely optional — a real baker row may not have
   *  every field filled in yet (no distance figure exists at all: we don't geocode
   *  pincodes, so it's never sent rather than faked). */
  avatar?: string
  rating?: number
  reviewCount?: number
  specialty?: string
  minPrice?: number
  deliveryRadius?: string
  /** City/state, e.g. "Sector 62, Noida" — replaces the old fabricated "2.3 km" distance figure. */
  location?: string
  turnaround?: string
  /** Formally affiliated with CrossFriend (Flow A/B eligible) — the "Trust Badge." */
  verified: boolean
  /** Has their own public store page with their own products — the "Blue Tick." */
  blueTick?: boolean
  whatsapp?: string
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

