"use client"

import { useState } from "react"
import Link from "next/link"
import { usePincode } from "@lib/context/pincode-context"
import PincodeWaitlistForm from "@modules/common/components/pincode-waitlist-form"

/**
 * What we can do for someone at their pincode — asked on a product page, so asked about a baker.
 *
 * ── Why this stopped being a yes/no ────────────────────────────────────────────────────────────
 * It used to read one boolean and render a green tick with a city and a day count. The boolean came
 * from a hardcoded prefix table, so it said "Bangalore · 2 Days" to a city where no baker has ever
 * been onboarded. Coverage is real now, which means "no" became a common and honest answer — and a
 * bare "no" on a product page is a dead end for a business whose design studio is free everywhere
 * and whose next launch is decided by where people ask from.
 *
 * So there are three endings and never a wall:
 *   deliver      — this baker reaches them; say so, with their own turnaround if we know it
 *   design_only  — we can't deliver, but the studio is free and other bakers may still be able to
 *   unknown      — not a pincode we recognise, so the useful reply is "check the digits"
 *
 * ── Why it takes a baker slug ──────────────────────────────────────────────────────────────────
 * A ready-to-order product is bound to a pincode through its baker, because a baker is. "Does
 * CrossFriend deliver here" and "can the bakery that makes THIS cake reach you" diverge the moment
 * a launched pincode has some bakers but not this one, and only the second question is the one the
 * page is actually asking. Omit the slug and it answers at area level, which is right elsewhere.
 */
type PincodeCheckerProps = {
  variant?: "compact" | "full"
  className?: string
  /** The baker who makes this product. Omit for an area-level answer. */
  bakerSlug?: string
}

function turnaroundLabel(hours: number | null): string | null {
  if (!hours || hours <= 0) return null
  if (hours <= 24) return "Ready within a day"
  const days = Math.round(hours / 24)
  return `Ready in about ${days} day${days === 1 ? "" : "s"}`
}

export default function PincodeChecker({
  variant = "full",
  className = "",
  bakerSlug,
}: PincodeCheckerProps) {
  const { pincode, deliveryInfo, isChecking, error, setPincode, clearPincode } = usePincode()
  const [input, setInput] = useState("")

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    await setPincode(input, bakerSlug)
  }

  const compact = variant === "compact"

  if (pincode && deliveryInfo) {
    const { tier, city, bakerName, bakerCount, turnaroundHours } = deliveryInfo
    const where = city || pincode
    const ready = turnaroundLabel(turnaroundHours)

    const change = (
      <button
        onClick={clearPincode}
        className="text-ui-fg-muted hover:text-cf-orange text-xs underline"
      >
        Change
      </button>
    )

    if (tier === "deliver") {
      return (
        <div className={className}>
          <div className={`flex flex-wrap items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
            <span className="font-medium text-green-700">
              {/* Named when we know it. "Butter Berry delivers to Ghaziabad" is a promise with
                  somebody behind it; "we deliver" is a promise from a company. */}
              ✅ {bakerName ? `${bakerName} delivers to ${where}` : `We deliver to ${where}`}
            </span>
            {ready && (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                {ready}
              </span>
            )}
            {change}
          </div>
        </div>
      )
    }

    if (tier === "unknown") {
      return (
        <div className={className}>
          <div className={`flex flex-wrap items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
            <span className="font-medium text-slate-600">
              We don&rsquo;t recognise {pincode} — worth checking the digits?
            </span>
            {change}
          </div>
        </div>
      )
    }

    /* design_only. Never phrased as "sorry, we don't service your area": the design studio is free
       and works anywhere in India, so there is always something true and useful left to offer. */
    return (
      <div className={className}>
        <div className="rounded-xl border border-cf-purple-200 bg-cf-purple-50/50 px-3 py-2.5">
          <p className={`font-medium text-slate-800 ${compact ? "text-xs" : "text-sm"}`}>
            {bakerName
              ? `${bakerName} doesn't deliver to ${where} yet.`
              : `We don't deliver to ${where} yet.`}
          </p>

          {/* The cross-sell only appears when it leads somewhere real — bakerCount counts bakers
              with something actually published, so this can never point at an empty shelf. */}
          {bakerCount > 0 ? (
            <p className="mt-1 text-xs text-slate-600">
              But {bakerCount} {bakerCount === 1 ? "baker does" : "bakers do"} —{" "}
              <Link
                href="/bakers"
                className="font-semibold text-cf-purple-700 underline underline-offset-2"
              >
                see who
              </Link>
              .
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              Designing is free and works anywhere in India —{" "}
              <Link
                href="/ai-cake-studio"
                className="font-semibold text-cf-purple-700 underline underline-offset-2"
              >
                design a cake
              </Link>{" "}
              and take it to any local baker.
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <PincodeWaitlistForm pincode={pincode} source="product" />
            {change}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <form
        onSubmit={handleCheck}
        className={`flex items-center gap-2 ${compact ? "" : "flex-col items-start gap-2"}`}
      >
        {!compact && (
          <label className="text-sm font-medium text-grey-80">📍 Check delivery for your pincode</label>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter pincode"
            maxLength={6}
            className={`border border-ui-border-base rounded-lg bg-white text-grey-80 placeholder:text-ui-fg-muted focus:outline-none focus:ring-2 focus:ring-cf-orange/40 focus:border-cf-orange transition-colors ${
              compact ? "px-2 py-1 text-xs w-24" : "px-3 py-2 text-sm w-32"
            }`}
          />
          <button
            type="submit"
            disabled={isChecking || input.length !== 6}
            className={`font-medium rounded-lg bg-cf-orange text-white transition-colors hover:bg-cf-orange-dark disabled:opacity-50 ${
              compact ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm"
            }`}
          >
            {isChecking ? "..." : "Check"}
          </button>
        </div>
      </form>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
