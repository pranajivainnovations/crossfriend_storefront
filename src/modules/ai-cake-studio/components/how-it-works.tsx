"use client"

import { motion } from "framer-motion"
import { HOW_IT_WORKS_STEPS } from "../data/mock-data"

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden px-6 py-8 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-violet-50/35 to-white" />

      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] text-slate-900 sm:text-4xl">
            How AI Cake Studio works
          </h2>
        </motion.div>

        <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-[50px] hidden h-px lg:block">
            <div className="h-px w-full bg-gradient-to-r from-violet-200 via-purple-200 to-fuchsia-200" />
            <div className="absolute inset-0 h-px animate-pulse bg-gradient-to-r from-violet-400/50 via-purple-300/50 to-fuchsia-300/50 blur-sm" />
          </div>

          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
                className={`relative z-10 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-br ${step.accent} shadow-xl`}
              >
                <div className="absolute inset-[6px] rounded-full bg-white/20 backdrop-blur-sm" />
                <span className="relative z-10 text-3xl">{step.icon}</span>

                <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-800 shadow-md ring-2 ring-slate-50">
                  {step.step}
                </span>
              </motion.div>

              {i < HOW_IT_WORKS_STEPS.length - 1 && (
                <div className="my-4 text-slate-300 lg:hidden">↓</div>
              )}

              <h3 className="mt-5 font-heading text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
