"use client"

import { motion } from "framer-motion"
import type { Baker } from "../types"

interface RecommendedBakersProps {
  bakers: Baker[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 ${star <= Math.floor(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="ml-1 text-xs font-semibold text-slate-600">{rating}</span>
    </div>
  )
}

function BakerCard({ baker, index }: { baker: Baker; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-100/60 transition-shadow duration-300 hover:shadow-2xl hover:shadow-violet-100/40"
    >
      {/* Top band with gradient */}
      <div className={`h-3 w-full bg-gradient-to-r ${baker.avatarGradient}`} />

      <div className="p-6">
        {/* Avatar + name */}
        <div className="flex items-start gap-4">
          <div
            className={`relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${baker.avatarGradient} text-xl font-bold text-white shadow-sm`}
          >
            {baker.name[0]}
            {baker.verified && (
              <span
                title="Verified"
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-2 ring-white"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-violet-600 fill-current">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-heading text-base font-bold text-slate-900">
                {baker.name}
              </h4>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">{baker.specialty}</p>
            <div className="mt-2">
              <StarRating rating={baker.rating} />
              <p className="mt-0.5 text-xs text-slate-400">{baker.reviews} reviews</p>
            </div>
          </div>

          {baker.badge && (
            <span className="shrink-0 rounded-full bg-violet-50 border border-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700">
              {baker.badge}
            </span>
          )}
        </div>

        {/* Info grid */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <p className="text-base font-bold text-slate-800">{baker.distance}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Distance</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <p className="text-base font-bold text-slate-800">{baker.startingPrice}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">From</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <p className="text-base font-bold text-slate-800">{baker.deliveryTime}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Delivery</p>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-bold text-white shadow-sm shadow-violet-200 transition hover:from-violet-700 hover:to-purple-700"
        >
          View Profile →
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function RecommendedBakers({ bakers }: RecommendedBakersProps) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white p-8 shadow-2xl shadow-slate-100/60">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600">
            Powered by AI matching
          </p>
          <h3 className="mt-1.5 font-heading text-2xl font-bold text-slate-900">
            Recommended local bakers
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Verified bakers near you who can make this design
          </p>
        </div>
        <button
          type="button"
          className="hidden rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-700 sm:block"
        >
          See all bakers →
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {bakers.map((baker, i) => (
          <BakerCard key={baker.id} baker={baker} index={i} />
        ))}
      </div>
    </div>
  )
}
