"use client"

import { motion } from "framer-motion"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function CtaBanner() {
  return (
    <section className="content-container py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cf-orange via-cf-coral to-cf-pink p-10 small:p-16 text-center"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 max-w-xl mx-auto">
          <span className="text-5xl mb-4 block">🎉</span>
          <h2 className="font-heading font-bold text-2xl small:text-3xl text-white mb-3">
            Ready to make it special?
          </h2>
          <p className="text-white/80 text-sm small:text-base mb-6 leading-relaxed">
            Join thousands of happy customers who trust CrossFriend for their celebrations.
            Free delivery on your first order!
          </p>
          <div className="flex flex-col xsmall:flex-row gap-3 justify-center">
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-cf-orange font-semibold text-base hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              Shop Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </LocalizedClientLink>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold text-base hover:bg-white/20 transition-all duration-200"
            >
              💬 WhatsApp Us
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
