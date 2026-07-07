"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export default function DesignToRealSection() {
  return (
    <section className="px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="overflow-hidden rounded-[32px] border border-violet-100 bg-white p-6 shadow-[0_24px_60px_rgba(109,40,217,0.12)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div>
              <h3 className="font-heading text-3xl font-bold tracking-[-0.03em] text-violet-700 sm:text-4xl">
                Turn Your Design
                <br />
                into <span className="text-purple-600">a Real Cake</span>
              </h3>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Connect with verified local bakers who can create your AI design exactly the way you want.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-purple-700"
                >
                  📍 Find Bakers Near Me
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                >
                  🧾 Get Price Estimate
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100 p-6">
                <div className="relative h-[220px] overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100">
                  {/* Fallback shown until baker image is uploaded */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl">👨‍🍳</span>
                    <span className="text-xs font-semibold text-violet-400">Verified Baker</span>
                  </div>
                  <Image
                    src="/ai-cake-studio/baker/verified-baker.jpg"
                    alt="Verified baker"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mt-3 rounded-2xl border border-violet-100 bg-white/95 p-3 shadow-lg backdrop-blur"
              >
                <div className="grid grid-cols-1 gap-2 text-center text-xs font-semibold text-slate-600 sm:grid-cols-3 sm:text-sm">
                  <span className="rounded-full bg-violet-50 px-3 py-1">🛡️ Verified Bakers</span>
                  <span className="rounded-full bg-violet-50 px-3 py-1">🚚 On time delivery</span>
                  <span className="rounded-full bg-violet-50 px-3 py-1">💳 Secure Payments</span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="mt-10 grid gap-3 rounded-2xl border border-violet-100 bg-white p-4 text-center sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "10,000+", label: "Cakes Designed", icon: "🎂" },
              { value: "200+", label: "Verified Bakers", icon: "👨‍🍳" },
              { value: "4.8/5", label: "Customer Rating", icon: "⭐" },
              { value: "50,000+", label: "Happy Customers", icon: "💜" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-violet-50/45 px-4 py-3">
                <p className="text-xl">{item.icon}</p>
                <p className="mt-1 text-2xl font-bold text-violet-700">{item.value}</p>
                <p className="text-xs font-semibold text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
