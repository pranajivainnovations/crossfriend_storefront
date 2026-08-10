"use client"

import { useMemo, useState } from "react"

/**
 * Cake weight calculator.
 *
 * Deliberately self-contained: no backend call, no pricing lookup, no product data. It works on a
 * site with an empty catalogue, which is the whole reason it exists — it earns traffic for queries
 * like "how much cake for 25 people" that have nothing to do with our inventory.
 *
 * The numbers below are portion conventions, not measurements from our own orders. They are stated
 * as a range everywhere they are shown, and the page says plainly where they come from. When we
 * have real order data, replace SERVING_STYLES with it and delete this paragraph.
 */

/** Grams of cake per person, by how the cake is being served. */
const SERVING_STYLES = [
  {
    id: "dessert",
    label: "The dessert",
    hint: "Cake is the sweet course. Plated, generous slices.",
    gramsPerPerson: 125,
  },
  {
    id: "party",
    label: "Celebration slice",
    hint: "Cut after the candles, alongside other food. Most birthdays.",
    gramsPerPerson: 75,
  },
  {
    id: "tasting",
    label: "Small piece each",
    hint: "Office floor, large gathering, or dessert is already covered.",
    gramsPerPerson: 50,
  },
] as const

type ServingStyleId = (typeof SERVING_STYLES)[number]["id"]

/**
 * Square and rectangular cakes cut into clean rectangles with no waste; a round cake of the same
 * weight loses servings to curved edge pieces. The convention is roughly 25% more servings from a
 * square, so the same guest count needs correspondingly less weight.
 */
const SHAPES = [
  { id: "round", label: "Round", weightFactor: 1 },
  { id: "square", label: "Square", weightFactor: 0.8 },
] as const

type ShapeId = (typeof SHAPES)[number]["id"]

/** Guests take smaller slices from a tall tiered cake than from a single round. */
const TIER_OPTIONS = [
  { id: 1, label: "1 tier", weightFactor: 1 },
  { id: 2, label: "2 tiers", weightFactor: 0.92 },
  { id: 3, label: "3+ tiers", weightFactor: 0.85 },
] as const

type TierId = (typeof TIER_OPTIONS)[number]["id"]

/** Bakers sell in half-kilo steps, so a recommendation of "1.37 kg" is not orderable. */
function roundToHalfKg(kg: number): number {
  return Math.max(0.5, Math.ceil(kg * 2) / 2)
}

function formatKg(kg: number): string {
  return Number.isInteger(kg) ? `${kg}` : kg.toFixed(1)
}

export default function CakeSizeCalculator() {
  const [guests, setGuests] = useState(20)
  const [styleId, setStyleId] = useState<ServingStyleId>("party")
  const [shapeId, setShapeId] = useState<ShapeId>("round")
  const [tiers, setTiers] = useState<TierId>(1)

  const result = useMemo(() => {
    const style = SERVING_STYLES.find((s) => s.id === styleId)!
    const shape = SHAPES.find((s) => s.id === shapeId)!
    const tier = TIER_OPTIONS.find((t) => t.id === tiers)!

    const safeGuests = Math.min(Math.max(guests || 0, 1), 500)
    const rawKg =
      (safeGuests * style.gramsPerPerson * shape.weightFactor * tier.weightFactor) / 1000

    const recommendedKg = roundToHalfKg(rawKg)

    // What that ordered weight actually delivers, so the number can be sanity-checked rather than
    // taken on trust.
    const servingsAtRecommended = Math.floor(
      (recommendedKg * 1000) / (style.gramsPerPerson * shape.weightFactor * tier.weightFactor)
    )

    return {
      recommendedKg,
      generousKg: roundToHalfKg(rawKg * 1.2),
      servingsAtRecommended,
      gramsPerPerson: style.gramsPerPerson,
      safeGuests,
    }
  }, [guests, styleId, shapeId, tiers])

  const fieldset = "flex flex-col gap-2"
  const legend = "text-sm font-semibold uppercase tracking-wide text-grey-60"
  const chip =
    "rounded-lg border px-4 py-2 text-left text-base transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cf-purple-600"
  const chipOn = "border-cf-purple-300 bg-cf-purple-100 font-semibold text-grey-90"
  const chipOff = "border-cf-purple-100 bg-white text-grey-60 hover:border-cf-purple-300"

  return (
    <div className="grid gap-8 rounded-2xl border border-cf-purple-100 bg-white p-6 small:grid-cols-[1fr_auto] small:gap-12 small:p-8">
      <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
        <div className={fieldset}>
          <label htmlFor="guests" className={legend}>
            How many people
          </label>
          <input
            id="guests"
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-32 rounded-lg border border-cf-purple-100 px-4 py-2 text-2xl font-semibold tabular-nums text-grey-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cf-purple-600"
          />
        </div>

        <fieldset className={fieldset}>
          <legend className={legend}>How is it being served</legend>
          <div className="mt-1 grid gap-2">
            {SERVING_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                aria-pressed={styleId === style.id}
                onClick={() => setStyleId(style.id)}
                className={`${chip} ${styleId === style.id ? chipOn : chipOff}`}
              >
                <span className="block">{style.label}</span>
                <span className="block text-sm font-normal text-grey-60">{style.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-6 small:grid-cols-2">
          <fieldset className={fieldset}>
            <legend className={legend}>Shape</legend>
            <div className="mt-1 flex gap-2">
              {SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  type="button"
                  aria-pressed={shapeId === shape.id}
                  onClick={() => setShapeId(shape.id)}
                  className={`${chip} flex-1 text-center ${shapeId === shape.id ? chipOn : chipOff}`}
                >
                  {shape.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={fieldset}>
            <legend className={legend}>Tiers</legend>
            <div className="mt-1 flex gap-2">
              {TIER_OPTIONS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  aria-pressed={tiers === tier.id}
                  onClick={() => setTiers(tier.id)}
                  className={`${chip} flex-1 text-center ${tiers === tier.id ? chipOn : chipOff}`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </form>

      <output
        aria-live="polite"
        className="flex min-w-[15rem] flex-col justify-center gap-4 rounded-xl bg-cf-purple-100/50 p-6 text-center"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-grey-60">Order about</p>
          <p className="mt-1 text-5xl font-bold tabular-nums text-grey-90">
            {formatKg(result.recommendedKg)}
            <span className="ml-1 text-2xl font-semibold">kg</span>
          </p>
        </div>

        <p className="text-base leading-relaxed text-grey-60">
          Serves roughly{" "}
          <strong className="tabular-nums text-grey-90">{result.servingsAtRecommended}</strong> at{" "}
          <span className="tabular-nums">{result.gramsPerPerson} g</span> per person.
        </p>

        <p className="border-t border-cf-purple-100 pt-4 text-sm leading-relaxed text-grey-60">
          Want leftovers, or unsure of the final headcount? Go to{" "}
          <strong className="tabular-nums text-grey-90">
            {formatKg(result.generousKg)} kg
          </strong>
          .
        </p>
      </output>
    </div>
  )
}
