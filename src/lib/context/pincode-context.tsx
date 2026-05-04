"use client"
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

export interface DeliveryInfo {
  available: boolean
  estimatedDays: number
  sameDayAvailable: boolean
  city: string
  area: string
}

interface PincodeContextType {
  pincode: string
  deliveryInfo: DeliveryInfo | null
  isChecking: boolean
  error: string | null
  setPincode: (code: string) => Promise<void>
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
        try { setDeliveryInfo(JSON.parse(savedInfo)) } catch {}
      }
    }
  }, [])

  const setPincode = useCallback(async (code: string) => {
    const trimmed = code.trim()
    if (!/^\d{6}$/.test(trimmed)) {
      setError("Please enter a valid 6-digit pincode")
      return
    }

    setIsChecking(true)
    setError(null)

    try {
      const res = await fetch(`/api/pincode/check?pincode=${trimmed}`)
      const data = await res.json()

      if (data.success && data.data) {
        setPincodeState(trimmed)
        setDeliveryInfo(data.data)
        localStorage.setItem("cf_pincode", trimmed)
        localStorage.setItem("cf_delivery_info", JSON.stringify(data.data))
        setError(null)
      } else {
        setError(data.error || "Delivery not available for this pincode")
        setDeliveryInfo(null)
      }
    } catch {
      setError("Unable to check delivery availability. Please try again.")
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
