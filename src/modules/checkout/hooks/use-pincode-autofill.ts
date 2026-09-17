"use client"

import { useEffect, useRef, useState } from "react"
import { capturePincode } from "@lib/pincode-capture"

export interface ResolvedArea {
  city: string
  state: string
}

export type PincodeAutofillStatus = "idle" | "resolving" | "resolved" | "unknown"

/**
 * Fills City and State from the pincode the customer already typed.
 *
 * Resolution comes from /api/pincode/lookup, which reads the India Post directory we already hold
 * in baker_network.pincode_directory — the same table baker matching uses. One source of truth, and
 * no third-party call sitting in the middle of a checkout form.
 *
 * `onResolved` fires only for a genuinely new pincode — never on re-render, and never twice for the
 * same value — so a customer who corrects the city by hand keeps their correction. Deciding whether
 * an incoming suggestion may overwrite what's in the field is the caller's job; this hook only
 * reports. A failed or unrecognised lookup leaves both fields alone: they're ordinary editable
 * inputs, so the form stays submittable either way.
 */
export function usePincodeAutofill(
  pincode: string,
  onResolved: (area: ResolvedArea) => void
): PincodeAutofillStatus {
  const [status, setStatus] = useState<PincodeAutofillStatus>("idle")

  // Held in a ref so a caller that passes an inline arrow function doesn't re-trigger the lookup on
  // every render — the effect depends on the pincode alone.
  const onResolvedRef = useRef(onResolved)
  onResolvedRef.current = onResolved

  // The last pincode we actually resolved, so re-renders don't re-apply a suggestion over an edit
  // the customer has since made.
  const lastResolvedRef = useRef<string | null>(null)

  useEffect(() => {
    const pin = (pincode || "").trim()

    if (!/^\d{6}$/.test(pin)) {
      setStatus("idle")
      return
    }

    if (lastResolvedRef.current === pin) {
      return
    }
    lastResolvedRef.current = pin
    setStatus("resolving")

    /**
     * The fourth and last place a customer tells us where they are.
     *
     * Recorded the moment the field holds a real pincode, before the area lookup comes back — the
     * lookup answers a different question (which city is this) and a customer whose area we cannot
     * name has still told us their pincode. Safe to call repeatedly; it grants at most once.
     */
    capturePincode(pin)

    const controller = new AbortController()

    fetch(`/api/pincode/lookup?pincode=${pin}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (controller.signal.aborted) {
          return
        }
        if (json?.success && json.data?.state) {
          onResolvedRef.current({
            city: json.data.city || "",
            state: json.data.state,
          })
          setStatus("resolved")
        } else {
          setStatus("unknown")
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus("unknown")
        }
      })

    return () => controller.abort()
  }, [pincode])

  return status
}
