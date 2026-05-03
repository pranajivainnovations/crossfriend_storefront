"use client"

import { Dialog, Transition } from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { Fragment } from "react"

import { usePlanning } from "@modules/planning/context/planning-context"
import StepOccasion from "@modules/planning/components/step-occasion"
import StepBudget from "@modules/planning/components/step-budget"
import StepResults from "@modules/planning/components/step-results"

const STEP_TITLES: Record<string, string> = {
  occasion: "Step 1 of 3",
  budget: "Step 2 of 3",
  results: "Step 3 of 3",
}

export default function PlanningWizard() {
  const { isOpen, close, step } = usePlanning()

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={close}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-cf-warm rounded-2xl shadow-xl p-5 small:p-8">
                {/* Close button */}
                <button
                  onClick={close}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-grey-10 transition-colors"
                >
                  <XMark className="w-5 h-5 text-ui-fg-muted" />
                </button>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-xs font-medium text-ui-fg-muted">
                    {STEP_TITLES[step]}
                  </span>
                  <div className="flex gap-1.5">
                    {["occasion", "budget", "results"].map((s) => (
                      <div
                        key={s}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          s === step
                            ? "w-6 bg-cf-orange"
                            : "w-1.5 bg-grey-20"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Step content with transitions */}
                <div className="min-h-[240px] small:min-h-[300px] flex items-start justify-center">
                  {step === "occasion" && <StepOccasion />}
                  {step === "budget" && <StepBudget />}
                  {step === "results" && <StepResults />}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
