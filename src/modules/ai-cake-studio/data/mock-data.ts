import type {
  InspirationCard,
  CakeStyle,
  ColorPalette,
  CakeTheme,
  GeneratedDesign,
  AiAnalysis,
  Baker,
  HowItWorksStep,
  ShowcaseCreation,
} from "../types"

export const INSPIRATION_CARDS: InspirationCard[] = [
  {
    id: "birthday",
    category: "Birthday Cakes",
    styleLabel: "Style",
    emoji: "🎂",
    gradient: "from-pink-400 via-rose-300 to-orange-300",
    imagePath: "/ai-cake-studio/inspiration/birthday.jpg",
    imageAlt: "Birthday cake design",
    description: "Joyful tiers with candles and confetti",
    tags: ["Multi-tier", "Candles", "Colorful"],
  },
  {
    id: "wedding",
    category: "Wedding Cakes",
    styleLabel: "Style",
    emoji: "💍",
    gradient: "from-violet-200 via-purple-200 to-fuchsia-200",
    imagePath: "/ai-cake-studio/inspiration/wedding.jpg",
    imageAlt: "Wedding cake design",
    description: "Elegant white florals and pearl details",
    tags: ["Elegant", "Floral", "White"],
  },
  {
    id: "kids",
    category: "Kids Cakes",
    styleLabel: "Style",
    emoji: "🦄",
    gradient: "from-sky-300 via-violet-200 to-pink-300",
    imagePath: "/ai-cake-studio/inspiration/kids.jpg",
    imageAlt: "Kids cake design",
    description: "Playful unicorns, superheroes & cartoons",
    tags: ["Fun", "Colorful", "Themed"],
  },
  {
    id: "luxury",
    category: "Luxury Cakes",
    styleLabel: "Style",
    emoji: "✨",
    gradient: "from-violet-300 via-purple-300 to-fuchsia-300",
    imagePath: "/ai-cake-studio/inspiration/luxury.jpg",
    imageAlt: "Luxury cake design",
    description: "Gold dust, geode art and marble finish",
    tags: ["Premium", "Gold", "Artistic"],
  },
  {
    id: "minimal",
    category: "Minimal Cakes",
    styleLabel: "Style",
    emoji: "🤍",
    gradient: "from-slate-100 via-gray-50 to-stone-100",
    imagePath: "/ai-cake-studio/inspiration/minimal.jpg",
    imageAlt: "Minimal cake design",
    description: "Clean lines with subtle elegance",
    tags: ["Clean", "Modern", "Understated"],
  },
  {
    id: "festival",
    category: "Festival Specials",
    styleLabel: "Style",
    emoji: "🎊",
    gradient: "from-violet-400 via-fuchsia-300 to-pink-400",
    imagePath: "/ai-cake-studio/inspiration/festival.jpg",
    imageAlt: "Festival cake design",
    description: "Vibrant celebrations for every occasion",
    tags: ["Bright", "Festive", "Seasonal"],
  },
]

export const CAKE_STYLES: CakeStyle[] = [
  { id: "realistic", label: "Realistic", emoji: "🎂" },
  { id: "luxury", label: "Luxury", emoji: "✨" },
  { id: "minimal", label: "Minimal", emoji: "🤍" },
  { id: "cartoon", label: "Cartoon", emoji: "🎨" },
  { id: "wedding", label: "Wedding", emoji: "💍" },
  { id: "kids", label: "Kids", emoji: "🎠" },
  { id: "3d-fondant", label: "3D Fondant", emoji: "🏆" },
]

export const COLOR_PALETTES: ColorPalette[] = [
  { id: "pastel", label: "Pastel", colors: ["#FFB3C1", "#C5B0F0", "#AECBFA", "#B5EAD7"] },
  { id: "luxe", label: "Luxe Gold", colors: ["#F5C518", "#1C1C1C", "#C9A55A", "#FFFFFF"] },
  { id: "vivid", label: "Vivid", colors: ["#FF0080", "#FF6600", "#FFD700", "#00D4FF"] },
  { id: "neutral", label: "Neutral", colors: ["#E8D5C4", "#C4A882", "#8B7355", "#D4C4B0"] },
  { id: "purple", label: "Violet", colors: ["#7B2FF7", "#9B5FFF", "#4338CA", "#C4B5FD"] },
]

export const CAKE_THEMES: CakeTheme[] = [
  { id: "floral", label: "Floral", emoji: "🌸" },
  { id: "geometric", label: "Geometric", emoji: "◆" },
  { id: "galaxy", label: "Galaxy", emoji: "🌌" },
  { id: "tropical", label: "Tropical", emoji: "🌴" },
  { id: "vintage", label: "Vintage", emoji: "🕰️" },
  { id: "modern", label: "Modern", emoji: "▲" },
]

export const MOCK_GENERATED_DESIGNS: GeneratedDesign[] = [
  {
    id: "gen-1",
    title: "Celestial Dream",
    description: "Three-tier pastel cake with hand-painted galaxy swirls, edible gold stars, and soft lilac buttercream",
    gradient: "from-violet-400 via-purple-300 to-indigo-400",
    style: "Luxury",
    liked: false,
  },
  {
    id: "gen-2",
    title: "Enchanted Garden",
    description: "Two-tier floral masterpiece with hand-sculpted sugar flowers, green fondant leaves and gold accents",
    gradient: "from-pink-300 via-rose-200 to-amber-200",
    style: "Realistic",
    liked: false,
  },
  {
    id: "gen-3",
    title: "Geometric Luxe",
    description: "Modern single-tier fault-line cake with geometric marble effect, metallic drip and minimalist decor",
    gradient: "from-slate-300 via-violet-200 to-purple-200",
    style: "Minimal",
    liked: false,
  },
]

export const MOCK_AI_ANALYSIS: AiAnalysis = {
  complexity: "Intermediate",
  difficulty: "Moderate",
  estimatedCost: "₹2,400 – ₹3,800",
  bakingTime: "6–8 hours",
  recommendedSkill: "Professional Baker",
  serves: "18–22 guests",
  weight: "2.5 kg",
  flavour: "Vanilla Bean + Raspberry",
  bakeryReadiness: 94,
  aiConfidence: 97,
}

export const MOCK_BAKERS: Baker[] = [
  {
    id: "baker-1",
    name: "Priya's Sweet Studio",
    specialty: "Luxury & Wedding Cakes",
    rating: 4.9,
    reviews: 312,
    distance: "1.2 km",
    startingPrice: "₹1,200",
    deliveryTime: "Same day",
    avatarGradient: "from-violet-500 to-indigo-600",
    verified: true,
    badge: "Top Rated",
  },
  {
    id: "baker-2",
    name: "The Cake Lab",
    specialty: "3D & Custom Fondant",
    rating: 4.8,
    reviews: 189,
    distance: "2.5 km",
    startingPrice: "₹900",
    deliveryTime: "Next day",
    avatarGradient: "from-pink-500 to-rose-600",
    verified: true,
    badge: "AI Specialist",
  },
  {
    id: "baker-3",
    name: "Sugar & Bloom",
    specialty: "Floral & Minimal Cakes",
    rating: 4.7,
    reviews: 224,
    distance: "3.8 km",
    startingPrice: "₹750",
    deliveryTime: "Next day",
    avatarGradient: "from-amber-400 to-orange-500",
    verified: true,
    badge: "Trending",
  },
]

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: 1,
    title: "Describe your idea",
    description: "Tell AI what kind of cake you imagine",
    icon: "💬",
    accent: "from-violet-500 to-purple-500",
  },
  {
    step: 2,
    title: "Get AI cake designs",
    description: "Receive multiple unique designs in seconds",
    icon: "✨",
    accent: "from-purple-500 to-violet-500",
  },
  {
    step: 3,
    title: "Order from local baker",
    description: "Connect with verified bakers and place your order",
    icon: "🏪",
    accent: "from-violet-500 to-fuchsia-500",
  },
]

export const SHOWCASE_CREATIONS: ShowcaseCreation[] = [
  {
    id: "show-1",
    title: "Frozen Elsa",
    subtitle: "Ice blue theme",
    tag: "Kids • Cartoon",
    imagePath: "/ai-cake-studio/showcase/show-1.jpg",
    imageAlt: "Frozen Elsa cake",
  },
  {
    id: "show-2",
    title: "Chocolate Overload",
    subtitle: "Ferrero style",
    tag: "Luxury • Realistic",
    imagePath: "/ai-cake-studio/showcase/show-2.jpg",
    imageAlt: "Chocolate overload cake",
  },
  {
    id: "show-3",
    title: "Unicorn Pastel",
    subtitle: "Rainbow vibes",
    tag: "Kids • Cartoon",
    imagePath: "/ai-cake-studio/showcase/show-3.jpg",
    imageAlt: "Unicorn pastel cake",
  },
  {
    id: "show-4",
    title: "Minimal White",
    subtitle: "Gold leaves",
    tag: "Minimal • Elegant",
    imagePath: "/ai-cake-studio/showcase/show-4.jpg",
    imageAlt: "Minimal white cake",
  },
  {
    id: "show-5",
    title: "Spider Hero",
    subtitle: "Birthday special",
    tag: "Kids • 3D Sculpted",
    imagePath: "/ai-cake-studio/showcase/show-5.jpg",
    imageAlt: "Spider hero cake",
  },
  {
    id: "show-6",
    title: "Blush Floral",
    subtitle: "Birthday cake",
    tag: "Floral • Elegant",
    imagePath: "/ai-cake-studio/showcase/show-6.jpg",
    imageAlt: "Blush floral cake",
  },
]

export const HERO_PROMPT_EXAMPLES = [
  "A 2-tier pastel unicorn cake for a 6-year-old girl",
  "Elegant white wedding cake with gold accents and roses",
  "Dark chocolate geode cake for 25th anniversary",
  "Minecraft birthday cake for a 10-year-old boy",
  "Minimalist 3-tier cake with dried flowers",
]

// ─── Prompt templates shown as quick-start chips in the AI studio ──────────

export interface PromptTemplate {
  label: string
  prompt: string
  occasion: string
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    label: "🎂 Birthday Surprise",
    prompt:
      "A 2-tier birthday cake with bright sprinkles, edible gold stars, and a bold Happy Birthday message in pastel colours",
    occasion: "Birthday",
  },
  {
    label: "💍 Wedding Elegance",
    prompt:
      "A 3-tier white wedding cake with hand-sculpted sugar roses, gold leaf accents, and delicate lace fondant details",
    occasion: "Wedding",
  },
  {
    label: "🦄 Kids Fantasy",
    prompt:
      "A unicorn themed cake with rainbow layers, pastel buttercream swirls, edible glitter and a fondant unicorn topper",
    occasion: "Kids",
  },
  {
    label: "✨ Luxe Dark Floral",
    prompt:
      "A single-tier dark chocolate cake with deep burgundy sugar flowers, gold drip and moody romantic vibes",
    occasion: "Anniversary",
  },
  {
    label: "🌸 Pastel Garden",
    prompt:
      "A 2-tier spring garden cake with watercolour floral painting, fresh pastel blooms and soft sage green fondant",
    occasion: "Special",
  },
  {
    label: "🌌 Galaxy Dream",
    prompt:
      "A galaxy-themed cake with swirling nebula colours in deep purple and blue, edible stars, silver shimmer and a cosmos effect",
    occasion: "Birthday",
  },
  {
    label: "🎊 Diwali Special",
    prompt:
      "A festive Diwali cake with deep jewel tones, diya motifs, rangoli patterns in edible colours and golden shimmering finish",
    occasion: "Festival",
  },
  {
    label: "🤍 Minimalist Cake",
    prompt:
      "A clean single-tier minimalist white cake with naked frosting, fresh berries on top and a simple handwritten script message",
    occasion: "Special",
  },
]

// ─── Curated messages from CrossFriend for each occasion ─────────────────────

export const CF_OCCASION_MESSAGES: Record<string, string> = {
  Birthday:
    "Every birthday deserves a cake as unique as the person it celebrates. From all of us at CrossFriend — may your day be as sweet, vibrant, and full of joy as the design you're about to create.",
  Anniversary:
    "You've written so many beautiful chapters together. Let this cake be a delicious page in your story — made with the same love and intention you give each other every single day.",
  Wedding:
    "A wedding cake is more than sweetness — it's the first chapter of your forever. CrossFriend is honoured to be part of your story and hopes every tier reflects a year of happiness ahead.",
  Festival:
    "Festivals are best celebrated with people who matter most, and with a cake that captures the spirit of the season. Wishing you colours, sweetness, and togetherness.",
  Kids:
    "There is nothing more magical than seeing a child's eyes light up at their birthday cake. We hope this design brings that priceless moment to life — pure joy, made edible.",
  Special:
    "Some moments call for something truly extraordinary. Whatever you are celebrating today, you deserve a cake made with intention, love, and a little bit of magic.",
}
