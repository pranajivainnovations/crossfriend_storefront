"use client"

import { motion } from "framer-motion"
import { INSPIRATION_CARDS } from "../data/mock-data"

export default function InspirationCards() {
  return (
    <section id="inspiration-templates" className="px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-4 flex items-center justify-between gap-4"
        >
          <h2 className="font-heading text-2xl font-bold tracking-[-0.03em] text-slate-900 sm:text-3xl">
            Need Inspiration? <span className="font-normal text-slate-600">Try these ideas</span>
          </h2>
          <button
            type="button"
            onClick={() => document.getElementById("ai-studio")?.scrollIntoView({ behavior: "smooth" })}
            className="text-sm font-semibold text-violet-600 transition hover:text-violet-700"
          >
            Use these in studio →
          </button>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {INSPIRATION_CARDS.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, scale: 1.015 }}
              className="group cursor-pointer"
              onClick={() =>
                document.getElementById("ai-studio")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-white p-2.5 shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:shadow-violet-100/60">
                <div className={`relative h-32 overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient}`}>
                  <img
                    src={card.imagePath}
                    alt={card.imageAlt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 border border-white/50" />
                </div>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">{card.category}</h3>
                <p className="mt-1 text-xs text-slate-500">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
