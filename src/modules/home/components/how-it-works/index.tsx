"use client"

import { motion } from "framer-motion"

const STEPS = [
  {
    num: "01",
    icon: "🔍",
    title: "Browse & Choose",
    desc: "Explore cakes, decorations, gifts & more for any occasion.",
    color: "from-cf-orange/10 to-cf-orange/5",
    accent: "text-cf-orange",
  },
  {
    num: "02",
    icon: "🎨",
    title: "Customize",
    desc: "Add messages, pick flavors, choose delivery time that suits you.",
    color: "from-cf-purple/10 to-cf-purple/5",
    accent: "text-cf-purple",
  },
  {
    num: "03",
    icon: "🚀",
    title: "We Deliver",
    desc: "Fresh & on time — same-day or scheduled. Track in real-time.",
    color: "from-emerald-100/50 to-emerald-50/50",
    accent: "text-emerald-600",
  },
]

export default function HowItWorks() {
  return (
    <section className="content-container py-16 small:py-24">
      <div className="text-center mb-12">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4"
        >
          ✨ Simple as 1-2-3
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-heading font-bold text-3xl small:text-4xl text-grey-90"
        >
          How it works
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 small:grid-cols-3 gap-6 small:gap-8">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="relative group"
          >
            {/* Connector line (desktop) */}
            {i < STEPS.length - 1 && (
              <div className="hidden small:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-[2px] bg-gradient-to-r from-grey-20 to-grey-10 z-0" />
            )}

            <div className={`relative z-10 flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-b ${step.color} border border-grey-10 hover:border-grey-20 hover:shadow-md transition-all duration-300`}>
              {/* Step number */}
              <span className={`text-xs font-bold uppercase tracking-widest ${step.accent} mb-4`}>
                Step {step.num}
              </span>

              {/* Icon */}
              <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {step.icon}
              </span>

              {/* Title */}
              <h3 className="font-heading font-semibold text-lg text-grey-80 mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-grey-50 leading-relaxed max-w-[220px]">
                {step.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
