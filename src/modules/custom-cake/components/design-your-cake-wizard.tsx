"use client"

import { useEffect, useMemo, useState } from "react"

type BuilderOption = {
  value: string
  label: string
}

type SavedDesign = {
  id: string
  title: string
  subtitle: string
  accent: string
  tags: string[]
}

type DesignState = {
  occasion: string
  age: string
  birthDate: string
  guestCount: string
  tiers: string
  weight: string
  shape: string
  flavor: string
  theme: string
  decoration: string
  cakeText: string
  nameOnCake: string
  notes: string
  reference: string
}

type BuilderConfig = {
  defaultValues: DesignState
  options: {
    occasions: BuilderOption[]
    shapes: BuilderOption[]
    flavors: BuilderOption[]
    themes: BuilderOption[]
    tiers: BuilderOption[]
    weights: BuilderOption[]
  }
  savedDesigns: SavedDesign[]
}

const FALLBACK_CONFIG: BuilderConfig = {
  defaultValues: {
    occasion: "Birthday",
    age: "",
    birthDate: "",
    guestCount: "20",
    tiers: "2",
    weight: "2.5",
    shape: "Round",
    flavor: "Chocolate",
    theme: "Floral",
    decoration: "Fresh flowers and gold dust",
    cakeText: "Happy Birthday",
    nameOnCake: "",
    notes: "Add a clean, modern design with soft pastel highlights.",
    reference: "Pastel garden, luxe shimmer, and subtle frosting textures.",
  },
  options: {
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
      { value: "Heart", label: "Heart" },
      { value: "Oval", label: "Oval" },
    ],
    flavors: [
      { value: "Chocolate", label: "Chocolate" },
      { value: "Vanilla", label: "Vanilla" },
      { value: "Red Velvet", label: "Red Velvet" },
      { value: "Strawberry", label: "Strawberry" },
      { value: "Butterscotch", label: "Butterscotch" },
      { value: "Salted Caramel", label: "Salted Caramel" },
    ],
    themes: [
      { value: "Floral", label: "Floral" },
      { value: "Superhero", label: "Superhero" },
      { value: "Princess", label: "Princess" },
      { value: "Minimal", label: "Minimal" },
      { value: "Rustic", label: "Rustic" },
      { value: "Modern Luxe", label: "Modern Luxe" },
      { value: "Botanical", label: "Botanical" },
    ],
    tiers: [
      { value: "1", label: "Single tier" },
      { value: "2", label: "Two tiers" },
      { value: "3", label: "Three tiers" },
      { value: "4", label: "Four tiers" },
    ],
    weights: [
      { value: "1", label: "1 kg" },
      { value: "1.5", label: "1.5 kg" },
      { value: "2", label: "2 kg" },
      { value: "2.5", label: "2.5 kg" },
      { value: "3", label: "3 kg" },
    ],
  },
  savedDesigns: [
    {
      id: "signature-1",
      title: "Celestial Bloom",
      subtitle: "A futuristic pastel cake with gold dust and floral geometry",
      accent: "from-cf-pink to-cf-purple",
      tags: ["Birthday", "Premium", "Modern"],
    },
    {
      id: "signature-2",
      title: "Velvet Midnight",
      subtitle: "Deep tones with jewel accents and elegant script text",
      accent: "from-cf-purple to-cf-coral",
      tags: ["Anniversary", "Luxury", "Minimal"],
    },
    {
      id: "signature-3",
      title: "Dreamscape Play",
      subtitle: "A celebratory cake with playful colors and bold details",
      accent: "from-cf-orange to-cf-yellow",
      tags: ["Kids", "Fun", "Vibrant"],
    },
  ],
}

const STEPS = [
  { id: 1, label: "Celebration details" },
  { id: 2, label: "Cake specifications" },
  { id: 3, label: "Design preferences" },
  { id: 4, label: "Review & generate" },
]

export default function DesignYourCakeWizard() {
  const [config, setConfig] = useState<BuilderConfig | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [step, setStep] = useState(1)
  const [values, setValues] = useState<DesignState>(FALLBACK_CONFIG.defaultValues)
  const [generated, setGenerated] = useState(false)
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/custom-cake-builder-config")
        if (!res.ok) {
          throw new Error("Failed to load config")
        }
        const data = (await res.json()) as BuilderConfig
        setConfig(data)
        if (!configLoaded) {
          setValues(data.defaultValues)
          setConfigLoaded(true)
        }
      } catch (err) {
        console.error(err)
        setError("Could not load builder options. Using defaults.")
      }
    }

    loadConfig()
  }, [configLoaded])

  const options = config?.options ?? FALLBACK_CONFIG.options
  const savedDesigns = config?.savedDesigns ?? FALLBACK_CONFIG.savedDesigns

  const isComplete = useMemo(() => {
    return (
      values.occasion.trim().length > 0 &&
      values.guestCount.trim().length > 0 &&
      values.tiers.trim().length > 0 &&
      values.shape.trim().length > 0 &&
      values.flavor.trim().length > 0
    )
  }, [values])

  const summary = useMemo(() => {
    return [
      values.occasion,
      values.age ? `${values.age} years old` : "",
      `${values.tiers}-tier ${values.shape.toLowerCase()} cake`,
      values.flavor,
      values.theme,
    ]
      .filter(Boolean)
      .join(" • ")
  }, [values])

  const handleChange = (key: keyof DesignState, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const handleGenerate = () => {
    if (!isComplete) {
      setStep(1)
      return
    }
    setGenerated(true)
    setSelectedDesign(null)
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <section className="space-y-6">
            {error ? (
              <div className="rounded-3xl border border-cf-orange/20 bg-cf-orange/5 p-4 text-sm text-cf-orange">
                {error}
              </div>
            ) : null}

            <div className="space-y-5 rounded-[28px] border border-ui-border-base bg-slate-950/80 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
                Occasion
              </p>
              <div className="flex flex-wrap gap-3">
                {options.occasions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange("occasion", option.value)}
                    className={
                      `rounded-3xl px-4 py-2 text-sm font-medium transition ` +
                      (values.occasion === option.value
                        ? "bg-cf-purple text-white shadow-sm"
                        : "bg-white text-slate-950 ring-1 ring-ui-border-base hover:bg-slate-100")
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                Age
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 5"
                  value={values.age}
                  onChange={(event) => handleChange("age", event.target.value)}
                  className="w-full rounded-3xl border border-ui-border-base bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cf-orange focus:outline-none focus:ring-2 focus:ring-cf-orange/20"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Guest count
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 20"
                  value={values.guestCount}
                  onChange={(event) => handleChange("guestCount", event.target.value)}
                  className="w-full rounded-3xl border border-ui-border-base bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cf-orange focus:outline-none focus:ring-2 focus:ring-cf-orange/20"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm text-slate-300">
              Birth date
              <input
                type="date"
                value={values.birthDate}
                onChange={(event) => handleChange("birthDate", event.target.value)}
                className="w-full rounded-3xl border border-ui-border-base bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-cf-orange focus:outline-none focus:ring-2 focus:ring-cf-orange/20"
              />
            </label>
          </section>
        )

      case 2:
        return (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-ui-border-base bg-slate-950/80 p-6">
                <p className="text-sm font-semibold text-slate-300">Number of tiers</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {options.tiers.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange("tiers", option.value)}
                      className={
                        `rounded-3xl px-4 py-2 text-sm font-medium transition ` +
                        (values.tiers === option.value
                          ? "bg-cf-purple text-white shadow-sm"
                          : "bg-white text-slate-950 ring-1 ring-ui-border-base hover:bg-slate-100")
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-ui-border-base bg-slate-950/80 p-6">
                <p className="text-sm font-semibold text-slate-300">Weight</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {options.weights.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange("weight", option.value)}
                      className={
                        `rounded-3xl px-4 py-2 text-sm font-medium transition ` +
                        (values.weight === option.value
                          ? "bg-cf-orange text-white shadow-sm"
                          : "bg-white text-slate-950 ring-1 ring-ui-border-base hover:bg-slate-100")
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-ui-border-base bg-slate-950/80 p-6">
                <p className="text-sm font-semibold text-slate-300">Shape</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {options.shapes.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange("shape", option.value)}
                      className={
                        `rounded-3xl px-4 py-2 text-sm font-medium transition ` +
                        (values.shape === option.value
                          ? "bg-cf-pink text-white shadow-sm"
                          : "bg-white text-slate-950 ring-1 ring-ui-border-base hover:bg-slate-100")
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-ui-border-base bg-slate-950/80 p-6">
                <p className="text-sm font-semibold text-slate-300">Flavor</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {options.flavors.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange("flavor", option.value)}
                      className={
                        `rounded-3xl px-4 py-2 text-sm font-medium transition ` +
                        (values.flavor === option.value
                          ? "bg-cf-coral text-white shadow-sm"
                          : "bg-white text-slate-950 ring-1 ring-ui-border-base hover:bg-slate-100")
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )

      case 3:
        return (
          <section className="space-y-6">
            <div className="rounded-[28px] border border-ui-border-base bg-slate-950/80 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
                Theme
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {options.themes.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange("theme", option.value)}
                    className={
                      `rounded-3xl px-4 py-2 text-sm font-medium transition ` +
                      (values.theme === option.value
                        ? "bg-cf-purple text-white shadow-sm"
                        : "bg-white text-slate-950 ring-1 ring-ui-border-base hover:bg-slate-100")
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                Decoration style
                <input
                  type="text"
                  placeholder="e.g. pearls, ruffles, floral swirls"
                  value={values.decoration}
                  onChange={(event) => handleChange("decoration", event.target.value)}
                  className="w-full rounded-3xl border border-ui-border-base bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cf-orange focus:outline-none focus:ring-2 focus:ring-cf-orange/20"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Cake text
                <input
                  type="text"
                  placeholder="e.g. Happy Birthday Priya"
                  value={values.cakeText}
                  onChange={(event) => handleChange("cakeText", event.target.value)}
                  className="w-full rounded-3xl border border-ui-border-base bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cf-orange focus:outline-none focus:ring-2 focus:ring-cf-orange/20"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                Name on cake
                <input
                  type="text"
                  placeholder="e.g. Aarav"
                  value={values.nameOnCake}
                  onChange={(event) => handleChange("nameOnCake", event.target.value)}
                  className="w-full rounded-3xl border border-ui-border-base bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cf-orange focus:outline-none focus:ring-2 focus:ring-cf-orange/20"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Reference ideas
                <input
                  type="text"
                  placeholder="e.g. marble finish, metallic accents, garden cake"
                  value={values.reference}
                  onChange={(event) => handleChange("reference", event.target.value)}
                  className="w-full rounded-3xl border border-ui-border-base bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cf-orange focus:outline-none focus:ring-2 focus:ring-cf-orange/20"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm text-slate-300">
              Inspiration or notes
              <textarea
                value={values.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
                rows={4}
                placeholder="Describe the mood, colors, or theme for the design."
                className="w-full rounded-3xl border border-ui-border-base bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cf-orange focus:outline-none focus:ring-2 focus:ring-cf-orange/20"
              />
            </label>
          </section>
        )

      default:
        return (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-ui-border-base bg-slate-950/80 p-6">
                <p className="text-sm font-semibold text-slate-300">Quick design summary</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">{summary}</p>
              </div>
              <div className="rounded-[28px] border border-ui-border-base bg-slate-950/80 p-6">
                <p className="text-sm font-semibold text-slate-300">Prompt-ready brief</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  <li>Occasion: {values.occasion}</li>
                  <li>Shape: {values.shape}</li>
                  <li>Theme: {values.theme}</li>
                  <li>Message: {values.cakeText}</li>
                </ul>
              </div>
            </div>
            <div className="rounded-[28px] border border-ui-border-base bg-slate-950/80 p-6">
              <p className="text-sm text-slate-300">
                The generated samples will be built from your occasion, shape, flavor, theme,
                decoration, and reference notes.
              </p>
            </div>
          </section>
        )
    }
  }

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 xl:grid-cols-[1.4fr_0.95fr]">
      <section className="space-y-8">
        <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl">
          <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.85fr] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-cf-orange/80">
                Signature cake builder
              </p>
              <h2 className="mt-3 text-3xl font-heading font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Craft a modern, premium cake design in a few thoughtful steps.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Use curated options and live configuration to generate stunning sample concepts,
                then choose the one you want the bakery to make.
              </p>
            </div>
            <div className="space-y-4 rounded-[32px] border border-cf-orange/15 bg-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cf-pink/80">Why it works</p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li>• Dynamic config-driven selections</li>
                <li>• Modern visual controls for fast choice</li>
                <li>• Sample previews and saved inspirations</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-slate-950/60 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            {STEPS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStep(item.id)}
                className={
                  `rounded-3xl border px-4 py-3 text-left transition-all duration-200 ` +
                  (step === item.id
                    ? "border-cf-orange bg-slate-900 text-white shadow-[0_15px_40px_rgba(251,146,60,0.18)]"
                    : "border-transparent bg-slate-950/80 text-slate-300 hover:border-ui-border-base hover:bg-slate-900")
                }
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Step {item.id}
                </span>
                <span className="mt-2 block text-sm font-medium text-white">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Step {step}</h3>
              <p className="mt-2 text-sm text-slate-300">
                {STEPS.find((item) => item.id === step)?.label}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950/80 px-4 py-2 text-sm text-slate-300">
              {isComplete ? "Ready to generate" : "Complete the essential fields first"}
            </div>
          </div>

          {renderStepContent()}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                disabled={step === 1}
                className="rounded-2xl border border-ui-border-base bg-slate-950/80 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep((current) => Math.min(4, current + 1))}
                disabled={step === 4}
                className="rounded-2xl border border-transparent bg-cf-orange px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-cf-orange/50"
              >
                Next
              </button>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Generate sample designs
            </button>
          </div>
        </div>

        {generated ? (
          <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Generated samples</h3>
                <p className="mt-2 text-sm text-slate-300">
                  Select a sample or regenerate a fresh set of ideas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-2xl border border-transparent bg-cf-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Regenerate
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {savedDesigns.map((design) => (
                <button
                  key={design.id}
                  type="button"
                  onClick={() => setSelectedDesign(design.id)}
                  className={
                    `group flex flex-col justify-between overflow-hidden rounded-[28px] border p-5 text-left transition focus:outline-none ` +
                    (selectedDesign === design.id
                      ? "border-cf-orange bg-cf-orange/10 shadow-[0_15px_40px_rgba(251,146,60,0.12)]"
                      : "border-ui-border-base bg-slate-950/80 hover:border-slate-400")
                  }
                >
                  <div className={`h-40 rounded-3xl bg-gradient-to-br ${design.accent}`} />
                  <div className="mt-5">
                    <h4 className="text-lg font-semibold text-white">{design.title}</h4>
                    <p className="mt-2 text-sm text-slate-300">{design.subtitle}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {design.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <aside className="space-y-6">
        <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white">Saved design inspirations</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            These premium visuals are curated for fast inspiration and easier selection.
          </p>
          <div className="mt-6 space-y-4">
            {SAMPLE_DESIGNS.map((design) => (
              <div key={design.id} className="rounded-[28px] border border-ui-border-base bg-slate-950/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{design.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{design.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDesign(design.id)}
                    className="rounded-full border border-transparent bg-cf-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[36px] border border-white/10 bg-slate-950/75 p-8 shadow-[0_40px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white">Why this page works</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>• Guided steps keep users focused and avoid overwhelm.</li>
            <li>• Config-driven options can be updated without redeploy.</li>
            <li>• Saved samples reduce repeat generation and speed selection.</li>
            <li>• Bakery-ready messages are captured as structured data.</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
