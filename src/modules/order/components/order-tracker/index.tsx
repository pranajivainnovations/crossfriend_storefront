"use client"

type OrderStatus = "placed" | "confirmed" | "preparing" | "shipped" | "out_for_delivery" | "delivered"

type OrderTrackerProps = {
  currentStatus: OrderStatus
  orderId: string
  estimatedDelivery?: string
}

const STEPS: { status: OrderStatus; label: string; emoji: string }[] = [
  { status: "placed", label: "Order Placed", emoji: "📝" },
  { status: "confirmed", label: "Confirmed", emoji: "✅" },
  { status: "preparing", label: "Preparing", emoji: "👨‍🍳" },
  { status: "shipped", label: "Shipped", emoji: "📦" },
  { status: "out_for_delivery", label: "Out for Delivery", emoji: "🚚" },
  { status: "delivered", label: "Delivered", emoji: "🎉" },
]

export default function OrderTracker({ currentStatus, orderId, estimatedDelivery }: OrderTrackerProps) {
  const currentIndex = STEPS.findIndex((s) => s.status === currentStatus)

  return (
    <div className="bg-white rounded-2xl border border-ui-border-base p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-grey-80">Order #{orderId.slice(-8).toUpperCase()}</h3>
          {estimatedDelivery && (
            <p className="text-xs text-ui-fg-muted mt-0.5">
              Estimated delivery: <span className="font-medium text-grey-80">{estimatedDelivery}</span>
            </p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          currentStatus === "delivered"
            ? "bg-green-50 text-green-700"
            : "bg-cf-orange/10 text-cf-orange"
        }`}>
          {STEPS[currentIndex]?.label || currentStatus}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex
          const isLast = index === STEPS.length - 1

          return (
            <div key={step.status} className="flex items-start gap-3 relative">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`absolute left-[15px] top-[30px] w-0.5 h-[calc(100%-10px)] ${
                    index < currentIndex ? "bg-cf-orange" : "bg-grey-20"
                  }`}
                />
              )}

              {/* Circle */}
              <div
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                  isCompleted
                    ? "bg-cf-orange text-white"
                    : "bg-grey-10 text-grey-40"
                } ${isCurrent ? "ring-2 ring-cf-orange/30 ring-offset-2" : ""}`}
              >
                <span className="text-sm">{step.emoji}</span>
              </div>

              {/* Content */}
              <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                <p className={`text-sm font-medium ${isCompleted ? "text-grey-80" : "text-grey-40"}`}>
                  {step.label}
                </p>
                {isCurrent && currentStatus !== "delivered" && (
                  <p className="text-xs text-cf-orange mt-0.5">In progress...</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
