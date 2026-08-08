"use client"

/** What the constraints engine says about one selectable value. */
export interface OptionConstraint {
  enabled: boolean
  recommended: boolean
  reason?: string
}

export interface PillOption {
  value: string
  label: string
  emoji?: string
}

/**
 * The studio's one pill control, shared by the design step and the price step.
 *
 * There used to be two of these — one in the generator with no notion of a per-option state, and one
 * in the price estimator that understood constraints. That's why choosing 3 tiers appeared to do
 * nothing to the weight pills: the pills that gate weight during design simply had no way to be
 * disabled. One component, used in both places, means a rule authored in OPS takes effect wherever
 * the attribute is shown.
 *
 * Four states, and colour only ever encodes state:
 *   selected     solid brand purple
 *   recommended  green outline with a star — a nudge, never a restriction
 *   unavailable  dashed, struck through, not clickable, with the rule's own words as the tooltip
 *   default      quiet outline
 *
 * A disabled option stays visible rather than disappearing. Removing it would leave the customer
 * wondering where the 1 kg went; showing it struck through with a reason answers that before they ask.
 * The currently-selected value is never disabled in place — that surfaces as a violation message
 * instead, so the control can't end up with nothing chosen.
 */
export default function StudioOptionPills({
  options,
  value,
  onChange,
  constraints,
  disabled,
  size = "normal",
  ariaLabel,
}: {
  options: PillOption[]
  value: string
  onChange: (v: string) => void
  /** value token -> its validity, from the constraints engine. Omit for unconstrained attributes. */
  constraints?: Map<string, OptionConstraint>
  /** Disables the whole group (e.g. while generating). */
  disabled?: boolean
  size?: "normal" | "small"
  ariaLabel?: string
}) {
  const sizing =
    size === "small" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const state = constraints?.get(opt.value)
        const isSelected = value === opt.value
        const blocked = state ? !state.enabled && !isSelected : false
        const recommended = state?.recommended ?? false
        const isDisabled = Boolean(disabled) || blocked

        return (
          <button
            key={opt.value}
            type="button"
            disabled={isDisabled}
            aria-pressed={isSelected}
            title={blocked ? state?.reason : recommended ? state?.reason : undefined}
            onClick={() => !isDisabled && onChange(opt.value)}
            className={`rounded-full font-semibold transition ${sizing} ${
              blocked
                ? "cursor-not-allowed border border-dashed border-slate-300 bg-slate-100 text-slate-400 line-through"
                : isSelected
                  ? "border border-cf-purple-600 bg-cf-purple-600 text-white shadow-sm"
                  : recommended
                    ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                    : "border border-cf-purple-200 bg-white text-cf-purple-700 hover:border-cf-purple-400"
            } ${disabled && !blocked ? "opacity-60" : ""}`}
          >
            {opt.emoji && <>{opt.emoji} </>}
            {opt.label}
            {recommended && !isSelected && !blocked && (
              <span className="ml-1 text-[10px]" aria-hidden="true">★</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
