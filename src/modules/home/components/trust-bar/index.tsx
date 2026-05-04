"use client"

import { motion } from "framer-motion"

const TRUST_ITEMS = [
  { icon: "🚚", title: "Same-Day Delivery", desc: "Order before 2 PM" },
  { icon: "🎂", title: "Freshly Baked", desc: "Straight from the oven" },
  { icon: "💯", title: "100% Customizable", desc: "Your way, your message" },
  { icon: "🔒", title: "Secure Payments", desc: "UPI, Cards & COD" },
]

export default function TrustBar() {
  return (
    <section className="content-container py-8">
      <div className="grid grid-cols-2 small:grid-cols-4 gap-4">
        {TRUST_ITEMS.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-grey-10 hover:border-cf-orange/20 hover:shadow-sm transition-all duration-200"
          >
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-grey-80">{item.title}</p>
              <p className="text-xs text-grey-50">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
