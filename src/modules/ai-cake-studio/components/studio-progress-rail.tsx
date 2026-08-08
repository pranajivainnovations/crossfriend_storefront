"use client"

/**
 * The four steps a customer actually walks to order an AI cake.
 *
 * The form used to carry numbered badges 1/2/3 on its *field groups* (Core details / Style / Horoscope),
 * which read as "this is a three step process" when all three sat inside step one of four. Numbering now
 * lives here, on the real sequence, and the form uses plain headings.
 *
 * Purely an indicator — it reports where the customer is, it doesn't navigate. Every step is gated on
 * real state (a design picked, a price locked, a baker chosen), so letting someone jump ahead would only
 * land them on a section that's still inert.
 */

export type StudioStep = "design" | "price" | "baker" | "order"

export const STUDIO_STEPS: { id: StudioStep; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "price", label: "Price" },
  { id: "baker", label: "Baker" },
  { id: "order", label: "Order" },
]

export default function StudioProgressRail({ current }: { current: StudioStep }) {
  const currentIndex = STUDIO_STEPS.findIndex((s) => s.id === current)

  return (
    <nav
      aria-label="Order progress"
      className="sticky top-16 z-30 mb-4 grid grid-cols-4 gap-1 rounded-2xl border border-cf-purple-100 bg-white/95 p-1.5 shadow-sm backdrop-blur"
    >
      {STUDIO_STEPS.map((step, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "upcoming"

        return (
          <div
            key={step.id}
            aria-current={state === "active" ? "step" : undefined}
            className="flex flex-col items-center gap-1 rounded-xl px-1 py-2"
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition ${
                state === "done"
                  ? "bg-emerald-100 text-emerald-700"
                  : state === "active"
                    ? "bg-cf-purple-600 text-white ring-4 ring-cf-purple-100"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.1em] transition ${
                state === "done"
                  ? "text-emerald-700"
                  : state === "active"
                    ? "text-cf-purple-700"
                    : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
            <span className="sr-only">
              {state === "done" ? "completed" : state === "active" ? "current step" : "not started"}
            </span>
          </div>
        )
      })}
    </nav>
  )
}
