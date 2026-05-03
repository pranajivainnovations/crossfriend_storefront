"use client"

import { motion } from "framer-motion"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ConfettiBg from "@modules/common/components/confetti-bg"
import { usePlanning } from "@modules/planning/context/planning-context"

const Hero = () => {
  const { open } = usePlanning()

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-cf-warm via-white to-cf-warm">
      <ConfettiBg className="opacity-40" />

      <div className="relative z-10 content-container py-16 small:py-28 flex flex-col items-center text-center gap-6">
        {/* Tagline pill */}
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cf-orange/10 text-cf-orange text-sm font-medium"
        >
          🎉 Your one-stop celebration shop
        </motion.span>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="cf-heading text-4xl small:text-6xl leading-tight small:leading-tight max-w-3xl"
        >
          Make Every Celebration{" "}
          <span className="gradient-cf-text">Unforgettable</span>
        </motion.h1>

        {/* Sub-heading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-ui-fg-subtle text-base small:text-lg max-w-xl leading-relaxed"
        >
          Cakes, decorations, gifts, costumes &amp; more — discover, plan, and
          order everything you need in minutes.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col xsmall:flex-row gap-3 mt-2"
        >
          <button
            onClick={open}
            className="btn-cf-primary text-base"
          >
            🎂 Start Planning
          </button>
          <LocalizedClientLink
            href="#occasions"
            className="btn-cf-secondary text-base"
          >
            Explore Occasions
          </LocalizedClientLink>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-4 small:gap-6 mt-4 text-xs text-ui-fg-muted"
        >
          <span className="flex items-center gap-1">🚚 Same-day delivery</span>
          <span className="flex items-center gap-1">🎁 Celebration kits</span>
          <span className="flex items-center gap-1">⭐ Premium brands</span>
        </motion.div>
      </div>
    </div>
  )
}

export default Hero
