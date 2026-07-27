"use client"

import DesignLightbox from "./design-lightbox"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { Customer } from "@medusajs/medusa"
import type { GeneratedDesign } from "../types"
import {
  MOCK_GENERATED_DESIGNS,
  PROMPT_TEMPLATES,
  CF_OCCASION_MESSAGES,
} from "../data/mock-data"
import PriceEstimator from "./price-estimator"
import MobileOtpAuth from "./mobile-otp-auth"
import BakerFinder from "./baker-finder"
import PromptReveal from "./prompt-reveal"
import { generateCakeDesigns } from "@lib/data/ai-studio"

const FREE_ATTEMPTS_LIMIT = 3

// ─── AI model picker — config-driven ────────────────────────────────────────
//
// The actual list (which models show, which is default) comes from
// aiImageModels.options in ai-cake-studio-config.json, fetched at runtime —
// so enabling/disabling a model (e.g. re-enabling Gemini later) or adding a
// second model from the same provider is a config edit, not a code change.
// This constant is only the fallback used before that fetch resolves (or if
// it fails), so it must mirror the config file's shape and intent.
type AiModelOption = {
  id: string
  provider: string
  model: string
  label: string
  hint: string
  enabled: boolean
  default?: boolean
}

const FALLBACK_AI_MODEL_OPTIONS: AiModelOption[] = [
  { id: "openai-gpt-image-1", provider: "openai", model: "gpt-image-1", label: "GPT Image", hint: "Best for on-cake text & detailed, multi-element scenes", enabled: true, default: true },
  { id: "replicate-flux", provider: "replicate", model: "black-forest-labs/flux-1.1-pro", label: "FLUX", hint: "Fast, photorealistic bakery-style shots", enabled: true },
  { id: "gemini-2.5-flash-image", provider: "gemini", model: "gemini-2.5-flash-image", label: "Gemini", hint: "Detailed, multi-element scenes", enabled: false },
]

function pickDefaultModelId(options: AiModelOption[]): string {
  return (
    options.find((o) => o.enabled && o.default)?.id ??
    options.find((o) => o.enabled)?.id ??
    options[0]?.id ??
    ""
  )
}

// Mock designs are only used when explicitly enabled (local dev) so that we
// never hit the paid AI provider by accident. Unset/false in every deployed
// environment calls the real Medusa backend via /api/ai-studio/generate.
const USE_MOCK_AI_STUDIO = process.env.NEXT_PUBLIC_USE_MOCK_AI_STUDIO === "true"

// ─── Types ─────────────────────────────────────────────────────────────────

type BuilderOption = { value: string; label: string; emoji?: string; serves?: string }

type StudioSelectors = {
  occasions: BuilderOption[]
  flavors: BuilderOption[]
  styles: BuilderOption[]
  weights?: BuilderOption[]
  tiers?: BuilderOption[]
}

type SelectorState = {
  style: string
  occasion: string
  flavor: string
  tiers: string
  shape: string
  color: string
  cakeMessage: string
}

/** Handoff payload for "Use this cake" — from either the showcase gallery
 * (cross-page, via sessionStorage) or the compact community section
 * (same-page, via CustomEvent). Adopts an already-generated design directly,
 * skipping the prompt/generate step entirely. */
type UseCakePayload = {
  id: string
  imageUrl: string
  style: string
  occasion: string
  flavor: string
  prompt: string
  compiledPrompt?: string
}

/** "Use this prompt" handoff — style/occasion/flavor are optional since older
 * payloads (or a malformed one) might only carry the prompt text. */
type UsePromptPayload = {
  prompt: string
  style?: string
  occasion?: string
  flavor?: string
}

type Props = {
  customer: Omit<Customer, "password_hash"> | null
}

// ─── Zodiac helper ────────────────────────────────────────────────────────

type ZodiacInfo = { sign: string; emoji: string; suggestion: string }

function getZodiac(dob: string): ZodiacInfo | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const m = d.getMonth() + 1
  const day = d.getDate()

  if ((m === 3 && day >= 21) || (m === 4 && day <= 19))
    return { sign: "Aries", emoji: "♈", suggestion: "Bold reds, energetic geometric patterns, fire-inspired accents" }
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20))
    return { sign: "Taurus", emoji: "♉", suggestion: "Rich earth tones, lush floral accents, soft greens" }
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20))
    return { sign: "Gemini", emoji: "♊", suggestion: "Dual-tone tiers, playful contrasts, light and airy design" }
  if ((m === 6 && day >= 21) || (m === 7 && day <= 22))
    return { sign: "Cancer", emoji: "♋", suggestion: "Soft silvers, pearl whites, moonlit shimmer details" }
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22))
    return { sign: "Leo", emoji: "♌", suggestion: "Gold leafing, regal sunburst patterns, crown toppers" }
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22))
    return { sign: "Virgo", emoji: "♍", suggestion: "Minimalist clean lines, botanical greens, precise sugar florals" }
  if ((m === 9 && day >= 23) || (m === 10 && day <= 22))
    return { sign: "Libra", emoji: "♎", suggestion: "Balanced symmetry, rose pinks, elegant pearl details" }
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21))
    return { sign: "Scorpio", emoji: "♏", suggestion: "Deep purples, mystical dark florals, silver moon accents" }
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21))
    return { sign: "Sagittarius", emoji: "♐", suggestion: "Adventurous geometric patterns, vibrant multicolour tiers" }
  if ((m === 12 && day >= 22) || (m === 1 && day <= 19))
    return { sign: "Capricorn", emoji: "♑", suggestion: "Sophisticated dark tones, structured tiers, gold accents" }
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18))
    return { sign: "Aquarius", emoji: "♒", suggestion: "Electric blues, abstract art, futuristic unique shapes" }
  return { sign: "Pisces", emoji: "♓", suggestion: "Dreamy pastels, ocean-inspired waves, ethereal shimmer" }
}

/** Age from an actual birthdate — only meaningful when the customer gave their own DOB. */
function computeAge(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())
  if (!hasHadBirthdayThisYear) age--

  return age >= 0 ? age : null
}

// ─── Fallback selectors ──────────────────────────────────────────────────

const FALLBACK_SELECTORS: StudioSelectors = {
  occasions: [
    { value: "Birthday", label: "Birthday", emoji: "🎂" },
    { value: "Anniversary", label: "Anniversary", emoji: "💍" },
    { value: "Wedding", label: "Wedding", emoji: "👰" },
    { value: "Festival", label: "Festival", emoji: "🎪" },
    { value: "Kids", label: "Kids Party", emoji: "👶" },
    { value: "Special", label: "Special", emoji: "🎁" },
  ],
  flavors: [
    { value: "Chocolate", label: "Chocolate", emoji: "🍫" },
    { value: "Vanilla", label: "Vanilla", emoji: "🍦" },
    { value: "Red Velvet", label: "Red Velvet", emoji: "❤️" },
    { value: "Strawberry", label: "Strawberry", emoji: "🍓" },
    { value: "Butterscotch", label: "Butterscotch", emoji: "🧈" },
    { value: "Caramel", label: "Caramel", emoji: "🍮" },
    { value: "Mango", label: "Mango", emoji: "🥭" },
    { value: "Blueberry", label: "Blueberry", emoji: "🫐" },
  ],
  styles: [
    { value: "Realistic", label: "Realistic", emoji: "🎂" },
    { value: "Cartoon", label: "Cartoon", emoji: "🎨" },
    { value: "Luxury", label: "Luxury", emoji: "✨" },
    { value: "Minimal", label: "Minimal", emoji: "🤍" },
    { value: "3D Sculpted", label: "3D Sculpted", emoji: "🏆" },
    { value: "Wedding", label: "Wedding", emoji: "💍" },
    { value: "Kids", label: "Kids", emoji: "🎠" },
  ],
  weights: [
    { value: "0.5kg", label: "0.5 kg", serves: "2-4" },
    { value: "1kg", label: "1 kg", serves: "6-8" },
    { value: "1.5kg", label: "1.5 kg", serves: "10-12" },
    { value: "2kg", label: "2 kg", serves: "15-20" },
    { value: "3kg", label: "3 kg", serves: "25-30" },
    { value: "4kg", label: "4 kg", serves: "35-40" },
    { value: "5kg", label: "5 kg", serves: "50+" },
  ],
  tiers: [
    { value: "1", label: "Single", emoji: "1️⃣" },
    { value: "2", label: "Two Tier", emoji: "2️⃣" },
    { value: "3", label: "Three Tier", emoji: "3️⃣" },
    { value: "4", label: "Four Tier", emoji: "4️⃣" },
  ],
}

const SHAPE_OPTIONS: BuilderOption[] = [
  { value: "Round", label: "Round", emoji: "⭕" },
  { value: "Square", label: "Square", emoji: "⬜" },
  { value: "Heart", label: "Heart", emoji: "💗" },
  { value: "Oval", label: "Oval", emoji: "🥚" },
]


const COLOR_OPTIONS: BuilderOption[] = [
  { value: "Pink", label: "Pink", emoji: "🩷" },
  { value: "Blue", label: "Blue", emoji: "💙" },
  { value: "White", label: "White", emoji: "🤍" },
  { value: "Gold", label: "Gold", emoji: "✨" },
  { value: "Black", label: "Black", emoji: "🖤" },
  { value: "Pastel", label: "Pastel", emoji: "🌸" },
  { value: "Rainbow", label: "Rainbow", emoji: "🌈" },
  { value: "No preference", label: "Any", emoji: "🎨" },
]

// ─── Sub-components ────────────────────────────────────────────────────────

function EmptyCreationsPanel() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 p-6 text-center">
      <span className="text-5xl text-violet-500">🎂</span>
      <p className="text-sm font-semibold text-slate-600">Your generated designs will appear here</p>
      <p className="text-xs text-slate-400">Describe your cake and hit Generate</p>
    </div>
  )
}

const CAKE_BUILDING_PHRASES = [
  "Whisking the batter...",
  "Baking the layers...",
  "Adding the frosting...",
  "Piping the details...",
  "Final touches...",
]

/**
 * Lightweight "building a cake" indicator shown while generating — tiers pop
 * in one by one (looping) with a bobbing candle and rotating status text, so
 * a wait doesn't read as "nothing is happening." Pure CSS transforms via
 * framer-motion, no images/video.
 */
function CakeBuildingAnimation({ compact = false }: { compact?: boolean }) {
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % CAKE_BUILDING_PHRASES.length)
    }, 1600)
    return () => clearInterval(id)
  }, [])

  const tiers = [
    { w: "w-24", color: "bg-amber-200" },
    { w: "w-20", color: "bg-pink-200" },
    { w: "w-14", color: "bg-violet-300" },
  ]

  return (
    <div
      className={`flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-violet-200 bg-violet-50/40 ${
        compact ? "px-2" : "px-4"
      }`}
    >
      <div className="flex flex-col-reverse items-center gap-1">
        {tiers.map((tier, i) => (
          <motion.div
            key={i}
            className={`h-4 ${tier.w} rounded-md ${tier.color} shadow-sm`}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: i * 0.3,
              repeat: Infinity,
              repeatDelay: 1.1,
              repeatType: "reverse",
            }}
          />
        ))}
        <motion.span
          className="text-lg"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          🕯️
        </motion.span>
      </div>
      <p className="text-center text-xs font-semibold text-violet-500">
        {CAKE_BUILDING_PHRASES[phraseIndex]}
      </p>
    </div>
  )
}

function DesignCard({
  design,
  selected,
  onExpand,
}: {
  design: GeneratedDesign
  selected: boolean
  onExpand: (e: React.MouseEvent) => void
}) {
  const hasImage = Boolean(design.imageUrl)

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white transition ${
        selected ? "border-violet-400 ring-2 ring-violet-300 shadow-sm" : "border-violet-100"
      }`}
    >
      <div className="relative">
        {hasImage ? (
          <img
            src={design.imageUrl}
            alt={design.title}
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={`h-28 w-full bg-gradient-to-br ${design.gradient}`} />
        )}

        <button
          type="button"
          onClick={onExpand}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 hover:scale-110"
          title="View full size"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M13.28 7.78l3.22-3.22v2.69a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.69l-3.22 3.22a.75.75 0 001.06 1.06zM2 17.25v-4.5a.75.75 0 011.5 0v2.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" />
          </svg>
        </button>

        {selected && (
          <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white shadow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-3">
        <h4 className="text-sm font-semibold text-slate-900">{design.title}</h4>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{design.description}</p>
      </div>
    </div>
  )
}

function AttemptsBadge({ attemptsLeft }: { attemptsLeft: number }) {
  if (attemptsLeft <= 0) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
      ✨ {attemptsLeft} free attempt{attemptsLeft !== 1 ? "s" : ""} remaining
    </span>
  )
}

function ExhaustedBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <p className="text-sm font-semibold text-amber-800">You have used all your free attempts</p>
      <p className="mt-1 text-xs text-amber-700">Place a custom cake order to unlock more attempts.</p>
    </motion.div>
  )
}

/** Reusable pill selector row */
function PillSelector({
  options,
  value,
  onChange,
  disabled,
  size = "normal",
}: {
  options: BuilderOption[]
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  size?: "normal" | "small"
}) {
  const baseClass = size === "small"
    ? "rounded-full px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-60"
    : "rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60"

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`${baseClass} ${
            value === opt.value
              ? "bg-violet-600 text-white"
              : "border border-violet-200 bg-white text-violet-700 hover:border-violet-400"
          }`}
        >
          {opt.emoji && <>{opt.emoji} </>}{opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export default function AiStudioSection({ customer }: Props) {
  const isLoggedIn = Boolean(customer)

  const [selectors, setSelectors] = useState<StudioSelectors>(FALLBACK_SELECTORS)
  const [prompt, setPrompt] = useState("")
  const [aiModelOptions, setAiModelOptions] = useState<AiModelOption[]>(FALLBACK_AI_MODEL_OPTIONS)
  const [aiModelId, setAiModelId] = useState<string>(() => pickDefaultModelId(FALLBACK_AI_MODEL_OPTIONS))
  const [sel, setSel] = useState<SelectorState>({
    style: FALLBACK_SELECTORS.styles[0].value,
    occasion: FALLBACK_SELECTORS.occasions[0].value,
    flavor: FALLBACK_SELECTORS.flavors[0].value,
    tiers: "1",
    shape: "Round",
    color: "No preference",
    cakeMessage: "",
  })

  // DOB + horoscope — always included in generation (no opt-in checkbox);
  // falls back to today's seasonal sign when no birthday is given. Today's
  // date is always valid, so the fallback getZodiac() call can never be null.
  const [dob, setDob] = useState("")
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], [])
  const zodiac = useMemo(() => getZodiac(dob), [dob])
  const effectiveZodiac = useMemo(() => zodiac ?? getZodiac(todayStr)!, [zodiac, todayStr])
  // Only meaningful for a real birthdate — never derived from the fallback date.
  const age = useMemo(() => computeAge(dob), [dob])
  const [horoscopeQuote, setHoroscopeQuote] = useState<string | null>(null)

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null)
  const [showUsePanel, setShowUsePanel] = useState(false)
  // Starts empty — each successful generation APPENDS its design(s) here so a
  // regenerate click adds a new card instead of replacing the previous one.
  // (MOCK_GENERATED_DESIGNS is only ever added via the mock branch below.)
  const [designs, setDesigns] = useState<GeneratedDesign[]>([])
  const [attemptsLeft, setAttemptsLeft] = useState(isLoggedIn ? FREE_ATTEMPTS_LIMIT : 0)
  const [generationError, setGenerationError] = useState<string | null>(null)
  // Bumped whenever "Use This Design" is clicked — PriceEstimator watches
  // this to auto-expand itself instead of requiring a second manual click.
  const [priceEstimatorOpenSignal, setPriceEstimatorOpenSignal] = useState(0)

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const hasAttempts = attemptsLeft > 0
  const canGenerate = isLoggedIn && hasAttempts && prompt.trim().length > 0 && !generating
  const cfMessage = CF_OCCASION_MESSAGES[sel.occasion] ?? CF_OCCASION_MESSAGES["Special"]

  // Load selectors + AI model options from config
  useEffect(() => {
    fetch("/api/ai-cake-studio-config")
      .then((r) => r.json())
      .then((data: {
        selectors?: StudioSelectors
        freeAttemptsLimit?: number
        aiImageModels?: { options?: AiModelOption[] }
      }) => {
        if (data.freeAttemptsLimit != null) {
          setAttemptsLeft(isLoggedIn ? data.freeAttemptsLimit : 0)
        }
        if (data.selectors) {
          setSelectors(data.selectors)
          setSel((prev) => ({
            ...prev,
            style: data.selectors!.styles?.[0]?.value ?? prev.style,
            occasion: data.selectors!.occasions?.[0]?.value ?? prev.occasion,
            flavor: data.selectors!.flavors?.[0]?.value ?? prev.flavor,
          }))
        }
        const fetchedOptions = data.aiImageModels?.options
        if (fetchedOptions && fetchedOptions.length > 0) {
          setAiModelOptions(fetchedOptions)
          setAiModelId(pickDefaultModelId(fetchedOptions))
        }
      })
      .catch(() => {})
  }, [isLoggedIn])

  // Listen for "Use this prompt" / "Use this cake" from showcase gallery
  useEffect(() => {
    // Check if navigated from gallery page with a prompt
    const storedPrompt = sessionStorage.getItem("cf-use-prompt")
    if (storedPrompt) {
      try {
        applyUsePromptPayload(JSON.parse(storedPrompt))
      } catch {
        // Older/malformed payload (plain string, not JSON) — still usable as the prompt itself
        applyUsePromptPayload({ prompt: storedPrompt })
      }
      sessionStorage.removeItem("cf-use-prompt")
    }
    // Check if navigated from gallery page with a specific cake — skips the
    // prompt/generate step entirely, jumps straight to accepting that design.
    const storedCake = sessionStorage.getItem("cf-use-cake")
    if (storedCake) {
      try {
        adoptShowcaseDesign(JSON.parse(storedCake))
      } catch {
        // Malformed payload — ignore, nothing to recover
      }
      sessionStorage.removeItem("cf-use-cake")
    }
    // Listen for same-page events from the compact showcase section
    const promptHandler = (e: Event) => {
      const detail = (e as CustomEvent<UsePromptPayload>).detail
      if (detail?.prompt) {
        applyUsePromptPayload(detail)
      }
    }
    const cakeHandler = (e: Event) => {
      const detail = (e as CustomEvent<UseCakePayload>).detail
      if (detail?.imageUrl) {
        adoptShowcaseDesign(detail)
      }
    }
    window.addEventListener("use-showcase-prompt", promptHandler)
    window.addEventListener("use-showcase-cake", cakeHandler)
    return () => {
      window.removeEventListener("use-showcase-prompt", promptHandler)
      window.removeEventListener("use-showcase-cake", cakeHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    setGenerationError(null)
    setSelectedDesignId(null)
    setShowUsePanel(false)
    setHoroscopeQuote(null)

    if (USE_MOCK_AI_STUDIO) {
      await new Promise((resolve) => setTimeout(resolve, 1800))
      // Append (with freshly-suffixed ids so React keys stay unique across
      // repeated mock "generations") instead of replacing — same behavior
      // as the real branch below.
      setDesigns((prev) => [
        ...prev,
        ...MOCK_GENERATED_DESIGNS.map((d) => ({
          ...d,
          id: `${d.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        })),
      ])
      setGenerating(false)
      setGenerated(true)
      setAttemptsLeft((prev) => Math.max(0, prev - 1))
      return
    }

    const selectedModel = aiModelOptions.find((o) => o.id === aiModelId)

    const result = await generateCakeDesigns({
      prompt,
      style: sel.style,
      occasion: sel.occasion,
      flavor: sel.flavor,
      tiers: sel.tiers,
      shape: sel.shape,
      color: sel.color,
      cakeMessage: sel.cakeMessage.trim() || undefined,
      zodiacInfluence: { sign: effectiveZodiac.sign, suggestion: effectiveZodiac.suggestion },
      age: age ?? undefined,
      imageProvider: selectedModel?.provider,
      imageModel: selectedModel?.model,
    })

    setGenerating(false)

    if (!result.success || !result.designs?.length) {
      setGenerationError(result.error || "Something went wrong. Please try again.")
      return
    }

    // Append new design(s) to whatever's already there — a regenerate click
    // adds another card instead of replacing the previous one.
    setDesigns((prev) => [
      ...prev,
      ...result.designs!.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        style: d.style,
        gradient: "from-violet-400 via-purple-300 to-indigo-400",
        liked: false,
        imageUrl: d.imageUrl,
        compiledPrompt: d.compiledPrompt,
      })),
    ])
    setGenerated(true)
    setHoroscopeQuote(result.horoscopeQuote || null)
    setAttemptsLeft((prev) =>
      result.creditsRemaining != null && result.creditsRemaining >= 0
        ? result.creditsRemaining
        : Math.max(0, prev - 1)
    )
  }

  const handleSelectDesign = (id: string) => {
    setSelectedDesignId(id)
    setShowUsePanel(true)
  }

  /**
   * Positive, one-click "accept this one" action — locks in the design and
   * jumps straight to the price estimate instead of using the prompt again.
   * Only attributes the price estimator itself exposes (weight, flavor,
   * message, delivery, add-ons) remain editable from here on; the visual
   * design itself is now fixed to this generated image.
   */
  const handleAcceptDesign = (id: string) => {
    setSelectedDesignId(id)
    setShowUsePanel(true)
    setPriceEstimatorOpenSignal((n) => n + 1)
    requestAnimationFrame(() => {
      document.querySelector("[data-price-estimator]")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  /**
   * "Use this cake" — adopts an already-generated design (from the showcase
   * gallery, same-page or cross-page) as a card here, carries over its known
   * style/occasion/flavor into the selectors, and immediately accepts it —
   * the customer never has to type a prompt for this cake at all.
   */
  const adoptShowcaseDesign = (payload: UseCakePayload) => {
    const adopted: GeneratedDesign = {
      id: `showcase-${payload.id}`,
      title: `${payload.style}${payload.occasion ? " · " + payload.occasion : ""} Cake`,
      description: payload.prompt,
      gradient: "from-violet-400 via-purple-300 to-indigo-400",
      style: payload.style,
      liked: false,
      imageUrl: payload.imageUrl,
      compiledPrompt: payload.compiledPrompt,
    }
    setSel((c) => ({
      ...c,
      style: payload.style || c.style,
      occasion: payload.occasion || c.occasion,
      flavor: payload.flavor || c.flavor,
    }))
    setDesigns((prev) => [...prev, adopted])
    document.getElementById("ai-studio")?.scrollIntoView({ behavior: "smooth" })
    // Wait a tick for the card to actually exist before selecting/scrolling to it.
    setTimeout(() => handleAcceptDesign(adopted.id), 250)
  }

  /**
   * "Use this prompt" — always loads the prompt text; if the design also
   * carried known style/occasion/flavor, asks before overwriting whatever
   * the customer may have already picked in the form, rather than silently
   * clobbering it (unlike "Use this cake," which replaces the whole design
   * outright, this flow is meant to be a starting point the customer keeps
   * customizing from).
   */
  const applyUsePromptPayload = (payload: UsePromptPayload) => {
    setPrompt(payload.prompt)
    const hasSettings = Boolean(payload.style || payload.occasion || payload.flavor)
    if (!hasSettings) return

    const wantsSettings =
      typeof window !== "undefined" &&
      window.confirm("Also load this design's style, occasion and flavor settings?")
    if (wantsSettings) {
      setSel((c) => ({
        ...c,
        style: payload.style || c.style,
        occasion: payload.occasion || c.occasion,
        flavor: payload.flavor || c.flavor,
      }))
    }
  }

  const handleExpandDesign = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  // Share logic
  const [showShareSheet, setShowShareSheet] = useState(false)

  const handleShare = async (design: GeneratedDesign) => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const text =
      `🎂 Check out this "${design.title}" I designed on CrossFriend!\n\n` +
      `✨ ${sel.occasion} · ${sel.style} style\n` +
      `🎉 Generate your own cake design for free → ${url}`
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: design.title, text, url })
      } catch {}
      return
    }
    setShowShareSheet(true)
  }

  return (
    <section id="ai-studio" className="px-4 py-8 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[26px] border border-violet-100 bg-white p-5 shadow-[0_24px_60px_rgba(109,40,217,0.12)] sm:p-6">

          {/* Header */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">Create Your Cake with AI</h3>
            <p className="text-xs text-slate-500">Describe, choose style and let AI do the magic ✨</p>
          </div>

          {/* Prompt textarea */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="block text-sm font-semibold text-slate-700">
              Describe your cake idea...
            </label>
            <div
              role="radiogroup"
              aria-label="AI model"
              className="flex items-center gap-1 rounded-full border border-violet-100 bg-violet-50/60 p-1"
            >
              {aiModelOptions.filter((opt) => opt.enabled).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={aiModelId === opt.id}
                  title={opt.hint}
                  disabled={generating}
                  onClick={() => setAiModelId(opt.id)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    aiModelId === opt.id
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-violet-500 hover:bg-violet-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 320))}
            rows={3}
            disabled={generating}
            placeholder="e.g. A two tier princess cake with pink roses and golden crown"
            className="w-full resize-none rounded-2xl border border-violet-100 bg-violet-50/30 p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="mt-1 text-right text-[11px] text-slate-400">{prompt.length}/320</p>

          {/* Prompt templates */}
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold text-slate-500">Not sure what to type? Pick a template:</p>
            <div className="flex flex-wrap gap-2">
              {PROMPT_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  disabled={generating}
                  onClick={() => setPrompt(t.prompt)}
                  className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 transition hover:border-violet-400 hover:bg-violet-100 disabled:opacity-50"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Style</p>
            <PillSelector
              options={selectors.styles}
              value={sel.style}
              onChange={(v) => setSel((c) => ({ ...c, style: v }))}
              disabled={generating}
            />
          </div>

          {/* Occasion */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Occasion</p>
            <PillSelector
              options={selectors.occasions}
              value={sel.occasion}
              onChange={(v) => setSel((c) => ({ ...c, occasion: v }))}
              disabled={generating}
            />
          </div>

          {/* Flavor */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Flavor</p>
            <PillSelector
              options={selectors.flavors}
              value={sel.flavor}
              onChange={(v) => setSel((c) => ({ ...c, flavor: v }))}
              disabled={generating}
            />
          </div>

          {/* Tiers */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Tiers</p>
            <PillSelector
              options={selectors.tiers || FALLBACK_SELECTORS.tiers!}
              value={sel.tiers}
              onChange={(v) => setSel((c) => ({ ...c, tiers: v }))}
              disabled={generating}
            />
          </div>

          {/* Shape */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Shape</p>
            <PillSelector
              options={SHAPE_OPTIONS}
              value={sel.shape}
              onChange={(v) => setSel((c) => ({ ...c, shape: v }))}
              disabled={generating}
            />
          </div>
          

          {/* Personalize */}
          <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/20 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">✍️ Personalize</p>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-[11px] font-medium text-slate-500">Message on cake (optional)</p>
                <input
                  type="text"
                  placeholder="e.g. Happy Birthday Priya"
                  value={sel.cakeMessage}
                  onChange={(e) => setSel((c) => ({ ...c, cakeMessage: e.target.value.slice(0, 50) }))}
                  disabled={generating}
                  className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none disabled:opacity-60"
                />
                <p className="mt-1 text-right text-[10px] text-slate-400">{sel.cakeMessage.length}/50</p>
                <p className="mt-1 text-[10px] italic text-slate-400">
                  We&apos;ll try to show this on the AI preview — and you can add or change it again once you pick a design, in the price estimate section.
                </p>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-medium text-slate-500">Color preference</p>
                <PillSelector
                  options={COLOR_OPTIONS}
                  value={sel.color}
                  onChange={(v) => setSel((c) => ({ ...c, color: v }))}
                  disabled={generating}
                  size="small"
                />
              </div>
            </div>
          </div>

          {/* Horoscope */}
          <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/20 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              🔮 Horoscope influence
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="mb-1 text-[11px] text-slate-400">Date of birth (optional)</p>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  max={todayStr}
                  disabled={generating}
                  className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-400 focus:outline-none disabled:opacity-60"
                />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-bold text-violet-700 ring-1 ring-violet-200">
                {effectiveZodiac.emoji} {effectiveZodiac.sign}
              </span>
            </div>
            <p className="mt-2 rounded-xl bg-violet-100/60 px-3 py-2 text-xs italic text-violet-700">
              ✨ {dob
                ? `We'll blend in a touch of ${effectiveZodiac.sign} energy, based on your birthday.`
                : `We'll blend in this season's ${effectiveZodiac.sign} energy — add your birthday above to use your own sign instead.`}
            </p>
          </div>

          {/* CTA area */}
          <div className="mt-4">
            {!isLoggedIn && <MobileOtpAuth attemptsLimit={FREE_ATTEMPTS_LIMIT} />}

            {isLoggedIn && !hasAttempts && (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" disabled className="cursor-not-allowed rounded-xl bg-slate-200 px-5 py-3 text-sm font-bold text-slate-500">
                  No free attempts left
                </button>
                <ExhaustedBanner />
              </div>
            )}

            {isLoggedIn && hasAttempts && (
              <div className="flex flex-wrap items-center gap-3">
                <motion.button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  whileTap={canGenerate ? { scale: 0.98 } : {}}
                  className={`rounded-xl px-5 py-3 text-sm font-bold text-white transition ${
                    canGenerate
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 shadow-md shadow-violet-200 hover:from-violet-700 hover:to-purple-700"
                      : "cursor-not-allowed bg-slate-300"
                  }`}
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z" />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    "✨ Generate Cake Ideas"
                  )}
                </motion.button>

                <AttemptsBadge attemptsLeft={attemptsLeft} />
              </div>
            )}

            {generationError && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-red-700">Generation failed</p>
                <p className="mt-1 text-xs text-red-600">{generationError}</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Results panel (below form) ── */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {!generating && designs.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyCreationsPanel />
              </motion.div>
            ) : null}

            {generating && designs.length === 0 ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CakeBuildingAnimation />
              </motion.div>
            ) : null}

            {designs.length > 0 ? (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

                {/* CrossFriend occasion message */}
                <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">
                    💜 A note from CrossFriend
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600 italic">{cfMessage}</p>
                </div>

                {/* Horoscope quote — only present when the real backend generated one */}
                {horoscopeQuote && (
                  <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">
                      🔮 Your {effectiveZodiac.sign} Year
                    </p>
                    <p className="text-xs leading-relaxed text-slate-600 italic">{horoscopeQuote}</p>
                  </div>
                )}

                {/* Design cards — horizontal grid */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {designs.map((design, index) => (
                    <div key={design.id}>
                      {/* Not a <button> — DesignCard renders its own "view full
                          size" button internally, and a button can't nest
                          inside another button (invalid HTML, breaks click/
                          focus behavior). role="button" + onKeyDown keeps it
                          keyboard-accessible without the nesting. */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectDesign(design.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleSelectDesign(design.id)
                          }
                        }}
                        className="block w-full cursor-pointer rounded-xl text-left"
                      >
                        <DesignCard
                          design={design}
                          selected={selectedDesignId === design.id}
                          onExpand={(e) => handleExpandDesign(index, e)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAcceptDesign(design.id)}
                        className="mt-2 w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                      >
                        ✅ Use This Design
                      </button>
                      <PromptReveal prompt={design.compiledPrompt} compact />
                    </div>
                  ))}

                  {/* Regenerating — keep existing cards visible, show the
                      new one arriving in the next slot instead of blanking
                      the whole grid. */}
                  {generating && <CakeBuildingAnimation compact />}
                </div>

                {/* Action panel */}
                <AnimatePresence>
                  {showUsePanel && selectedDesignId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 rounded-2xl border border-violet-200 bg-white p-4">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          ✅ Great choice! What next?
                        </p>

                        <button
                          type="button"
                          onClick={() => selectedDesignId && handleAcceptDesign(selectedDesignId)}
                          className="flex w-full items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition hover:bg-emerald-100"
                        >
                          <span className="mt-0.5 text-base">💰</span>
                          <div>
                            <p className="text-sm font-semibold text-emerald-800">Get a price for this cake</p>
                            <p className="text-xs text-slate-500">Choose weight, add a message, pick add-ons and see an indicative price</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => document.getElementById("baker-section")?.scrollIntoView({ behavior: "smooth" })}
                          className="flex w-full items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-left transition hover:bg-violet-100"
                        >
                          <span className="mt-0.5 text-base">📍</span>
                          <div>
                            <p className="text-sm font-semibold text-violet-800">Find a baker near me</p>
                            <p className="text-xs text-slate-500">Connect with a verified local baker to make this exact cake</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const d = designs.find((x) => x.id === selectedDesignId)
                            if (d) handleShare(d)
                          }}
                          className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                        >
                          <span className="mt-0.5 text-base">📤</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Share this design</p>
                            <p className="text-xs text-slate-500">WhatsApp · copy link · or any app on your device</p>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Price Estimator */}
        <div data-price-estimator="" className="mt-6">
          <PriceEstimator
          cakeStyle={sel.style}
          occasion={sel.occasion}
          generated={generated || designs.length > 0}
          initialTiers={sel.tiers}
          initialFlavor={sel.flavor}
          initialShape={sel.shape}
          initialCakeMessage={sel.cakeMessage}
          openSignal={priceEstimatorOpenSignal}
          />
        </div>

        {/* Baker Finder */}
        <div id="baker-section" className="mt-4">
          <BakerFinder generated={generated} />
        </div>
      </div>

      {/* Share sheet */}
      <AnimatePresence>
        {showShareSheet && selectedDesignId && (() => {
          const design = designs.find((x) => x.id === selectedDesignId)
          const url = typeof window !== "undefined" ? window.location.href : ""
          const text =
            `🎂 Check out this "${design?.title ?? "cake design"}" I created on CrossFriend!\n\n` +
            `✨ ${sel.occasion} · ${sel.style} style\n` +
            `🎉 Generate your own → ${url}`
          const waHref = `https://wa.me/?text=${encodeURIComponent(text)}`
          return (
            <motion.div
              key="share-sheet"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
              onClick={() => setShowShareSheet(false)}
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
              >
                <p className="mb-1 text-base font-bold text-slate-900">Share this design</p>
                <p className="mb-4 text-xs text-slate-500">Share with family, friends or your baker</p>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 flex w-full items-center gap-3 rounded-2xl bg-green-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-600"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Share on WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(url).catch(() => {})
                    setShowShareSheet(false)
                  }}
                  className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <span className="text-base">🔗</span>
                  Copy link
                </button>

                <button
                  type="button"
                  onClick={() => setShowShareSheet(false)}
                  className="w-full rounded-2xl py-2 text-sm text-slate-400 transition hover:text-slate-600"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Design Lightbox */}
      <DesignLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        designs={designs}
        startIndex={lightboxIndex}
        isLoggedIn={isLoggedIn}
      />
    </section>
  )
}
