"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { BakerProfile } from "../types"
import { orderAiCake, type SavedAiCakeProduct } from "../actions"

type OrderKey = "automatch" | string

// ─── Baker Card ──────────────────────────────────────────────────────────────

function BakerCard({
  baker,
  index,
  orderingKey,
  onOrder,
}: {
  baker: BakerProfile
  index: number
  orderingKey: OrderKey | null
  onOrder: (bakerId: string) => void
}) {
  const waLink = baker.whatsapp
    ? `https://wa.me/91${baker.whatsapp}?text=${encodeURIComponent(
        `Hi! I found your bakery on CrossFriend and would like to discuss a custom cake order.`
      )}`
    : null

  const isOrderingThis = orderingKey === baker.id
  const anyOrderInFlight = orderingKey != null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, ease: "easeOut" }}
      className={`flex items-start gap-4 rounded-2xl border p-4 ${
        baker.verified ? "border-orange-100 bg-orange-50/40" : "border-slate-200 bg-slate-50/60"
      }`}
    >
      {/* Avatar */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
        {baker.avatar || "🎂"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-slate-900">{baker.name}</p>
          {baker.verified ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
              ✓ CrossFriend Partner
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium italic text-slate-400">
              Not yet a partner
            </span>
          )}
          {baker.blueTick && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              🔵 Blue Tick
            </span>
          )}
        </div>
        {baker.specialty && <p className="mt-0.5 text-[11px] text-slate-500">{baker.specialty}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
          {baker.rating != null && (
            <span>⭐ {baker.rating}{baker.reviewCount != null ? ` (${baker.reviewCount} reviews)` : ""}</span>
          )}
          {baker.location && <span>📍 {baker.location}</span>}
          {baker.turnaround && <span>⏱ {baker.turnaround}</span>}
          {baker.minPrice != null && (
            <span className="font-semibold text-orange-700">from ₹{baker.minPrice.toLocaleString("en-IN")}</span>
          )}
        </div>
      </div>

      {/* CTA — partners get a direct order button, everyone else only gets Contact */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        {baker.verified ? (
          <button
            type="button"
            onClick={() => onOrder(baker.id)}
            disabled={anyOrderInFlight}
            className="rounded-xl bg-orange-500 px-4 py-2 text-center text-xs font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isOrderingThis ? "Placing order…" : "Order with Them"}
          </button>
        ) : (
          waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-xs font-bold text-slate-700 transition hover:border-slate-300"
            >
              💬 Contact
            </a>
          )
        )}
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  generated: boolean
  /** Set by PriceEstimator once "Save This Cake" succeeds — this panel does nothing until then, and
   * has no way to create or update it itself anymore. */
  savedProduct: SavedAiCakeProduct | null
  /** Confirmed by PriceEstimator before pricing even shows — this panel just uses it, it no longer
   * collects its own pincode. */
  pincode: string | null
}

type ServiceStatus = "enabled" | "coming_soon" | "unknown"

export default function BakerFinder({ generated, savedProduct, pincode }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bakers, setBakers] = useState<BakerProfile[] | null>(null)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null)
  const [matchType, setMatchType] = useState<"exact" | "nearby" | undefined>(undefined)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [orderingKey, setOrderingKey] = useState<OrderKey | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)

  // Bakers load automatically the moment the cake is saved — pincode is already known by then (it was
  // confirmed before pricing even showed), so there's nothing left for the customer to enter here.
  useEffect(() => {
    if (!savedProduct || !pincode) return
    let cancelled = false
    setLoading(true)
    setFetchError(null)

    fetch(`/api/bakers?pincode=${pincode}`)
      .then(async (res) => {
        const data: {
          bakers?: BakerProfile[]
          serviceStatus?: ServiceStatus
          matchType?: "exact" | "nearby"
          error?: string
        } = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Failed to fetch bakers")
        if (cancelled) return
        setBakers(data.bakers ?? [])
        setServiceStatus(data.serviceStatus ?? "enabled")
        setMatchType(data.matchType)
      })
      .catch((e: unknown) => {
        if (!cancelled) setFetchError(e instanceof Error ? e.message : "Something went wrong")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [savedProduct, pincode])

  /**
   * Places the order — `bakerId` null means "Order via CrossFriend" (auto-match, flagged for OPS to
   * assign); a real id means a specific CrossFriend partner. Either way this is just a cart-add now —
   * the product was already created back when the cake was saved, so there's nothing slow left here.
   */
  const handleOrder = async (bakerId: string | null) => {
    if (!savedProduct || orderingKey || !pincode) return
    setOrderError(null)
    setOrderingKey(bakerId ?? "automatch")

    const result = await orderAiCake(savedProduct.variantId, bakerId, pincode)
    // A successful order redirects server-side (never returns here) — only a failure returns a value.
    if (result?.error) {
      setOrderError(result.error)
      setOrderingKey(null)
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
            <p className="text-sm font-bold text-slate-900">Choose How to Order</p>
            <p className="text-xs text-slate-500">
              {!savedProduct
                ? "Save your cake above to unlock this"
                : loading
                  ? "Finding bakers near you…"
                  : bakers != null
                    ? serviceStatus === "coming_soon"
                      ? "Not in this area yet — coming soon"
                      : serviceStatus === "unknown"
                        ? "Pincode not recognized"
                        : bakers.length > 0
                          ? `${bakers.length} baker${bakers.length !== 1 ? "s" : ""} found`
                          : "No bakers in this area yet"
                    : "Preparing your options…"}
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

              {!savedProduct && (
                <div className="rounded-2xl border border-dashed border-orange-200 py-8 text-center">
                  <p className="text-2xl">🔒</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">Save your cake first</p>
                  <p className="mt-1 text-xs text-slate-500">Open the price estimator above and click &quot;Save This Cake&quot; to unlock ordering.</p>
                </div>
              )}

              {savedProduct && loading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-24 animate-pulse rounded-2xl bg-orange-50" />
                  ))}
                </div>
              )}

              {savedProduct && fetchError && (
                <p className="text-xs font-medium text-red-500">{fetchError}</p>
              )}

              {savedProduct && !loading && bakers != null && (
                serviceStatus === "unknown" ? (
                  <div className="rounded-2xl border border-dashed border-orange-200 py-8 text-center">
                    <p className="text-2xl">🤔</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">Pincode not recognized</p>
                  </div>
                ) : serviceStatus === "coming_soon" ? (
                  <div className="rounded-2xl border border-dashed border-orange-200 py-8 text-center">
                    <p className="text-2xl">🚧</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">Not in this area yet</p>
                    <p className="mt-1 text-xs text-slate-500">We&apos;re expanding fast — check back soon!</p>
                  </div>
                ) : bakers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-orange-200 py-8 text-center">
                    <p className="text-2xl">🌱</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">No bakers found in this area</p>
                    <p className="mt-1 text-xs text-slate-500">We&apos;re growing fast — check back soon!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matchType === "nearby" && (
                      <p className="rounded-xl bg-orange-50 px-3 py-2 text-center text-[11px] font-medium text-orange-700">
                        No bakers exactly in this pincode — showing bakers from nearby areas
                      </p>
                    )}

                    {orderError && (
                      <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-[11px] font-medium text-red-600 ring-1 ring-red-200">
                        {orderError}
                      </p>
                    )}

                    {/* Auto-match — let CrossFriend pick a partner baker instead of choosing yourself */}
                    <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold">🚀 Order via CrossFriend</p>
                        <p className="mt-0.5 text-[11px] text-orange-100">We&apos;ll match the best available partner baker for this cake</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOrder(null)}
                        disabled={orderingKey != null}
                        className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {orderingKey === "automatch" ? "Placing order…" : "Order"}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      <span className="h-px flex-1 bg-slate-200" />
                      or pick a baker yourself
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>

                    {bakers.map((baker, i) => (
                      <BakerCard
                        key={baker.id}
                        baker={baker}
                        index={i}
                        orderingKey={orderingKey}
                        onOrder={handleOrder}
                      />
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
