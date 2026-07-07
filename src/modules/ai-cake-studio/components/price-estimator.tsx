"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import type { Addon, EstimatorSelections, StudioConfig } from "../types"

// ─── Fallback config (mirrors ai-cake-studio-config.json) ───────────────────

const FALLBACK_CONFIG: Pick<StudioConfig, "pricing" | "selectors" | "addons"> = {
  pricing: {
    basePrice: 800,
    currency: "₹",
    factors: {
      weight:          { "0.5": 0, "1": 0, "1.5": 200, "2": 400, "2.5": 650, "3": 900, "4": 1400, "5": 2000 },
      tiers:           { "1": 0, "2": 600, "3": 1400, "4": 2400 },
      shape:           { Round: 0, Square: 150, Heart: 250, Oval: 200, Custom: 500 },
      style:           { Realistic: 0, Cartoon: 200, Luxury: 800, Minimal: 0, "3D Sculpted": 1200, Wedding: 600, Kids: 300 },
      flavor:          { Vanilla: 0, Chocolate: 0, "Red Velvet": 100, Strawberry: 100, Butterscotch: 150, "Salted Caramel": 200, Mango: 150, Blueberry: 200, Lemon: 100 },
      eggless:          150,
      expressDelivery:  300,
      midnightDelivery: 200,
      messageOnCake:    0,
      photoOnCake:      250,
    },
  },
  selectors: {
    weights:   [
      { value: "0.5", label: "0.5 kg",  serves: "4–6"   },
      { value: "1",   label: "1 kg",    serves: "8–10"  },
      { value: "1.5", label: "1.5 kg",  serves: "12–15" },
      { value: "2",   label: "2 kg",    serves: "16–20" },
      { value: "2.5", label: "2.5 kg",  serves: "20–25" },
      { value: "3",   label: "3 kg",    serves: "25–30" },
    ],
    tiers:     [
      { value: "1", label: "Single tier" },
      { value: "2", label: "Two tiers"   },
      { value: "3", label: "Three tiers" },
      { value: "4", label: "Four tiers"  },
    ],
    shapes:    [
      { value: "Round",  label: "Round"  },
      { value: "Square", label: "Square" },
      { value: "Heart",  label: "Heart"  },
      { value: "Oval",   label: "Oval"   },
    ],
    flavors:   [
      { value: "Chocolate",      label: "Chocolate"      },
      { value: "Vanilla",        label: "Vanilla"        },
      { value: "Red Velvet",     label: "Red Velvet"     },
      { value: "Strawberry",     label: "Strawberry"     },
      { value: "Butterscotch",   label: "Butterscotch"   },
      { value: "Salted Caramel", label: "Salted Caramel" },
    ],
    styles:    [],
    occasions: [],
  },
  addons: [
    { id: "candles",      label: "Birthday Candles",       description: "Designer number + spiral candles",        price: 120, emoji: "🕯️", suggestFor: ["Birthday", "Kids"]                    },
    { id: "flowers",      label: "Fresh Flower Topper",    description: "Real edible flowers arranged on top",      price: 350, emoji: "🌸", suggestFor: ["Wedding", "Anniversary", "Luxury"]   },
    { id: "gold-dust",    label: "Edible Gold Dust",       description: "Premium shimmer finish over fondant",      price: 250, emoji: "✨", suggestFor: ["Luxury", "Anniversary", "Wedding"]   },
    { id: "photo",        label: "Photo Print on Cake",    description: "Edible image printed and placed on top",   price: 250, emoji: "📸", suggestFor: ["Birthday", "Anniversary", "Special"] },
    { id: "balloon-arch", label: "Balloon Arch",           description: "Mini balloon arrangement (5 balloons)",    price: 180, emoji: "🎈", suggestFor: ["Birthday", "Kids", "Festival"]       },
    { id: "gift-wrap",    label: "Gift Box Packaging",     description: "Premium branded box with ribbon and card", price: 149, emoji: "🎁", suggestFor: ["Birthday", "Anniversary", "Special"] },
    { id: "sparklers",    label: "Cake Sparklers",         description: "Safe indoor sparklers for dramatic reveal",price: 199, emoji: "🎇", suggestFor: ["Birthday", "Kids", "Festival"]       },
    { id: "topper",       label: "Custom Name Topper",     description: "Acrylic or chocolate name tag",            price: 220, emoji: "🎀", suggestFor: ["Birthday", "Kids", "Anniversary"]    },
    { id: "message-card", label: "Handwritten Message Card",description: "Personalised card with delivery",        price: 79,  emoji: "💌", suggestFor: ["Birthday", "Anniversary", "Special"] },
    { id: "knife-set",    label: "Cake Knife & Server Set",description: "Premium stainless steel with ribbon",     price: 299, emoji: "🍴", suggestFor: ["Wedding", "Anniversary"]             },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick(map: Record<string, number>, key: string): number {
  return map[key] ?? 0
}

function computeTotal(
  sel: EstimatorSelections,
  style: string,
  pricing: StudioConfig["pricing"],
  selectedAddons: string[]
): number {
  const f = pricing.factors
  let total = pricing.basePrice
  total += pick(f.weight, sel.weight)
  total += pick(f.tiers,  sel.tiers)
  total += pick(f.shape,  sel.shape)
  total += pick(f.style,  style)
  total += pick(f.flavor, sel.flavor)
  if (sel.eggless)          total += f.eggless
  if (sel.expressDelivery)  total += f.expressDelivery
  if (sel.midnightDelivery) total += f.midnightDelivery
  return total
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
  options: { value: string; label: string }[]
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
          {o.label}
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

function PriceRow({
  label,
  amount,
  muted,
}: {
  label: string
  amount: number
  muted?: boolean
}) {
  if (amount === 0) return null
  return (
    <div className={`flex items-center justify-between text-xs ${muted ? "text-slate-400" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className="font-semibold">+₹{amount}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PriceEstimatorProps {
  /** Style selected in the AI Studio form (e.g. "Luxury", "Cartoon") */
  cakeStyle: string
  /** Occasion selected in the AI Studio form (e.g. "Birthday") */
  occasion: string
  /** Whether a design has been generated yet */
  generated: boolean
}

export default function PriceEstimator({ cakeStyle, occasion, generated }: PriceEstimatorProps) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<StudioConfig | null>(null)
  const [dbAddons, setDbAddons] = useState<Addon[] | null>(null)

  const [sel, setSel] = useState<EstimatorSelections>({
    weight:          "1",
    tiers:           "1",
    shape:           "Round",
    flavor:          "Chocolate",
    eggless:         false,
    expressDelivery: false,
    midnightDelivery:false,
  })
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())

  // Load config + live add-ons from Medusa on first open
  useEffect(() => {
    if (!open || config) return

    fetch("/api/ai-cake-studio-config")
      .then((r) => r.json())
      .then((data: StudioConfig) => setConfig(data))
      .catch(() => setConfig(FALLBACK_CONFIG as StudioConfig))

    fetch("/api/cake-addons")
      .then((r) => r.json())
      .then((data: { addons: Addon[] }) => {
        if (data.addons && data.addons.length > 0) {
          setDbAddons(data.addons)
        }
      })
      .catch(() => { /* silently fall back to config/hardcoded add-ons */ })
  }, [open, config])

  const cfg = config ?? (FALLBACK_CONFIG as StudioConfig)
  const pricing = cfg.pricing
  const selectors = cfg.selectors

  // Use live DB add-ons when available; fall back to JSON config, then hardcoded
  const activeAddons: Addon[] = dbAddons ?? cfg.addons ?? FALLBACK_CONFIG.addons

  // Compute base price
  const baseTotal = useMemo(
    () => computeTotal(sel, cakeStyle, pricing, Array.from(selectedAddons)),
    [sel, cakeStyle, pricing, selectedAddons]
  )

  // Addons: suggested (based on occasion+style) + rest
  const suggested = useMemo(
    () => suggestedAddons(activeAddons, occasion, cakeStyle),
    [activeAddons, occasion, cakeStyle]
  )
  const otherAddons = useMemo(
    () => activeAddons.filter((a) => !suggested.find((s) => s.id === a.id)),
    [activeAddons, suggested]
  )

  // Addon total
  const addonTotal = useMemo(() => {
    return activeAddons
      .filter((a) => selectedAddons.has(a.id))
      .reduce((sum, a) => sum + a.price, 0)
  }, [activeAddons, selectedAddons])

  const grandTotal = baseTotal + addonTotal

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
      {/* ── Header / Toggle ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-base">
            💰
          </span>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">Get a Price Estimate</p>
            <p className="text-xs text-slate-500">
              {open
                ? "Customise weight, add-ons and options"
                : `Estimated from ₹${grandTotal.toLocaleString("en-IN")}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!open && (
            <span className="rounded-xl bg-violet-600 px-3 py-1 text-sm font-bold text-white">
              ₹{grandTotal.toLocaleString("en-IN")}
            </span>
          )}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="text-slate-400"
          >
            ▼
          </motion.span>
        </div>
      </button>

      {/* ── Slide-down body ── */}
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

              {/* Weight */}
              <div>
                <SectionLabel>
                  Weight
                  {selectedWeight?.serves ? ` — serves ${selectedWeight.serves}` : ""}
                </SectionLabel>
                <PillGroup
                  options={selectors.weights}
                  value={sel.weight}
                  onChange={(v) => setSel((s) => ({ ...s, weight: v }))}
                />
              </div>

              {/* Tiers + Shape */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <SectionLabel>Tiers</SectionLabel>
                  <PillGroup
                    options={selectors.tiers}
                    value={sel.tiers}
                    onChange={(v) => setSel((s) => ({ ...s, tiers: v }))}
                  />
                </div>
                <div>
                  <SectionLabel>Shape</SectionLabel>
                  <PillGroup
                    options={selectors.shapes}
                    value={sel.shape}
                    onChange={(v) => setSel((s) => ({ ...s, shape: v }))}
                  />
                </div>
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

              {/* Toggles */}
              <div>
                <SectionLabel>Options</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "eggless" as const,          label: "🥚 Eggless",           extra: pricing.factors.eggless          },
                    { key: "expressDelivery" as const,   label: "⚡ Express delivery",   extra: pricing.factors.expressDelivery  },
                    { key: "midnightDelivery" as const,  label: "🌙 Midnight delivery",  extra: pricing.factors.midnightDelivery },
                  ].map(({ key, label, extra }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSel((s) => ({ ...s, [key]: !s[key] }))}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        sel[key]
                          ? "bg-violet-600 text-white"
                          : "border border-violet-200 bg-white text-violet-700 hover:border-violet-400"
                      }`}
                    >
                      {label}
                      {extra > 0 && (
                        <span className={sel[key] ? "ml-1 text-violet-200" : "ml-1 text-violet-400"}>
                          +₹{extra}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Add-ons ── */}
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

              {/* ── Price Breakdown ── */}
              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">
                  Price breakdown
                </p>
                <PriceRow label="Base price"                        amount={pricing.basePrice}  />
                <PriceRow label={`Weight (${sel.weight} kg)`}       amount={pick(pricing.factors.weight, sel.weight)}  />
                <PriceRow label={`${sel.tiers}-tier`}               amount={pick(pricing.factors.tiers, sel.tiers)}   />
                <PriceRow label={`${sel.shape} shape`}              amount={pick(pricing.factors.shape, sel.shape)}   />
                <PriceRow label={`${cakeStyle} style`}              amount={pick(pricing.factors.style, cakeStyle)}   />
                <PriceRow label={`${sel.flavor} flavour`}           amount={pick(pricing.factors.flavor, sel.flavor)} />
                <PriceRow label="Eggless"                           amount={sel.eggless ? pricing.factors.eggless : 0} />
                <PriceRow label="Express delivery"                  amount={sel.expressDelivery ? pricing.factors.expressDelivery : 0} />
                <PriceRow label="Midnight delivery"                 amount={sel.midnightDelivery ? pricing.factors.midnightDelivery : 0} />

                {selectedAddons.size > 0 && (
                  <div className="border-t border-violet-100 pt-2 space-y-1">
                    {activeAddons
                      .filter((a) => selectedAddons.has(a.id))
                      .map((a) => (
                        <PriceRow key={a.id} label={`${a.emoji} ${a.label}`} amount={a.price} />
                      ))}
                  </div>
                )}

                <div className="border-t border-violet-200 pt-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">Estimated total</p>
                  <p className="text-xl font-bold text-violet-700">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400">
                  * Final price is confirmed by the baker. This is an indicative estimate.
                </p>
              </div>

              {/* CTA */}
              <button
                type="button"
                className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-bold text-white shadow-md shadow-violet-200 transition hover:from-violet-700 hover:to-purple-700"
                onClick={() =>
                  document.getElementById("baker-section")?.scrollIntoView({ behavior: "smooth" })
                }
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
