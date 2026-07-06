"use client"

import { motion } from "framer-motion"
import type { AiAnalysis } from "../types"

interface AiAnalysisCardProps {
  analysis: AiAnalysis
}

interface MetricRowProps {
  label: string
  value: string
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  )
}

interface ProgressMetricProps {
  label: string
  value: number
  color: string
  subLabel?: string
}

function ProgressMetric({ label, value, color, subLabel }: ProgressMetricProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${
            value > 90 ? "from-emerald-400 to-emerald-500" : "from-violet-500 to-purple-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
    </div>
  )
}

export default function AiAnalysisCard({ analysis }: AiAnalysisCardProps) {
  const leftMetrics: MetricRowProps[] = [
    { label: "Complexity", value: analysis.complexity },
    { label: "Difficulty", value: analysis.difficulty },
    { label: "Estimated Cost", value: analysis.estimatedCost },
    { label: "Baking Time", value: analysis.bakingTime },
  ]

  const rightMetrics: MetricRowProps[] = [
    { label: "Recommended Skill", value: analysis.recommendedSkill },
    { label: "Serves", value: analysis.serves },
    { label: "Weight", value: analysis.weight },
    { label: "Flavour", value: analysis.flavour },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-100/60"
    >
      {/* Header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 shadow-sm">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-slate-900">AI Analysis</h3>
            <p className="text-sm text-slate-500">Auto-generated insights from your design</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              ✓ Bakery Verified
            </span>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr_0.7fr]">
          {/* Left metrics */}
          <div className="space-y-3">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Production details
            </p>
            {leftMetrics.map((m) => (
              <MetricRow key={m.label} {...m} />
            ))}
          </div>

          {/* Right metrics */}
          <div className="space-y-3">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Cake specifications
            </p>
            {rightMetrics.map((m) => (
              <MetricRow key={m.label} {...m} />
            ))}
          </div>

          {/* Progress metrics */}
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Confidence scores
            </p>
            <ProgressMetric
              label="Bakery Readiness"
              value={analysis.bakeryReadiness}
              color="text-emerald-600"
              subLabel="This design can be replicated by local bakers"
            />
            <ProgressMetric
              label="AI Confidence"
              value={analysis.aiConfidence}
              color="text-violet-600"
              subLabel="Model confidence in design accuracy"
            />

            {/* Recommendation badge */}
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
              <p className="text-xs font-semibold text-violet-700">💡 AI Recommendation</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                This design pairs well with{" "}
                <span className="font-semibold text-violet-700">vanilla bean sponge</span> and a
                light compote filling for the best bakery experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
