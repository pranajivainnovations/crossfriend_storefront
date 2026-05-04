"use client"

import { useState } from "react"
import { usePincode } from "@lib/context/pincode-context"

type PincodeCheckerProps = {
  variant?: "compact" | "full"
  className?: string
}

export default function PincodeChecker({ variant = "full", className = "" }: PincodeCheckerProps) {
  const { pincode, deliveryInfo, isChecking, error, setPincode, clearPincode } = usePincode()
  const [input, setInput] = useState("")

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    await setPincode(input)
  }

  // If already have a pincode, show delivery info
  if (pincode && deliveryInfo) {
    return (
      <div className={`${className}`}>
        <div className={`flex items-center gap-2 ${variant === "compact" ? "text-xs" : "text-sm"}`}>
          <span className="text-green-600 font-medium">📍 {deliveryInfo.city}</span>
          {deliveryInfo.sameDayAvailable && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-semibold rounded-full">
              Same-Day ⚡
            </span>
          )}
          {!deliveryInfo.sameDayAvailable && deliveryInfo.available && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-full">
              {deliveryInfo.estimatedDays === 1 ? "Next Day" : `${deliveryInfo.estimatedDays} Days`}
            </span>
          )}
          <button
            onClick={clearPincode}
            className="text-ui-fg-muted hover:text-cf-orange text-xs underline ml-1"
          >
            Change
          </button>
        </div>
      </div>
    )
  }

  // Input form
  return (
    <div className={`${className}`}>
      <form onSubmit={handleCheck} className={`flex items-center gap-2 ${variant === "compact" ? "" : "flex-col items-start gap-2"}`}>
        {variant === "full" && (
          <label className="text-sm font-medium text-grey-80">
            📍 Check Delivery Availability
          </label>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter pincode"
            maxLength={6}
            className={`border border-ui-border-base rounded-lg bg-white text-grey-80 placeholder:text-ui-fg-muted focus:outline-none focus:ring-2 focus:ring-cf-orange/40 focus:border-cf-orange transition-colors ${
              variant === "compact" ? "px-2 py-1 text-xs w-24" : "px-3 py-2 text-sm w-32"
            }`}
          />
          <button
            type="submit"
            disabled={isChecking || input.length !== 6}
            className={`font-medium rounded-lg transition-colors disabled:opacity-50 ${
              variant === "compact"
                ? "px-2 py-1 text-xs bg-cf-orange text-white hover:bg-cf-orange-dark"
                : "px-4 py-2 text-sm bg-cf-orange text-white hover:bg-cf-orange-dark"
            }`}
          >
            {isChecking ? "..." : "Check"}
          </button>
        </div>
      </form>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
