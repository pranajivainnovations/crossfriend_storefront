"use client"

import { useEffect, useMemo, useState } from "react"
import {
  formatDate,
  getEarliestDeliveryDate,
  getAvailableTimeSlots,
  isSameDayAvailable,
  cutoffCountdownText,
} from "@lib/util/delivery-utils"
import type { DeliveryTimeSlot } from "@lib/types/product-contract"

type Props = {
  date: string
  timeSlot: DeliveryTimeSlot | ""
  onDateChange: (date: string) => void
  onTimeSlotChange: (slot: DeliveryTimeSlot) => void
}

export default function DeliveryDatePicker({
  date,
  timeSlot,
  onDateChange,
  onTimeSlotChange,
}: Props) {
  const [urgencyText, setUrgencyText] = useState<string | null>(null)
  const [sameDayOk, setSameDayOk] = useState(false)

  // Compute min/max dates
  const minDate = useMemo(() => formatDate(getEarliestDeliveryDate()), [])
  const maxDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return formatDate(d)
  }, [])

  // Available time slots for the selected date
  const availableSlots = useMemo(
    () => (date ? getAvailableTimeSlots(date) : []),
    [date]
  )

  // Urgency ticker
  useEffect(() => {
    const update = () => {
      setSameDayOk(isSameDayAvailable())
      setUrgencyText(cutoffCountdownText())
    }
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [])

  // If selected time slot is no longer available, reset it
  useEffect(() => {
    if (timeSlot && !availableSlots.includes(timeSlot as DeliveryTimeSlot)) {
      onTimeSlotChange(availableSlots[0] || ("" as DeliveryTimeSlot))
    }
  }, [availableSlots, timeSlot, onTimeSlotChange])

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-grey-80">
        📅 Delivery Date & Time
      </label>

      {/* Urgency message */}
      {urgencyText && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cf-orange/10 text-cf-orange text-xs font-medium">
          <span>⏰</span>
          <span>{urgencyText}</span>
        </div>
      )}

      {!sameDayOk && (
        <p className="text-xs text-ui-fg-muted">
          Same-day cutoff has passed — earliest delivery is tomorrow.
        </p>
      )}

      {/* Date input */}
      <input
        type="date"
        value={date}
        min={minDate}
        max={maxDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-ui-border-base bg-white text-sm text-grey-80 focus:outline-none focus:ring-2 focus:ring-cf-orange/40 focus:border-cf-orange transition-colors"
      />

      {/* Time slot selector */}
      {date && availableSlots.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-ui-fg-muted">Available time slots</span>
          <div className="flex flex-wrap gap-2">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onTimeSlotChange(slot)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  timeSlot === slot
                    ? "bg-cf-orange text-white border-cf-orange"
                    : "bg-white text-grey-80 border-ui-border-base hover:border-cf-orange"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {date && availableSlots.length === 0 && (
        <p className="text-xs text-ui-fg-muted">
          No time slots available for this date. Please select a different date.
        </p>
      )}
    </div>
  )
}
