"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { OccasionCollection } from "@lib/types/product-contract"

export type BudgetRange = {
  label: string
  min: number
  max: number | null // null = no upper limit
}

export const BUDGET_RANGES: BudgetRange[] = [
  { label: "Under ₹1,000", min: 0, max: 100000 },       // in paise: ₹1000
  { label: "₹1,000 – ₹2,500", min: 100000, max: 250000 },
  { label: "₹2,500 – ₹5,000", min: 250000, max: 500000 },
  { label: "₹5,000+", min: 500000, max: null },
]

type WizardStep = "occasion" | "budget" | "results"

interface PlanningState {
  isOpen: boolean
  step: WizardStep
  occasion: OccasionCollection | null
  budget: BudgetRange | null
}

interface PlanningActions {
  open: () => void
  close: () => void
  selectOccasion: (occasion: OccasionCollection) => void
  selectBudget: (budget: BudgetRange | null) => void
  skipBudget: () => void
  goBack: () => void
  reset: () => void
}

type PlanningContextValue = PlanningState & PlanningActions

const PlanningContext = createContext<PlanningContextValue | null>(null)

const INITIAL_STATE: PlanningState = {
  isOpen: false,
  step: "occasion",
  occasion: null,
  budget: null,
}

export function PlanningProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlanningState>(INITIAL_STATE)

  const open = useCallback(() => {
    setState({ ...INITIAL_STATE, isOpen: true })
  }, [])

  const close = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }))
  }, [])

  const reset = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  const selectOccasion = useCallback((occasion: OccasionCollection) => {
    setState((s) => ({ ...s, occasion, step: "budget" }))
  }, [])

  const selectBudget = useCallback((budget: BudgetRange | null) => {
    setState((s) => ({ ...s, budget, step: "results" }))
  }, [])

  const skipBudget = useCallback(() => {
    setState((s) => ({ ...s, budget: null, step: "results" }))
  }, [])

  const goBack = useCallback(() => {
    setState((s) => {
      if (s.step === "results") return { ...s, step: "budget" }
      if (s.step === "budget") return { ...s, step: "occasion", occasion: null }
      return s
    })
  }, [])

  return (
    <PlanningContext.Provider
      value={{ ...state, open, close, reset, selectOccasion, selectBudget, skipBudget, goBack }}
    >
      {children}
    </PlanningContext.Provider>
  )
}

export function usePlanning() {
  const ctx = useContext(PlanningContext)
  if (!ctx) throw new Error("usePlanning must be used within PlanningProvider")
  return ctx
}
