"use client"
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

/**
 * What we can do for someone at a pincode — not merely whether we deliver there.
 *
 * `deliver`     a baker can fulfil here (with a baker slug in play, that specific baker can)
 * `design_only` a real pincode we have not launched: the studio is free and still works
 * `unknown`     not in the India Post directory, so almost certainly a typo
 *
 * The old shape was a boolean plus an invented `estimatedDays`, which is why product pages promised
 * two-day delivery to cities with no baker. Timing now comes from the baker's own turnaround or is
 * left unsaid. See src/app/api/pincode/check/route.ts.
 */
export type CoverageTier = "deliver" | "design_only" | "unknown"

export interface DeliveryInfo {
  /** True only for the "deliver" tier. Kept so existing callers read the same field. */
  available: boolean
  city: string
  area: string
  tier: CoverageTier
  /** Bakers with something published who serve this pincode — powers "but these bakers do". */
  bakerCount: number
  /** Present only when a baker slug was supplied. */
  bakerName?: string
  bakerServes?: boolean
  turnaroundHours: number | null
}

interface PincodeContextType {
  pincode: string
  deliveryInfo: DeliveryInfo | null
  isChecking: boolean
  error: string | null
  /** `baker` narrows the question to one bakery — the right question on a product page. */
  setPincode: (code: string, baker?: string) => Promise<void>
  clearPincode: () => void
}

const PincodeContext = createContext<PincodeContextType | null>(null)

export function PincodeProvider({ children }: { children: ReactNode }) {
  const [pincode, setPincodeState] = useState("")
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cf_pincode")
    const savedInfo = localStorage.getItem("cf_delivery_info")
    if (saved) {
      setPincodeState(saved)
      if (savedInfo) {
        /* Anything cached by the previous version has no `tier` and an `available` that was decided
           by the hardcoded prefix table — including "yes" for cities we have never served. Dropping
           those rather than trusting them means a returning visitor re-checks once and sees the
           truth, instead of carrying an old promise around in localStorage. */
        try {
          const parsed = JSON.parse(savedInfo)
          if (parsed && typeof parsed.tier === "string") setDeliveryInfo(parsed)
          else localStorage.removeItem("cf_delivery_info")
        } catch {
          localStorage.removeItem("cf_delivery_info")
        }
      }
    }
  }, [])

  const setPincode = useCallback(async (code: string, baker?: string) => {
    const trimmed = code.trim()
    if (!/^\d{6}$/.test(trimmed)) {
      setError("Please enter a valid 6-digit pincode")
      return
    }

    setIsChecking(true)
    setError(null)

    try {
      const qs = new URLSearchParams({ pincode: trimmed })
      if (baker) qs.set("baker", baker)
      const res = await fetch(`/api/pincode/check?${qs.toString()}`)
      const data = await res.json()

      /* Every well-formed pincode succeeds now, including ones we cannot deliver to — that is a
         tier, not a failure, and the UI has something to offer in all three. `error` is reserved
         for the cases where we genuinely do not know the answer: a malformed pincode or an
         unreachable backend. Answering "not available" when the backend is down would be inventing
         a coverage claim, which is the bug this whole change exists to remove. */
      if (data.success && data.data) {
        setPincodeState(trimmed)
        setDeliveryInfo(data.data)
        localStorage.setItem("cf_pincode", trimmed)
        localStorage.setItem("cf_delivery_info", JSON.stringify(data.data))
        setError(null)
      } else {
        setError(data.error || "Couldn't check that pincode. Please try again.")
        setDeliveryInfo(null)
      }
    } catch {
      setError("Couldn't check that pincode right now. Please try again.")
    } finally {
      setIsChecking(false)
    }
  }, [])

  const clearPincode = useCallback(() => {
    setPincodeState("")
    setDeliveryInfo(null)
    setError(null)
    localStorage.removeItem("cf_pincode")
    localStorage.removeItem("cf_delivery_info")
  }, [])

  return (
    <PincodeContext.Provider value={{ pincode, deliveryInfo, isChecking, error, setPincode, clearPincode }}>
      {children}
    </PincodeContext.Provider>
  )
}

export function usePincode() {
  const ctx = useContext(PincodeContext)
  if (!ctx) throw new Error("usePincode must be used within PincodeProvider")
  return ctx
}
