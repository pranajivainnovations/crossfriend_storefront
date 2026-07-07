"use client"

import { useState } from "react"
import { motion, cubicBezier } from "framer-motion"
import Image from "next/image"
import { HERO_PROMPT_EXAMPLES } from "../data/mock-data"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: cubicBezier(0.22, 1, 0.36, 1), delay },
  }),
}

function CakeHeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="pointer-events-none absolute -inset-8 -z-10">
        <div className="absolute left-12 top-6 h-60 w-60 rounded-full bg-violet-200/40 blur-[80px]" />
        <div className="absolute bottom-6 right-8 h-48 w-48 rounded-full bg-fuchsia-200/35 blur-[70px]" />
      </div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-[36px] border border-violet-100 bg-gradient-to-br from-[#f3ebff] via-white to-[#f9f3ff] p-5 shadow-[0_24px_70px_rgba(124,58,237,0.2)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100">
          <Image
            src="/ai-cake-studio/hero/hero-cake.jpg"
            alt="AI cake studio hero cake"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-violet-700">
            AI Cake Preview
          </div>
        </div>
      </motion.div>

      {["left-2 top-14", "right-3 top-24", "left-7 bottom-16", "right-1 bottom-12"].map((pos, i) => (
        <motion.div
          key={pos}
          className={`absolute ${pos} h-2.5 w-2.5 rounded-full bg-violet-400/70`}
          animate={{ y: [0, -9, 0], opacity: [0.45, 1, 0.45] }}
          transition={{ repeat: Infinity, duration: 2.8 + i * 0.35, ease: "easeInOut" }}
        />
      ))}

      <div className="pointer-events-none absolute -left-4 bottom-8 rounded-2xl border border-violet-100 bg-white/90 px-3 py-2 text-xs font-semibold text-violet-700 shadow-md backdrop-blur-sm">
        ✨ AI Generated
      </div>
      <div className="pointer-events-none absolute -right-3 top-10 rounded-2xl border border-purple-100 bg-white/90 px-3 py-2 text-xs font-semibold text-purple-700 shadow-md backdrop-blur-sm">
        🛵 Fast Delivery
      </div>
    </div>
  )
}

export default function HeroSection() {
  const [prompt, setPrompt] = useState("")
  const [exampleIndex, setExampleIndex] = useState(0)

  const handleGenerate = () => {
    if (!prompt.trim()) return
    document.getElementById("ai-studio")?.scrollIntoView({ behavior: "smooth" })
  }

  const hasPrompt = prompt.trim().length > 0

  const handleExampleClick = () => {
    const next = (exampleIndex + 1) % HERO_PROMPT_EXAMPLES.length
    setPrompt(HERO_PROMPT_EXAMPLES[next])
    setExampleIndex(next)
  }

  return (
    <section className="relative overflow-hidden px-6 pb-8 pt-3 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8f3ff] via-[#fcfbff] to-[#f6efff]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-[30px] border border-violet-100 bg-white/75 p-6 shadow-[0_16px_60px_rgba(123,47,247,0.08)] lg:grid-cols-2 lg:p-8">
        <div className="space-y-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
              ✦ New
              <span className="text-slate-400">|</span>
              AI Powered Cake Design Studio
            </span>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.1}>
            <h1 className="font-heading text-4xl font-semibold leading-[1.03] tracking-[-0.045em] text-slate-900 sm:text-5xl lg:text-[40px]">
              <span className="bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
                Design Your Dream Cake
              </span>
              <br />
              <span className="text-slate-800">in 60 Seconds</span>
            </h1>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="text-lg font-medium leading-7 text-slate-700 sm:text-xl"
          >
            Powered by AI + Local Bakers near you
          </motion.p>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.22}
            className="text-base leading-7 text-slate-500 sm:text-lg"
          >
            Describe your cake, pick style, and get real baker-ready designs instantly.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.25}
            className="grid gap-2 sm:grid-cols-2"
          >
            {[
              { label: "AI Generated", icon: "🤖" },
              { label: "Multiple Styles", icon: "🎨" },
              { label: "Local Bakers", icon: "🏪" },
              { label: "Order Easily", icon: "🛍️" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-xl border border-violet-100 bg-white px-3 py-2.5 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm">
                  {f.icon}
                </span>
                <span className="text-xs font-semibold text-slate-700">{f.label}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.35}
            className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_14px_35px_rgba(109,40,217,0.12)]"
          >
            

            
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="flex items-center justify-center py-2 lg:-mt-8"
        >
          <CakeHeroVisual />
        </motion.div>
      </div>
    </section>
  )
}
