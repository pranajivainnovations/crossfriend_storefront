"use client"

import { usePlanning } from "@modules/planning/context/planning-context"

export default function PlanningTrigger({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { open } = usePlanning()
  return (
    <button onClick={open} className={className}>
      {children}
    </button>
  )
}
