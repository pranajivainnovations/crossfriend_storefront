/**
 * Delivery Utilities
 *
 * Cutoff validation, auto-shift to next available date, and time slot logic
 * for cake and perishable product delivery.
 */

import {
  DELIVERY_CUTOFF_HOUR,
  DELIVERY_TIME_SLOTS,
  DeliveryTimeSlot,
} from "@lib/types/product-contract"

// --- Helpers ---

/** Get current time in IST (UTC+5:30). */
function nowIST(): Date {
  const now = new Date()
  // Offset to IST: UTC + 5h 30m
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000
  return new Date(utc + 5.5 * 60 * 60_000)
}

/** Format a Date as YYYY-MM-DD. */
export function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// --- Cutoff Logic ---

/**
 * Whether same-day delivery is still available.
 * Returns `false` if current IST time is past the cutoff hour.
 */
export function isSameDayAvailable(): boolean {
  return nowIST().getHours() < DELIVERY_CUTOFF_HOUR
}

/**
 * Get the earliest available delivery date.
 * If past cutoff → tomorrow; otherwise → today.
 */
export function getEarliestDeliveryDate(): Date {
  const ist = nowIST()
  if (ist.getHours() >= DELIVERY_CUTOFF_HOUR) {
    ist.setDate(ist.getDate() + 1)
  }
  ist.setHours(0, 0, 0, 0)
  return ist
}

/**
 * Minutes remaining until the same-day cutoff.
 * Returns 0 if cutoff has passed.
 */
export function minutesUntilCutoff(): number {
  const ist = nowIST()
  const cutoff = new Date(ist)
  cutoff.setHours(DELIVERY_CUTOFF_HOUR, 0, 0, 0)
  const diff = cutoff.getTime() - ist.getTime()
  return diff > 0 ? Math.floor(diff / 60_000) : 0
}

/**
 * Human-readable countdown string for urgency banner.
 * e.g. "2h 15m left for same-day delivery"
 */
export function cutoffCountdownText(): string | null {
  const mins = minutesUntilCutoff()
  if (mins <= 0) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0) return `${h}h ${m}m left for same-day delivery`
  return `${m}m left for same-day delivery`
}

// --- Time Slots ---

/** Get available delivery time slots for a given date. */
export function getAvailableTimeSlots(date: string): DeliveryTimeSlot[] {
  const ist = nowIST()
  const today = formatDate(ist)

  // Future dates: all slots available
  if (date > today) {
    return [...DELIVERY_TIME_SLOTS]
  }

  // Today: filter out past slots
  if (date === today) {
    const currentHour = ist.getHours()
    return DELIVERY_TIME_SLOTS.filter((slot) => {
      // Parse the start hour from the slot string e.g. "2:00 PM" → 14
      const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/)
      if (!match) return false
      let hour = parseInt(match[1], 10)
      if (match[3] === "PM" && hour !== 12) hour += 12
      if (match[3] === "AM" && hour === 12) hour = 0
      // Slot must start at least 2 hours from now
      return hour >= currentHour + 2
    })
  }

  // Past dates: no slots
  return []
}

// --- Validation ---

/**
 * Validate a delivery date string.
 * Must be on or after the earliest available date.
 */
export function isValidDeliveryDate(date: string): boolean {
  const earliest = getEarliestDeliveryDate()
  return date >= formatDate(earliest)
}
