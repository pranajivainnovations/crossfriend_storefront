"use client"

import { useState } from "react"
import { motion, cubicBezier } from "framer-motion"
import Image from "next/image"
import { HERO_PROMPT_EXAMPLES } from "../data/mock-data"
import { track } from "@lib/analytics"

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
        <div className="absolute left-12 top-6 h-60 w-60 rounded-full bg-cf-purple-200/40 blur-[80px]" />
        <div className="absolute bottom-6 right-8 h-48 w-48 rounded-full bg-fuchsia-200/35 blur-[70px]" />
      </div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-[36px] border border-cf-purple-100 bg-gradient-to-br from-[#f3ebff] via-white to-[#f9f3ff] p-3 shadow-[0_24px_70px_rgba(124,58,237,0.2)] lg:p-5"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-[28px] border border-cf-purple-100 bg-gradient-to-br from-cf-purple-100 via-purple-100 to-fuchsia-100 lg:aspect-[4/3]">
          <Image
            src="/ai-cake-studio/hero/hero-cake.jpg"
            alt="AI cake studio hero cake"
            fill
            // Without sizes, `fill` assumes 100vw and pulls a full-viewport-width file for a slot
            // that's roughly half the screen on desktop. This is the LCP image, so the wasted bytes
            // land squarely on the metric that decides how fast the page feels.
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-cf-purple-700">
            AI Cake Preview
          </div>
        </div>
      </motion.div>

      {["left-2 top-14", "right-3 top-24", "left-7 bottom-16", "right-1 bottom-12"].map((pos, i) => (
        <motion.div
          key={pos}
          className={`absolute ${pos} h-2.5 w-2.5 rounded-full bg-cf-purple-400/70`}
          animate={{ y: [0, -9, 0], opacity: [0.45, 1, 0.45] }}
          transition={{ repeat: Infinity, duration: 2.8 + i * 0.35, ease: "easeInOut" }}
        />
      ))}

      <div className="pointer-events-none absolute -left-4 bottom-8 rounded-2xl border border-cf-purple-100 bg-white/90 px-3 py-2 text-xs font-semibold text-cf-purple-700 shadow-md backdrop-blur-sm">
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

    /**
     * A CrossFriend-specific event, not a GA4 standard one.
     *
     * This is the hero scroll-to-studio, several steps before a generation is actually requested.
     * Named for where it happens so it is never mistaken for the Generate click — the pair that
     * measures whether the AI delivers is studio_generate_clicked vs studio_design_generated.
     * Prompt length is reported rather than the prompt itself —
     * "are people writing real briefs or two words" is the question, and free text typed by a
     * customer is not something to ship to a third party.
     */
    track("studio_hero_prompt_submitted", {
      prompt_length: prompt.trim().length,
      used_example: prompt.trim() === HERO_PROMPT_EXAMPLES[exampleIndex]?.trim(),
    })

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

      <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-[30px] border border-cf-purple-100 bg-white/75 p-6 shadow-[0_16px_60px_rgba(123,47,247,0.08)] lg:grid-cols-2 lg:p-8">
        <div className="space-y-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-cf-purple-200 bg-cf-purple-50 px-4 py-1.5 text-xs font-semibold text-cf-purple-700 shadow-sm">
              ✦ New
              <span className="text-slate-400">|</span>
              AI Powered Cake Design Studio
            </span>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.1}>
            <h1 className="font-heading text-4xl font-semibold leading-[1.03] tracking-[-0.045em] text-slate-900 sm:text-5xl xl:text-6xl">
              <span className="bg-gradient-to-r from-cf-purple-700 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
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
            className="text-lg font-medium leading-7 text-slate-700 sm:text-xl xl:text-2xl"
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
            /* Four across, always.

               These were one card per row on a phone — four bordered boxes, roughly a third of the
               first screen, spent on four words nobody reads before they have seen what the product
               does. As a row of icons they say the same thing in a quarter of the height, and the
               hero stops pushing the actual studio below the fold.

               The boxes are gone with them. Four small cards stacked is a list; four icons in a row
               is a summary, and a summary is what this is. */
            className="grid grid-cols-4 gap-1 sm:gap-3"
          >
            {[
              { label: "AI made", icon: "🤖" },
              { label: "Any style", icon: "🎨" },
              { label: "Local bakers", icon: "🏪" },
              { label: "Easy order", icon: "🛍️" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-1.5 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-base shadow-sm ring-1 ring-cf-purple-100">
                  {f.icon}
                </span>
                <span className="text-[10px] font-semibold leading-tight text-slate-600 sm:text-xs">
                  {f.label}
                </span>
              </div>
            ))}
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
