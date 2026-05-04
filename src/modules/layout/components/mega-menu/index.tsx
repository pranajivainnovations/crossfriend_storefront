"use client"

import { Popover, Transition } from "@headlessui/react"
import { ChevronDownMini } from "@medusajs/icons"
import { Fragment } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { DynamicOccasion, DynamicProductType } from "@lib/data/dynamic"

export default function MegaMenu({
  occasions,
  productTypes,
}: {
  occasions: DynamicOccasion[]
  productTypes: DynamicProductType[]
}) {
  return (
    <Popover className="relative h-full flex items-center">
      {({ open, close }) => (
        <>
          <Popover.Button className="flex items-center gap-1 h-full text-sm font-medium text-ui-fg-subtle hover:text-ui-fg-base focus:outline-none transition-colors">
            Shop
            <ChevronDownMini
              className={`w-4 h-4 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 -translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-1"
          >
            <Popover.Panel className="absolute left-1/2 -translate-x-1/2 top-full mt-0 w-[640px] z-50">
              <div className="bg-white rounded-b-2xl shadow-lg border border-ui-border-base overflow-hidden">
                <div className="grid grid-cols-2 gap-0">
                  {/* Left column — Occasions */}
                  <div className="p-6 border-r border-ui-border-base">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ui-fg-muted mb-4">
                      Shop by Occasion
                    </h3>
                    <ul className="space-y-1">
                      {occasions.map((occasion) => (
                        <li key={occasion.slug}>
                          <LocalizedClientLink
                            href={`/occasions/${occasion.slug}`}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cf-warm transition-colors group"
                            onClick={close}
                          >
                            <span className="text-xl" role="img" aria-label={occasion.label}>
                              {occasion.emoji}
                            </span>
                            <div>
                              <span className="text-sm font-medium text-ui-fg-base group-hover:text-cf-orange transition-colors">
                                {occasion.label}
                              </span>
                              <p className="text-xs text-ui-fg-muted">
                                {occasion.tagline}
                              </p>
                            </div>
                          </LocalizedClientLink>
                        </li>
                      ))}
                      <li>
                        <LocalizedClientLink
                          href="/occasions"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cf-warm transition-colors text-sm font-medium text-cf-orange"
                          onClick={close}
                        >
                          View All Occasions →
                        </LocalizedClientLink>
                      </li>
                    </ul>
                  </div>

                  {/* Right column — Product types */}
                  <div className="p-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ui-fg-muted mb-4">
                      Shop by Category
                    </h3>
                    <ul className="space-y-1">
                      {productTypes.map((item) => (
                        <li key={item.value}>
                          <LocalizedClientLink
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cf-warm transition-colors group"
                            onClick={close}
                          >
                            <span className="text-xl" role="img" aria-label={item.label}>
                              {item.emoji}
                            </span>
                            <span className="text-sm font-medium text-ui-fg-base group-hover:text-cf-orange transition-colors">
                              {item.label}
                            </span>
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </ul>

                    {/* Start Planning CTA inside mega-menu */}
                    <div className="mt-6 pt-4 border-t border-ui-border-base">
                      <LocalizedClientLink
                        href="/?planning=true"
                        className="btn-cf-primary block text-center text-sm"
                        onClick={close}
                      >
                        🎉 Start Planning
                      </LocalizedClientLink>
                    </div>
                  </div>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )
}
