"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { GeneratedDesign } from "../types"
import { MOCK_GENERATED_DESIGNS } from "../data/mock-data"

type BuilderOption = {
  value: string
  label: string
}

type BuilderConfig = {
  options: {
    occasions: BuilderOption[]
    shapes: BuilderOption[]
    flavors: BuilderOption[]
    themes: BuilderOption[]
    tiers: BuilderOption[]
    weights: BuilderOption[]
  }
}

type SelectorState = {
  style: string
  occasion: string
  flavor: string
}

const FALLBACK_OPTIONS: BuilderConfig["options"] = {
  occasions: [
    { value: "Birthday", label: "Birthday" },
    { value: "Anniversary", label: "Anniversary" },
    { value: "Festival", label: "Festival" },
    { value: "Kids", label: "Kids" },
    { value: "Special", label: "Special" },
  ],
  shapes: [
    { value: "Round", label: "Round" },
    { value: "Square", label: "Square" },
  ],
  flavors: [
    { value: "Chocolate", label: "Chocolate" },
    { value: "Vanilla", label: "Vanilla" },
    { value: "Red Velvet", label: "Red Velvet" },
  ],
  themes: [
    { value: "Floral", label: "Floral" },
    { value: "Modern Luxe", label: "Modern Luxe" },
    { value: "Minimal", label: "Minimal" },
  ],
  tiers: [
    { value: "1", label: "Single tier" },
    { value: "2", label: "Two tiers" },
  ],
  weights: [
    { value: "1", label: "1 kg" },
    { value: "2", label: "2 kg" },
  ],
}

function EmptyCreationsPanel() {
  return (
    <div className="flex min-h-[310px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 p-6 text-center">
      <span className="text-5xl text-violet-500">🎂</span>
      <p className="text-sm font-semibold text-slate-600">Your generated designs will appear here</p>
    </div>
  )
}

function DesignCard({ design }: { design: GeneratedDesign }) {
  return (
    <div className="overflow-hidden rounded-xl border border-violet-100 bg-white">
      <div className={`h-28 w-full bg-gradient-to-br ${design.gradient}`} />
      <div className="p-3">
        <h4 className="text-sm font-semibold text-slate-900">{design.title}</h4>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{design.description}</p>
      </div>
    </div>
  )
}

export default function AiStudioSection() {
  const [options, setOptions] = useState<BuilderConfig["options"]>(FALLBACK_OPTIONS)
  const [prompt, setPrompt] = useState("")
  const [selectors, setSelectors] = useState<SelectorState>({
    style: "Realistic",
    occasion: FALLBACK_OPTIONS.occasions[0].value,
    flavor: FALLBACK_OPTIONS.flavors[0].value,
  })
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null)
  const [designs] = useState<GeneratedDesign[]>(MOCK_GENERATED_DESIGNS)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/custom-cake-builder-config")
        if (!res.ok) throw new Error("Failed to fetch config")
        const data = (await res.json()) as BuilderConfig
        setOptions(data.options)
        setSelectors((current) => ({
          ...current,
          occasion: data.options.occasions[0]?.value ?? current.occasion,
          flavor: data.options.flavors[0]?.value ?? current.flavor,
        }))
      } catch {
        setOptions(FALLBACK_OPTIONS)
      }
    }

    loadConfig()
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setGenerated(false)
    setSelectedDesignId(null)
    await new Promise((resolve) => setTimeout(resolve, 1800))
    setGenerating(false)
    setGenerated(true)
  }

  return (
    <section id="ai-studio" className="px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[26px] border border-violet-100 bg-white shadow-[0_24px_60px_rgba(109,40,217,0.12)]">
        <div className="grid gap-6 p-5 lg:grid-cols-[1.45fr_0.85fr] lg:p-6">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-3xl font-bold text-slate-900">Create Your Cake with AI</h3>
              <p className="text-xs text-slate-500">Describe, choose style and let AI do the magic ✨</p>
            </div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">Describe your cake idea...</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 320))}
              rows={4}
              placeholder="e.g. A two tier princess cake with pink roses and golden crown"
              className="w-full resize-none rounded-2xl border border-violet-100 bg-violet-50/30 p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Choose a style</p>
                <div className="flex flex-wrap gap-2">
                  {["Realistic", "Cartoon", "Luxury", "Minimal", "3D Sculpted"].map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSelectors((current) => ({ ...current, style }))}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        selectors.style === style
                          ? "bg-violet-600 text-white"
                          : "border border-violet-200 bg-white text-violet-700"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Occasion</p>
                <select
                  value={selectors.occasion}
                  onChange={(e) => setSelectors((current) => ({ ...current, occasion: e.target.value }))}
                  className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-400 focus:outline-none"
                >
                  {options.occasions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Flavor</p>
                <select
                  value={selectors.flavor}
                  onChange={(e) => setSelectors((current) => ({ ...current, flavor: e.target.value }))}
                  className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-400 focus:outline-none"
                >
                  {options.flavors.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <motion.button
                type="button"
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating}
                whileTap={!generating ? { scale: 0.98 } : {}}
                className={`rounded-xl px-5 py-3 text-sm font-bold text-white transition ${
                  prompt.trim() && !generating
                    ? "bg-gradient-to-r from-violet-600 to-purple-600"
                    : "cursor-not-allowed bg-slate-300"
                }`}
              >
                {generating ? "Generating..." : "✨ Generate Cake Ideas"}
              </motion.button>

              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span>100% Unique Designs</span>
                <span>•</span>
                <span>Multiple Variations</span>
                <span>•</span>
                <span>Instant Results</span>
                <span>•</span>
                <span>Save & Share</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-slate-50/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">Your AI Creations</h4>
              <span className="rounded-full bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-700">New</span>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              {generating ? "Generating your concepts..." : generated ? "Select one concept to continue" : "No concepts yet"}
            </p>

            <AnimatePresence mode="wait">
              {!generated && !generating ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EmptyCreationsPanel />
                </motion.div>
              ) : null}

              {generating ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-24 animate-pulse rounded-xl bg-white" />
                  ))}
                </motion.div>
              ) : null}

              {generated && !generating ? (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {designs.map((design) => (
                    <button
                      key={design.id}
                      type="button"
                      onClick={() => setSelectedDesignId(design.id)}
                      className={`block w-full rounded-xl text-left transition ${
                        selectedDesignId === design.id ? "ring-2 ring-violet-400" : ""
                      }`}
                    >
                      <DesignCard design={design} />
                    </button>
                  ))}

                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={!selectedDesignId}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        selectedDesignId
                          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                          : "cursor-not-allowed bg-slate-200 text-slate-500"
                      }`}
                    >
                      {selectedDesignId ? "Use selected design" : "Select a design to continue"}
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
