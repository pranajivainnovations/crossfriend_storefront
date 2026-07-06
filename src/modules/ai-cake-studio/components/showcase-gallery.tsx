"use client"

import { motion } from "framer-motion"
import { SHOWCASE_CREATIONS } from "../data/mock-data"

export default function ShowcaseGallery() {
  return (
    <section className="px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            See What You Can Create
          </h2>
          <button
            type="button"
            onClick={() => document.getElementById("ai-studio")?.scrollIntoView({ behavior: "smooth" })}
            className="text-sm font-semibold text-violet-600 transition hover:text-violet-700"
          >
            Create one now →
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {SHOWCASE_CREATIONS.map((item, i) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="overflow-hidden rounded-2xl border border-violet-100 bg-white p-2 shadow-sm"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-violet-50">
                <img
                  src={item.imagePath}
                  alt={item.imageAlt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 rounded-xl border border-white/50" />
              </div>
              <div className="p-2.5">
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
                <span className="mt-2 inline-flex rounded-full bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700">
                  {item.tag}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
