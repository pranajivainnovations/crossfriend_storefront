"use client"

import { motion } from "framer-motion"

const TESTIMONIALS = [
  {
    name: "Priya S.",
    location: "Delhi NCR",
    text: "The birthday cake was absolutely gorgeous and tasted divine! Delivered right on time. Will order again!",
    rating: 5,
    occasion: "🎂 Birthday",
  },
  {
    name: "Rahul M.",
    location: "Noida",
    text: "Ordered decorations for my daughter's first birthday. Quality was premium and the setup looked amazing!",
    rating: 5,
    occasion: "🎈 Kids Party",
  },
  {
    name: "Sneha K.",
    location: "Ghaziabad",
    text: "Same-day delivery saved our anniversary surprise! The chocolate cake was moist and the packaging was beautiful.",
    rating: 5,
    occasion: "💍 Anniversary",
  },
]

export default function Testimonials() {
  return (
    <section className="py-16 small:py-24 bg-gradient-to-b from-grey-5 to-white">
      <div className="content-container">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-4"
          >
            ⭐ Customer Love
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-heading font-bold text-3xl small:text-4xl text-grey-90"
          >
            What our customers say
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 small:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative p-6 rounded-2xl bg-white border border-grey-10 hover:border-cf-orange/20 hover:shadow-lg transition-all duration-300"
            >
              {/* Quote mark */}
              <div className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-cf-orange flex items-center justify-center text-white text-sm font-bold shadow-md">
                &ldquo;
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-3 mt-2">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>

              {/* Text */}
              <p className="text-sm text-grey-70 leading-relaxed mb-4">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center justify-between pt-4 border-t border-grey-10">
                <div>
                  <p className="text-sm font-semibold text-grey-80">{t.name}</p>
                  <p className="text-xs text-grey-50">{t.location}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-cf-warm text-xs font-medium text-grey-70">
                  {t.occasion}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
