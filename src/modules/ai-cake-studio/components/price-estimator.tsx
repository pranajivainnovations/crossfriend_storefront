"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import type { Addon } from "../types"
import { estimateAiCakePrice } from "../actions"

// ─── Pricing types (matches new config structure) ────────────────────────────

interface PricingConfig {
  currency: string
  disclaimer: string
  baseByWeight: Record<string, number>
  tierMultiplier: Record<string, number>
  shapeAdjustment: Record<string, number>
  styleAdjustment: Record<string, number>
  flavorAdjustment: Record<string, number>
  options: {
    expressDelivery: number
    midnightDelivery: number
    messageOnCake: number
    photoOnCake: number
  }
}

interface SelectorOption {
  value: string
  label: string
  serves?: string
  emoji?: string
}

interface SelectorsConfig {
  weights: SelectorOption[]
  tiers: SelectorOption[]
  shapes: SelectorOption[]
  flavors: SelectorOption[]
}

interface EstimatorSelections {
  weight: string
  tiers: string
  shape: string
  flavor: string
  expressDelivery: boolean
  midnightDelivery: boolean
  /** Moved here from the generation form — this is the one flow (typed prompt
   * or an already-generated design) where a custom message is entered, since
   * it doesn't require regenerating the image. */
  message: string
}

// ─── Fallback config ─────────────────────────────────────────────────────────

const FALLBACK_PRICING: PricingConfig = {
  currency: "₹",
  disclaimer: "Indicative price only. Final price will be confirmed by your baker.",
  baseByWeight: { "0.5": 500, "1": 900, "1.5": 1350, "2": 1800, "2.5": 2250, "3": 2700, "4": 3600, "5": 4500 },
  tierMultiplier: { "1": 1.0, "2": 1.4, "3": 1.8, "4": 2.3 },
  shapeAdjustment: { Round: 0, Square: 150, Heart: 200, Oval: 150 },
  styleAdjustment: { Realistic: 0, Cartoon: 200, Luxury: 500, Minimal: 0, "3D Sculpted": 600, Wedding: 400, Kids: 200 },
  flavorAdjustment: { Chocolate: 0, Vanilla: 0, "Red Velvet": 100, Strawberry: 100, Butterscotch: 50, "Salted Caramel": 150, Mango: 150, Blueberry: 200, Lemon: 100 },
  options: { expressDelivery: 300, midnightDelivery: 200, messageOnCake: 50, photoOnCake: 150 },
}

const FALLBACK_SELECTORS: SelectorsConfig = {
  weights: [
    { value: "0.5", label: "0.5 kg", serves: "4–6" },
    { value: "1", label: "1 kg", serves: "8–10" },
    { value: "1.5", label: "1.5 kg", serves: "12–15" },
    { value: "2", label: "2 kg", serves: "16–20" },
    { value: "2.5", label: "2.5 kg", serves: "20–25" },
    { value: "3", label: "3 kg", serves: "25–30" },
    { value: "4", label: "4 kg", serves: "30–40" },
    { value: "5", label: "5 kg", serves: "40–50" },
  ],
  tiers: [
    { value: "1", label: "Single tier" },
    { value: "2", label: "Two tiers" },
    { value: "3", label: "Three tiers" },
    { value: "4", label: "Four tiers" },
  ],
  shapes: [
    { value: "Round", label: "Round" },
    { value: "Square", label: "Square" },
    { value: "Heart", label: "Heart" },
    { value: "Oval", label: "Oval" },
  ],
  flavors: [
    { value: "Chocolate", label: "Chocolate", emoji: "🍫" },
    { value: "Vanilla", label: "Vanilla", emoji: "🍦" },
    { value: "Red Velvet", label: "Red Velvet", emoji: "❤️" },
    { value: "Strawberry", label: "Strawberry", emoji: "🍓" },
    { value: "Butterscotch", label: "Butterscotch", emoji: "🧈" },
    { value: "Salted Caramel", label: "Salted Caramel", emoji: "🍮" },
    { value: "Mango", label: "Mango", emoji: "🥭" },
    { value: "Blueberry", label: "Blueberry", emoji: "🫐" },
    { value: "Lemon", label: "Lemon", emoji: "🍋" },
  ],
}

const FALLBACK_ADDONS: Addon[] = [
  { id: "candles", label: "Birthday Candles", description: "Designer number + spiral candles", price: 120, emoji: "🕯️", suggestFor: ["Birthday", "Kids"] },
  { id: "flowers", label: "Fresh Flower Topper", description: "Real edible flowers arranged on top", price: 350, emoji: "🌸", suggestFor: ["Wedding", "Anniversary", "Luxury"] },
  { id: "gold-dust", label: "Edible Gold Dust", description: "Premium shimmer finish over fondant", price: 250, emoji: "✨", suggestFor: ["Luxury", "Anniversary", "Wedding"] },
  { id: "photo", label: "Photo Print on Cake", description: "Edible image printed and placed on top", price: 250, emoji: "📸", suggestFor: ["Birthday", "Anniversary", "Special"] },
  { id: "balloon-arch", label: "Balloon Arch", description: "Mini balloon arrangement (5 balloons)", price: 180, emoji: "🎈", suggestFor: ["Birthday", "Kids", "Festival"] },
  { id: "gift-wrap", label: "Gift Box Packaging", description: "Premium branded box with ribbon and card", price: 149, emoji: "🎁", suggestFor: ["Birthday", "Anniversary", "Special"] },
  { id: "sparklers", label: "Cake Sparklers", description: "Safe indoor sparklers for dramatic reveal", price: 199, emoji: "🎇", suggestFor: ["Birthday", "Kids", "Festival"] },
  { id: "topper", label: "Custom Name Topper", description: "Acrylic or chocolate name tag", price: 220, emoji: "🎀", suggestFor: ["Birthday", "Kids", "Anniversary"] },
  { id: "message-card", label: "Handwritten Message Card", description: "Personalised card with delivery", price: 79, emoji: "💌", suggestFor: ["Birthday", "Anniversary", "Special"] },
  { id: "knife-set", label: "Cake Knife & Server Set", description: "Premium stainless steel with ribbon", price: 299, emoji: "🍴", suggestFor: ["Wedding", "Anniversary"] },
]

// Default weight suggestion based on tiers
const TIER_DEFAULT_WEIGHT: Record<string, string> = {
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
}

// ─── Price calculation ───────────────────────────────────────────────────────

function computePrice(
  sel: EstimatorSelections,
  style: string,
  pricing: PricingConfig
): { total: number; breakdown: { label: string; amount: number }[] } {
  const breakdown: { label: string; amount: number }[] = []

  // Base price from weight
  const base = pricing.baseByWeight[sel.weight] ?? 900
  breakdown.push({ label: `Base (${sel.weight} kg)`, amount: base })

  // Tier multiplier
  const multiplier = pricing.tierMultiplier[sel.tiers] ?? 1.0
  const tierExtra = Math.round(base * (multiplier - 1))
  if (tierExtra > 0) {
    breakdown.push({ label: `${sel.tiers === "1" ? "Single" : sel.tiers + " tier"} (×${multiplier})`, amount: tierExtra })
  }

  // Shape
  const shapeExtra = pricing.shapeAdjustment[sel.shape] ?? 0
  if (shapeExtra > 0) {
    breakdown.push({ label: `${sel.shape} shape`, amount: shapeExtra })
  }

  // Style
  const styleExtra = pricing.styleAdjustment[style] ?? 0
  if (styleExtra > 0) {
    breakdown.push({ label: `${style} style`, amount: styleExtra })
  }

  // Flavor
  const flavorExtra = pricing.flavorAdjustment[sel.flavor] ?? 0
  if (flavorExtra > 0) {
    breakdown.push({ label: `${sel.flavor} flavor`, amount: flavorExtra })
  }

  // Options
  if (sel.expressDelivery) {
    breakdown.push({ label: "Express delivery", amount: pricing.options.expressDelivery })
  }
  if (sel.midnightDelivery) {
    breakdown.push({ label: "Midnight delivery", amount: pricing.options.midnightDelivery })
  }
  if (sel.message.trim().length > 0) {
    breakdown.push({ label: "Message on cake", amount: pricing.options.messageOnCake })
  }

  const total = breakdown.reduce((sum, item) => sum + item.amount, 0)
  return { total, breakdown }
}

function suggestedAddons(allAddons: Addon[], occasion: string, style: string): Addon[] {
  const tags = [occasion, style].map((t) => t.toLowerCase())
  return allAddons.filter((a) =>
    a.suggestFor.some((tag) => tags.includes(tag.toLowerCase()))
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
      {children}
    </p>
  )
}

function PillGroup({
  options,
  value,
  onChange,
}: {
  options: SelectorOption[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            value === o.value
              ? "bg-violet-600 text-white"
              : "border border-violet-200 bg-white text-violet-700 hover:border-violet-400"
          }`}
        >
          {o.emoji && <>{o.emoji} </>}{o.label}
        </button>
      ))}
    </div>
  )
}

function AddonCard({
  addon,
  selected,
  onToggle,
}: {
  addon: Addon
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
        selected
          ? "border-violet-400 bg-violet-50 ring-1 ring-violet-300"
          : "border-slate-200 bg-white hover:border-violet-200"
      }`}
    >
      {addon.thumbnail ? (
        <Image
          src={addon.thumbnail}
          alt={addon.label}
          width={36}
          height={36}
          className="mt-0.5 h-9 w-9 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="mt-0.5 text-xl">{addon.emoji}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-900">{addon.label}</p>
        <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">{addon.description}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs font-bold text-violet-700">+₹{addon.price}</span>
        {selected && (
          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
            Added
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface PriceEstimatorProps {
  cakeStyle: string
  occasion: string
  generated: boolean
  initialTiers?: string
  initialFlavor?: string
  initialShape?: string
  /** The message typed in the generation form, if any — seeded into this
   * panel's own message field the moment a design is accepted (see the
   * openSignal effect below), not synced continuously, so it won't clobber
   * an edit made directly here afterward. */
  initialCakeMessage?: string
  /** Bump this (e.g. n => n + 1) to force the estimator open — used by the
   * "Use This Design" CTA so picking a design opens billing in one click. */
  openSignal?: number
  /** Reports the live weight/tiers/shape/flavor/delivery-option selections up to the parent whenever
   * they change — the parent needs these to hand off to BakerFinder's "Order Now," since this panel
   * owns the only copy of them. Not used for pricing math here; the actual order price is always
   * recomputed authoritatively by the backend at order time, never trusted from this snapshot. */
  onSelectionsChange?: (selections: EstimatorSelections) => void
}

export type { EstimatorSelections }

export default function PriceEstimator({
  cakeStyle,
  occasion,
  generated,
  initialTiers,
  initialFlavor,
  initialShape,
  initialCakeMessage,
  openSignal,
  onSelectionsChange,
}: PriceEstimatorProps) {
  const [open, setOpen] = useState(false)

  const [pricing, setPricing] = useState<PricingConfig>(FALLBACK_PRICING)
  const [selectors, setSelectors] = useState<SelectorsConfig>(FALLBACK_SELECTORS)
  const [dbAddons, setDbAddons] = useState<Addon[] | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false)

  // Initialize selections with values from generation form
  const [sel, setSel] = useState<EstimatorSelections>({
    weight: TIER_DEFAULT_WEIGHT[initialTiers || "1"] || "1",
    tiers: initialTiers || "1",
    shape: initialShape || "Round",
    flavor: initialFlavor || "Chocolate",
    expressDelivery: false,
    midnightDelivery: false,
    message: initialCakeMessage || "",
  })

  // Update selections when initial values change (e.g., user regenerates)
  useEffect(() => {
    setSel((prev) => ({
      ...prev,
      tiers: initialTiers || prev.tiers,
      shape: initialShape || prev.shape,
      flavor: initialFlavor || prev.flavor,
      weight: TIER_DEFAULT_WEIGHT[initialTiers || "1"] || prev.weight,
    }))
  }, [initialTiers, initialFlavor, initialShape])

  // A parent-triggered "open me" signal (e.g. clicking "Use This Design")
  // forces the estimator open AND, at that one moment, carries over whatever
  // message was typed in the generation form — but never fires on initial
  // mount (openSignal starts at 0/undefined), and never fires again just
  // because the generation form's message changed, so it won't clobber an
  // edit made directly in this panel afterward.
  useEffect(() => {
    if (!openSignal) return
    setOpen(true)
    setSel((prev) => ({ ...prev, message: initialCakeMessage || prev.message }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal])

  // Load config + live add-ons on first open
  useEffect(() => {
    if (!open || configLoaded) return

    fetch("/api/ai-cake-studio-config")
      .then((r) => r.json())
      .then((data: any) => {
        if (data.pricing) setPricing(data.pricing)
        if (data.selectors) setSelectors(data.selectors)
        setConfigLoaded(true)
      })
      .catch(() => setConfigLoaded(true))

    fetch("/api/cake-addons")
      .then((r) => r.json())
      .then((data: { addons: Addon[] }) => {
        if (data.addons && data.addons.length > 0) {
          setDbAddons(data.addons)
        }
      })
      .catch(() => {})
  }, [open, configLoaded])

  // Report the live selections up to the parent — BakerFinder's "Order Now" needs them, and this
  // panel is the only place that owns them.
  useEffect(() => {
    onSelectionsChange?.(sel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel])

  // Real backend price — debounced so it doesn't fire the pricing engine on every keystroke/pill
  // click. The instant local `computePrice()` estimate below still renders immediately so the panel
  // never feels laggy; this overwrites it ~500ms after the last change with the true, OPS-configured
  // number (the same one Find Baker will actually charge), so nothing here can drift from the order
  // price the way the old static-config-only estimator could.
  const [realPricing, setRealPricing] = useState<{ total: number; breakdown: { label: string; amount: number }[] } | null>(null)
  const [, startPricingTransition] = useTransition()

  useEffect(() => {
    if (!generated) return
    const timer = setTimeout(() => {
      startPricingTransition(async () => {
        const res = await estimateAiCakePrice({
          weight: sel.weight,
          tiers: sel.tiers,
          shape: sel.shape,
          style: cakeStyle,
          flavor: sel.flavor,
          expressDelivery: sel.expressDelivery,
          midnightDelivery: sel.midnightDelivery,
          messageOnCake: sel.message.trim().length > 0,
        })
        if (!("error" in res)) {
          setRealPricing(res)
        }
        // On error, silently keep showing the local estimate — the existing "Indicative price
        // only" disclaimer already covers this, and Find Baker re-derives the real price anyway.
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [generated, sel.weight, sel.tiers, sel.shape, sel.flavor, sel.expressDelivery, sel.midnightDelivery, sel.message, cakeStyle])

  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())

  const activeAddons: Addon[] = dbAddons ?? FALLBACK_ADDONS

  // Compute price — instant local estimate as a placeholder, real backend number (once loaded) wins.
  const localEstimate = useMemo(
    () => computePrice(sel, cakeStyle, pricing),
    [sel, cakeStyle, pricing]
  )
  const cakeTotal = realPricing?.total ?? localEstimate.total
  const breakdown = realPricing?.breakdown ?? localEstimate.breakdown

  // Addons
  const suggested = useMemo(
    () => suggestedAddons(activeAddons, occasion, cakeStyle),
    [activeAddons, occasion, cakeStyle]
  )
  const otherAddons = useMemo(
    () => activeAddons.filter((a) => !suggested.find((s) => s.id === a.id)),
    [activeAddons, suggested]
  )

  const addonTotal = useMemo(() => {
    return activeAddons
      .filter((a) => selectedAddons.has(a.id))
      .reduce((sum, a) => sum + a.price, 0)
  }, [activeAddons, selectedAddons])

  const grandTotal = cakeTotal + addonTotal

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedWeight = selectors.weights.find((w) => w.value === sel.weight)

  if (!generated) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-4 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm"
    >
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-base">💰</span>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">Price Estimate</p>
            <p className="text-xs text-slate-500">
              {open ? "Adjust options to see price change" : `Starting from ₹${grandTotal.toLocaleString("en-IN")}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!open && (
            <span className="rounded-xl bg-violet-600 px-3 py-1 text-sm font-bold text-white">
              ₹{grandTotal.toLocaleString("en-IN")}
            </span>
          )}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="text-slate-400">
            ▼
          </motion.span>
        </div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="estimator-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-violet-100 px-5 pb-5 pt-4 space-y-5">

              {/* Live price banner */}
              <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">Estimated Price</p>
                    <p className="mt-0.5 truncate text-[11px] text-violet-200">
                      {sel.weight} kg · {sel.tiers === "1" ? "Single" : sel.tiers + "-tier"} · {sel.shape} · {cakeStyle} · {sel.flavor}
                    </p>
                  </div>
                  <motion.p
                    key={grandTotal}
                    initial={{ scale: 1.18, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                    className="shrink-0 text-3xl font-black"
                  >
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </motion.p>
                </div>
              </div>

              {/* Design selections (from generation — read-only display) */}
              <div className="rounded-xl border border-violet-100 bg-violet-50/30 px-4 py-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">From your design</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-violet-200">
                    {cakeStyle} style
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-violet-200">
                    {sel.tiers === "1" ? "Single tier" : sel.tiers + " tiers"}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-violet-200">
                    {sel.shape}
                  </span>
                </div>
              </div>

              {/* Weight (main pricing lever) */}
              <div>
                <SectionLabel>
                  Weight{selectedWeight?.serves ? ` — serves ${selectedWeight.serves}` : ""}
                </SectionLabel>
                <PillGroup
                  options={selectors.weights}
                  value={sel.weight}
                  onChange={(v) => setSel((s) => ({ ...s, weight: v }))}
                />
              </div>

              {/* Flavor */}
              <div>
                <SectionLabel>Flavour</SectionLabel>
                <PillGroup
                  options={selectors.flavors}
                  value={sel.flavor}
                  onChange={(v) => setSel((s) => ({ ...s, flavor: v }))}
                />
              </div>

              {/* Message on cake — same field for every flow (generate,
                  regenerate, or an already-picked design): it's added at
                  bake time, so it doesn't need to be decided before the
                  design does. */}
              <div>
                <SectionLabel>Message on Cake (optional)</SectionLabel>
                <input
                  type="text"
                  placeholder="e.g. Happy Birthday Priya"
                  value={sel.message}
                  onChange={(e) => setSel((s) => ({ ...s, message: e.target.value.slice(0, 50) }))}
                  className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none"
                />
                <div className="mt-1 flex items-center justify-between">
                  {sel.message.trim().length > 0 ? (
                    <span className="text-[11px] font-semibold text-violet-600">+₹{pricing.options.messageOnCake}</span>
                  ) : <span />}
                  <p className="text-[10px] text-slate-400">{sel.message.length}/50</p>
                </div>
              </div>

              {/* Delivery options */}
              <div>
                <SectionLabel>Delivery Options</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "expressDelivery" as const, label: "⚡ Express (same day)", extra: pricing.options.expressDelivery },
                    { key: "midnightDelivery" as const, label: "🌙 Midnight delivery", extra: pricing.options.midnightDelivery },
                  ].map(({ key, label, extra }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSel((s) => ({ ...s, [key]: !s[key] }))}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        sel[key]
                          ? "bg-violet-600 text-white"
                          : "border border-violet-200 bg-white text-violet-700 hover:border-violet-400"
                      }`}
                    >
                      {label}
                      <span className={sel[key] ? "ml-1 text-violet-200" : "ml-1 text-violet-400"}>
                        +₹{extra}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add-ons: Suggested */}
              {suggested.length > 0 && (
                <div>
                  <SectionLabel>Suggested Add-ons</SectionLabel>
                  <div className="space-y-2">
                    {suggested.map((addon) => (
                      <AddonCard
                        key={addon.id}
                        addon={addon}
                        selected={selectedAddons.has(addon.id)}
                        onToggle={() => toggleAddon(addon.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons: More */}
              {otherAddons.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer list-none">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700">
                      <span className="transition group-open:rotate-90 inline-block">▶</span>
                      More add-ons ({otherAddons.length})
                    </span>
                  </summary>
                  <div className="mt-2 space-y-2">
                    {otherAddons.map((addon) => (
                      <AddonCard
                        key={addon.id}
                        addon={addon}
                        selected={selectedAddons.has(addon.id)}
                        onToggle={() => toggleAddon(addon.id)}
                      />
                    ))}
                  </div>
                </details>
              )}

              {/* Breakdown + Grand Total */}
              <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Breakdown</p>
                <div className="space-y-1.5">
                  {breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-slate-600">
                      <span>{item.label}</span>
                      <span className="font-semibold">₹{item.amount.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  {activeAddons
                    .filter((a) => selectedAddons.has(a.id))
                    .map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-xs text-slate-500">
                        <span>{a.emoji} {a.label}</span>
                        <span>+₹{a.price}</span>
                      </div>
                    ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-violet-200 pt-3">
                  <p className="text-sm font-bold text-slate-900">Estimated Total</p>
                  <motion.p
                    key={grandTotal}
                    initial={{ scale: 1.12, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                    className="text-2xl font-black text-violet-700"
                  >
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </motion.p>
                </div>
                <p className="mt-2 text-[11px] text-slate-400 italic">
                  {pricing.disclaimer}
                </p>
              </div>

              {/* CTA */}
              <button
                type="button"
                className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-bold text-white shadow-md shadow-violet-200 transition hover:from-violet-700 hover:to-purple-700"
                onClick={() => document.getElementById("baker-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                Find a Baker for This Price →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
