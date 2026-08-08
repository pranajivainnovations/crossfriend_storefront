"use client"

import { AnimatePresence, motion } from "framer-motion"

/**
 * The one visual language every step panel in the studio uses.
 *
 * The panels used to distinguish themselves by hue — violet here, indigo there, fuchsia for horoscope,
 * orange for the baker finder. That encodes nothing: a customer can't learn anything from a colour
 * that just varies. Worse, every panel was a tinted card on a tinted ground, so nothing receded and
 * nothing led.
 *
 * Elevation carries the separation instead, and colour is spent on state:
 *   done   — flat on warm ground, muted, collapsed to a summary line the customer can reopen
 *   active — white, genuinely lifted, brand-purple edge. Only ever one of these at a time
 *   locked — dashed and flat, with a plain reason. Reads as "not yet", where a solid greyed-out
 *            card reads as "something went wrong"
 */

export type StepState = "done" | "active" | "locked"

export default function StudioStepCard({
  state,
  icon,
  title,
  summary,
  lockedReason,
  onReopen,
  children,
}: {
  state: StepState
  /** Emoji or short glyph shown in the badge slot when the step isn't complete. */
  icon: string
  title: string
  /** One-line recap of the choices made, shown only once the step is done. */
  summary?: string
  /** Why this step isn't available yet — shown only when locked. */
  lockedReason?: string
  /** Called when a completed step's header is clicked, to reopen it for editing. */
  onReopen?: () => void
  children: React.ReactNode
}) {
  const shellByState: Record<StepState, string> = {
    done: "border border-cf-purple-100 bg-cf-warm",
    active: "border border-cf-purple-400 bg-white shadow-[0_18px_44px_-18px_rgba(123,47,247,0.45)]",
    locked: "border-[1.5px] border-dashed border-slate-300 bg-transparent",
  }

  const badgeByState: Record<StepState, string> = {
    done: "bg-emerald-100 text-emerald-700",
    active: "bg-cf-purple-600 text-white",
    locked: "bg-slate-100 text-slate-400",
  }

  const reopenable = state === "done" && Boolean(onReopen)

  return (
    <section className={`overflow-hidden rounded-2xl transition ${shellByState[state]}`}>
      <div
        {...(reopenable
          ? {
              role: "button" as const,
              tabIndex: 0,
              onClick: onReopen,
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onReopen?.()
                }
              },
            }
          : {})}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
          reopenable ? "cursor-pointer" : ""
        }`}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${badgeByState[state]}`}
        >
          {state === "done" ? "✓" : icon}
        </span>

        <p
          className={`shrink-0 text-sm font-bold ${
            state === "locked" ? "text-slate-400" : "text-slate-900"
          }`}
        >
          {title}
        </p>

        {state === "done" && summary && (
          <span className="ml-auto min-w-0 truncate text-right text-xs text-slate-500">
            {summary}
          </span>
        )}
        {reopenable && (
          <span className="ml-2 shrink-0 text-xs font-bold text-cf-purple-600">Edit</span>
        )}
      </div>

      {state === "locked" && lockedReason && (
        <p className="px-4 pb-3 text-xs text-slate-400">{lockedReason}</p>
      )}

      <AnimatePresence initial={false}>
        {state === "active" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
