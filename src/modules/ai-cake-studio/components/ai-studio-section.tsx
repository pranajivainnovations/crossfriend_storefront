"use client"

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

const FREE_ATTEMPTS_LIMIT = 3

// ─── Types ─────────────────────────────────────────────────────────────────

type BuilderOption = { value: string; label: string; emoji?: string }

type StudioSelectors = {
  occasions: BuilderOption[]
  flavors: BuilderOption[]
  styles: BuilderOption[]
}

type SelectorState = {
  style: string
  occasion: string
  flavor: string
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

// ─── Fallback selectors (mirrors ai-cake-studio-config.json) ─────────────

const FALLBACK_SELECTORS: StudioSelectors = {
  occasions: [
    { value: "Birthday", label: "Birthday" },
    { value: "Anniversary", label: "Anniversary" },
    { value: "Wedding", label: "Wedding" },
    { value: "Festival", label: "Festival" },
    { value: "Kids", label: "Kids Party" },
    { value: "Special", label: "Special" },
  ],
  flavors: [
    { value: "Chocolate", label: "Chocolate" },
    { value: "Vanilla", label: "Vanilla" },
    { value: "Red Velvet", label: "Red Velvet" },
    { value: "Strawberry", label: "Strawberry" },
    { value: "Butterscotch", label: "Butterscotch" },
    { value: "Salted Caramel", label: "Salted Caramel" },
    { value: "Mango", label: "Mango" },
    { value: "Blueberry", label: "Blueberry" },
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
}

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

function DesignCard({ design, selected }: { design: GeneratedDesign; selected: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white transition ${
        selected ? "border-violet-400 ring-2 ring-violet-300 shadow-sm" : "border-violet-100"
      }`}
    >
      <div className={`h-28 w-full bg-gradient-to-br ${design.gradient}`} />
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

// ─── Main component ────────────────────────────────────────────────────────

export default function AiStudioSection({ customer }: Props) {
  const isLoggedIn = Boolean(customer)

  const [selectors, setSelectors] = useState<StudioSelectors>(FALLBACK_SELECTORS)
  const [prompt, setPrompt] = useState("")
  const [sel, setSel] = useState<SelectorState>({
    style: FALLBACK_SELECTORS.styles[0].value,
    occasion: FALLBACK_SELECTORS.occasions[0].value,
    flavor: FALLBACK_SELECTORS.flavors[0].value,
  })

  // DOB + horoscope
  const [dob, setDob] = useState("")
  const [zodiacInfluence, setZodiacInfluence] = useState(false)
  const zodiac = useMemo(() => getZodiac(dob), [dob])
  // Computed once on client to avoid SSR/client hydration mismatch
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], [])

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null)
  const [showUsePanel, setShowUsePanel] = useState(false)
  const [designs] = useState<GeneratedDesign[]>(MOCK_GENERATED_DESIGNS)
  const [attemptsLeft, setAttemptsLeft] = useState(isLoggedIn ? FREE_ATTEMPTS_LIMIT : 0)

  const hasAttempts = attemptsLeft > 0
  const canGenerate = isLoggedIn && hasAttempts && prompt.trim().length > 0 && !generating
  const cfMessage = CF_OCCASION_MESSAGES[sel.occasion] ?? CF_OCCASION_MESSAGES["Special"]

  // Load selectors from AI cake studio config (not the custom-cake-builder config)
  useEffect(() => {
    fetch("/api/ai-cake-studio-config")
      .then((r) => r.json())
      .then((data: { selectors?: StudioSelectors }) => {
        if (!data.selectors) return
        setSelectors(data.selectors)
        setSel({
          style: data.selectors.styles?.[0]?.value ?? FALLBACK_SELECTORS.styles[0].value,
          occasion: data.selectors.occasions?.[0]?.value ?? FALLBACK_SELECTORS.occasions[0].value,
          flavor: data.selectors.flavors?.[0]?.value ?? FALLBACK_SELECTORS.flavors[0].value,
        })
      })
      .catch(() => {}) // keep fallback silently
  }, [])

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    setGenerated(false)
    setSelectedDesignId(null)
    setShowUsePanel(false)
    await new Promise((resolve) => setTimeout(resolve, 1800))
    setGenerating(false)
    setGenerated(true)
    setAttemptsLeft((prev) => Math.max(0, prev - 1))
  }

  const handleSelectDesign = (id: string) => {
    setSelectedDesignId(id)
    setShowUsePanel(true)
  }

  return (
    <section id="ai-studio" className="px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[26px] border border-violet-100 bg-white shadow-[0_24px_60px_rgba(109,40,217,0.12)]">
        <div className="grid gap-6 p-5 lg:grid-cols-[1.45fr_0.85fr] lg:p-6">

          {/* ── Left panel: inputs ── */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-3xl font-bold text-slate-900">Create Your Cake with AI</h3>
              <p className="text-xs text-slate-500">Describe, choose style and let AI do the magic ✨</p>
            </div>

            {/* Prompt textarea */}
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Describe your cake idea...
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 320))}
              rows={4}
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

            {/* Style / Occasion / Flavor */}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Style</p>
                <div className="flex flex-wrap gap-2">
                  {selectors.styles.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      disabled={generating}
                      onClick={() => setSel((c) => ({ ...c, style: s.value }))}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                        sel.style === s.value
                          ? "bg-violet-600 text-white"
                          : "border border-violet-200 bg-white text-violet-700 hover:border-violet-400"
                      }`}
                    >
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Occasion</p>
                <select
                  value={sel.occasion}
                  disabled={generating}
                  onChange={(e) => setSel((c) => ({ ...c, occasion: e.target.value }))}
                  className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-400 focus:outline-none disabled:opacity-60"
                >
                  {selectors.occasions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Flavor</p>
                <select
                  value={sel.flavor}
                  disabled={generating}
                  onChange={(e) => setSel((c) => ({ ...c, flavor: e.target.value }))}
                  className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-400 focus:outline-none disabled:opacity-60"
                >
                  {selectors.flavors.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* DOB + Horoscope */}
            <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/30 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                🔮 Horoscope influence (optional)
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="mb-1 text-[11px] text-slate-400">Date of birth</p>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => { setDob(e.target.value); setZodiacInfluence(false) }}
                    max={todayStr}
                    className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-400 focus:outline-none"
                  />
                </div>
                {zodiac && (
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-bold text-violet-700 ring-1 ring-violet-200">
                      {zodiac.emoji} {zodiac.sign}
                    </span>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={zodiacInfluence}
                        onChange={(e) => setZodiacInfluence(e.target.checked)}
                        className="h-3.5 w-3.5 accent-violet-600"
                      />
                      Add {zodiac.sign} influence to design
                    </label>
                  </div>
                )}
              </div>
              {zodiac && zodiacInfluence && (
                <p className="mt-2 rounded-xl bg-violet-100/60 px-3 py-2 text-xs italic text-violet-700">
                  ✨ {zodiac.suggestion}
                </p>
              )}
              {!dob && (
                <p className="mt-2 text-[11px] text-slate-400">
                  Enter a date of birth to unlock horoscope-inspired design suggestions
                </p>
              )}
            </div>

            {/* CTA area */}
            <div className="mt-4">
              {/* Guest: inline OTP auth — no redirect */}
              {!isLoggedIn && <MobileOtpAuth attemptsLimit={FREE_ATTEMPTS_LIMIT} />}

              {/* Logged-in, no attempts left */}
              {isLoggedIn && !hasAttempts && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-xl bg-slate-200 px-5 py-3 text-sm font-bold text-slate-500"
                  >
                    No free attempts left
                  </button>
                  <ExhaustedBanner />
                </div>
              )}

              {/* Logged-in, has attempts */}
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

                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>100% Unique Designs</span>
                    <span>·</span>
                    <span>Multiple Variations</span>
                    <span>·</span>
                    <span>Instant Results</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel: results ── */}
          <div className="rounded-2xl border border-violet-100 bg-slate-50/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">Your AI Creations</h4>
              {generated ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700">Ready</span>
              ) : (
                <span className="rounded-full bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-700">New</span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!generated && !generating ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EmptyCreationsPanel />
                </motion.div>
              ) : null}

              {generating ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-24 animate-pulse rounded-xl bg-white" />
                  ))}
                </motion.div>
              ) : null}

              {generated && !generating ? (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">

                  {/* CrossFriend occasion message */}
                  <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">
                      💜 A note from CrossFriend
                    </p>
                    <p className="text-xs leading-relaxed text-slate-600 italic">{cfMessage}</p>
                  </div>

                  {/* Design cards */}
                  {designs.map((design) => (
                    <button
                      key={design.id}
                      type="button"
                      onClick={() => handleSelectDesign(design.id)}
                      className="block w-full rounded-xl text-left"
                    >
                      <DesignCard design={design} selected={selectedDesignId === design.id} />
                    </button>
                  ))}

                  {/* "Use selected design" action panel */}
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
                            What would you like to do?
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              document.getElementById("baker-section")?.scrollIntoView({ behavior: "smooth" })
                            }
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
                            onClick={() =>
                              document.querySelector("[data-price-estimator]")?.scrollIntoView({ behavior: "smooth" })
                            }
                            className="flex w-full items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-left transition hover:bg-violet-100"
                          >
                            <span className="mt-0.5 text-base">💰</span>
                            <div>
                              <p className="text-sm font-semibold text-violet-800">See price estimate</p>
                              <p className="text-xs text-slate-500">Customise weight, add-ons and get an indicative price</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard
                                ?.writeText(window.location.href)
                                .catch(() => {})
                            }
                            className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                          >
                            <span className="mt-0.5 text-base">📤</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Share this design</p>
                              <p className="text-xs text-slate-500">Copy link to share with family or your baker</p>
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
        </div>
      </div>

      {/* Price Estimator — slides in after generation */}
      <div data-price-estimator="">
        <PriceEstimator
          cakeStyle={sel.style}
          occasion={sel.occasion}
          generated={generated}
        />
      </div>
    </section>
  )
}
