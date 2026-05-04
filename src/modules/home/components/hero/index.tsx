"use client"

import { motion } from "framer-motion"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePlanning } from "@modules/planning/context/planning-context"

const Hero = () => {
  const { open } = usePlanning()

  return (
    <section className="relative w-full overflow-hidden min-h-[90vh] flex items-center">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cf-orange/10 via-white to-cf-purple/5" />
      
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-[10%] right-[10%] w-72 h-72 rounded-full bg-cf-orange/5 blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-[15%] left-[5%] w-96 h-96 rounded-full bg-cf-purple/5 blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[40%] left-[50%] w-64 h-64 rounded-full bg-cf-yellow/10 blur-3xl animate-pulse-soft" style={{ animationDelay: "2s" }} />
        
        {/* Floating emoji decorations */}
        <motion.span
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] right-[20%] text-5xl opacity-20 select-none"
        >🎂</motion.span>
        <motion.span
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-[25%] left-[12%] text-4xl opacity-15 select-none"
        >🎈</motion.span>
        <motion.span
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[25%] right-[15%] text-4xl opacity-15 select-none"
        >🎁</motion.span>
        <motion.span
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-[30%] left-[20%] text-3xl opacity-15 select-none"
        >✨</motion.span>
      </div>

      <div className="relative z-10 content-container py-20 small:py-32 flex flex-col small:flex-row items-center gap-12 small:gap-16">
        {/* Left: Text content */}
        <div className="flex-1 flex flex-col items-center small:items-start text-center small:text-left gap-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-cf-orange/20 shadow-sm"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cf-orange opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cf-orange" />
            </span>
            <span className="text-sm font-medium text-grey-70">Same-day delivery available</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading font-bold text-4xl small:text-5xl medium:text-6xl leading-[1.1] text-grey-90"
          >
            Celebrations Made{" "}
            <span className="relative inline-block">
              <span className="gradient-cf-text">Magical</span>
              <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                <path d="M1 5.5C47 2.5 100 1.5 199 5.5" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="underline-grad" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="#FF6B35"/>
                    <stop offset="1" stopColor="#FF2D87"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-grey-50 text-base small:text-lg max-w-lg leading-relaxed"
          >
            From stunning cakes to dreamy décor — everything to make 
            birthdays, anniversaries &amp; festivals truly special. Delivered to your door.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col xsmall:flex-row gap-3 mt-2"
          >
            <LocalizedClientLink
              href="/store"
              className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-cf-orange text-white font-semibold text-base shadow-lg shadow-cf-orange/25 hover:shadow-xl hover:shadow-cf-orange/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              <span>Shop Now</span>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </LocalizedClientLink>
            <button
              onClick={open}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white border-2 border-grey-20 text-grey-80 font-semibold text-base hover:border-cf-orange hover:text-cf-orange hover:-translate-y-0.5 transition-all duration-200"
            >
              🎂 Plan a Party
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center gap-4 mt-4 pt-4 border-t border-grey-10"
          >
            {/* Stacked avatars */}
            <div className="flex -space-x-2">
              {["🧑", "👩", "👨", "👧"].map((emoji, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-cf-warm border-2 border-white flex items-center justify-center text-sm"
                >
                  {emoji}
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <p className="text-xs text-grey-50">Trusted by <span className="font-semibold text-grey-80">2,000+</span> happy customers</p>
            </div>
          </motion.div>
        </div>

        {/* Right: Visual showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 30 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex-1 relative hidden small:flex items-center justify-center"
        >
          <div className="relative w-full max-w-md aspect-square">
            {/* Main showcase card */}
            <div className="absolute inset-4 rounded-3xl bg-gradient-to-br from-cf-warm to-white border border-cf-orange/10 shadow-2xl overflow-hidden flex items-center justify-center">
              <div className="text-center p-8">
                <span className="text-8xl block mb-4">🎂</span>
                <p className="font-heading font-bold text-2xl text-grey-80">Fresh Cakes</p>
                <p className="text-sm text-grey-50 mt-1">Starting ₹499</p>
              </div>
            </div>

            {/* Floating mini cards */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-2 -right-2 bg-white rounded-2xl shadow-xl border border-grey-10 p-3 flex items-center gap-2"
            >
              <span className="text-2xl">🎈</span>
              <div>
                <p className="text-xs font-semibold text-grey-80">Decorations</p>
                <p className="text-[10px] text-grey-50">200+ items</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute -bottom-2 -left-2 bg-white rounded-2xl shadow-xl border border-grey-10 p-3 flex items-center gap-2"
            >
              <span className="text-2xl">🎁</span>
              <div>
                <p className="text-xs font-semibold text-grey-80">Gifts</p>
                <p className="text-[10px] text-grey-50">Same-day delivery</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              className="absolute top-1/2 -left-6 bg-white rounded-2xl shadow-xl border border-grey-10 p-3 flex items-center gap-2"
            >
              <span className="text-2xl">🎭</span>
              <div>
                <p className="text-xs font-semibold text-grey-80">Costumes</p>
                <p className="text-[10px] text-grey-50">All sizes</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
