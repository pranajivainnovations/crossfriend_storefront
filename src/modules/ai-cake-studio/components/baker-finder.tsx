"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { BakerProfile } from "../types"

// ─── Baker Card ──────────────────────────────────────────────────────────────

function BakerCard({ baker, index }: { baker: BakerProfile; index: number }) {
  const waLink = baker.whatsapp
    ? `https://wa.me/91${baker.whatsapp}?text=${encodeURIComponent(
        `Hi! I found your bakery on CrossFriend and would like to discuss a custom cake order.`
      )}`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, ease: "easeOut" }}
      className="flex items-start gap-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-4"
    >
      {/* Avatar */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
        {baker.avatar}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-slate-900">{baker.name}</p>
          {baker.verified && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
              ✓ Verified
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">{baker.specialty}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span>⭐ {baker.rating} ({baker.reviewCount} reviews)</span>
          <span>📍 {baker.distance}</span>
          <span>⏱ {baker.turnaround}</span>
          <span className="font-semibold text-orange-700">from ₹{baker.minPrice.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="flex shrink-0 flex-col gap-2">
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-green-500 px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-green-600"
          >
            💬 WhatsApp
          </a>
        ) : (
          <button
            type="button"
            className="rounded-xl border border-orange-300 bg-white px-3 py-2 text-xs font-bold text-orange-600 transition hover:bg-orange-50"
          >
            Request<br />Quote
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  generated: boolean
}

export default function BakerFinder({ generated }: Props) {
  const [open, setOpen] = useState(false)
  const [pincode, setPincode] = useState("")
  const [loading, setLoading] = useState(false)
  const [bakers, setBakers] = useState<BakerProfile[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!/^\d{6}$/.test(pincode)) {
      setError("Please enter a valid 6-digit pincode")
      return
    }
    setLoading(true)
    setError(null)
    setBakers(null)
    try {
      const res = await fetch(`/api/bakers?pincode=${pincode}`)
      const data: { bakers?: BakerProfile[]; error?: string } = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch bakers")
      setBakers(data.bakers ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (!generated) return null

  return (
    <motion.div
      id="baker-section"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      className="mt-4 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm"
    >
      {/* ── Header / Toggle ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-base">
            🏪
          </span>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">Find a Baker Near You</p>
            <p className="text-xs text-slate-500">
              {bakers != null
                ? bakers.length > 0
                  ? `${bakers.length} verified baker${bakers.length !== 1 ? "s" : ""} found`
                  : "No bakers in this area yet"
                : "Enter your pincode to discover local bakers"}
            </p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-slate-400"
        >
          ▼
        </motion.span>
      </button>

      {/* ── Slide-down body ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="baker-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-orange-100 px-5 pb-5 pt-4 space-y-4">

              {/* Pincode input */}
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600">
                  🔍 Search bakers by pincode
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 400001"
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      setError(null)
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={loading || pincode.length !== 6}
                    className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
                  >
                    {loading ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z" />
                      </svg>
                    ) : (
                      "Search"
                    )}
                  </button>
                </div>
                {error && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
                )}
              </div>

              {/* Loading skeleton */}
              {loading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-24 animate-pulse rounded-2xl bg-orange-50" />
                  ))}
                </div>
              )}

              {/* Baker cards */}
              {!loading && bakers != null && (
                bakers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-orange-200 py-8 text-center">
                    <p className="text-2xl">🌱</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">No bakers found in this area</p>
                    <p className="mt-1 text-xs text-slate-500">We&apos;re growing fast — check back soon!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bakers.map((baker, i) => (
                      <BakerCard key={baker.id} baker={baker} index={i} />
                    ))}
                    <p className="text-center text-[11px] text-slate-400">
                      Showing bakers within delivery range · More bakers join CrossFriend every week
                    </p>
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
