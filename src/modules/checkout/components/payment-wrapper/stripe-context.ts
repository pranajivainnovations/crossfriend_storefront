"use client"

import { createContext } from "react"

/**
 * Lives in its own module, separate from the wrapper that provides it, so that consumers can read
 * the context without pulling the Stripe SDK into their bundle. The wrapper is dynamically imported
 * (see ./index.tsx) — importing the context from there would defeat that.
 */
export const StripeContext = createContext(false)
