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
