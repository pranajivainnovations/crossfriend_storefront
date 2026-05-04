import { Metadata } from "next"
import OrderTracker from "@modules/order/components/order-tracker"

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Track the status of your CrossFriend order in real-time.",
}

export default function OrderTrackPage() {
  // In production, this would fetch from API based on order ID / session
  // For now, show a demo tracker + search input
  return (
    <div className="content-container py-12 max-w-2xl mx-auto">
      <h1 className="cf-heading text-2xl small:text-3xl text-center mb-2">
        Track Your <span className="gradient-cf-text">Order</span>
      </h1>
      <p className="text-sm text-ui-fg-muted text-center mb-8">
        Enter your order ID to see real-time delivery status
      </p>

      {/* Search */}
      <div className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Enter Order ID (e.g. order_01H...)"
          className="flex-1 px-4 py-3 rounded-xl border border-ui-border-base text-sm focus:outline-none focus:ring-2 focus:ring-cf-orange/40 focus:border-cf-orange"
        />
        <button className="px-6 py-3 bg-cf-orange text-white text-sm font-semibold rounded-xl hover:bg-cf-orange-dark transition-colors">
          Track
        </button>
      </div>

      {/* Demo tracker */}
      <OrderTracker
        currentStatus="preparing"
        orderId="order_01H8XKGFP4KJ9R"
        estimatedDelivery="Today, 4:00 PM - 6:00 PM"
      />

      {/* Help text */}
      <div className="mt-8 p-4 bg-cf-warm rounded-xl text-center">
        <p className="text-sm text-grey-60">
          Can&apos;t find your order? <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="text-cf-orange font-medium hover:underline">Chat with us on WhatsApp</a>
        </p>
      </div>
    </div>
  )
}
