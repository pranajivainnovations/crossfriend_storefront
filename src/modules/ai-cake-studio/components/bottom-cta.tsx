"use client"

import { motion } from "framer-motion"

export default function BottomCta() {
  return (
    <section className="relative overflow-hidden px-6 pb-10 pt-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-center shadow-[0_24px_80px_rgba(109,40,217,0.35)] sm:p-12"
        >
          <div className="pointer-events-none absolute left-5 top-5 text-2xl text-white/55">✦</div>
          <div className="pointer-events-none absolute left-16 top-11 text-xl text-white/45">✧</div>
          <div className="pointer-events-none absolute right-6 top-8 text-2xl text-white/50">✦</div>
          <div className="pointer-events-none absolute right-16 bottom-8 text-xl text-white/45">✧</div>

          <div className="pointer-events-none mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border border-white/40 shadow-lg shadow-violet-900/20 sm:h-28 sm:w-28">
            <img
              src="/ai-cake-studio/banner/banner-cake.png"
              alt="Banner cake"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          <h2 className="font-heading text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
            Your dream cake is
            <br />
            <span className="text-yellow-300">one prompt away</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
            Start designing now. It is free to try and takes less than a minute.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById("ai-studio")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-xl bg-white px-8 py-3 text-base font-bold text-violet-700 transition hover:bg-violet-50"
            >
              ✨ Start Designing Now
            </motion.button>
            <button
              type="button"
              onClick={() => document.getElementById("inspiration-templates")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-xl border border-white/50 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View Templates
            </button>
          </div>

          <p className="mt-3 text-xs text-white/70">It is free to try. No credit card required.</p>
        </motion.div>
      </div>
    </section>
  )
}
