"use client"

import { Popover, Transition } from "@headlessui/react"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Region } from "@medusajs/medusa"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import { OCCASIONS, PRODUCT_TYPE_LABELS } from "@lib/constants"
import type { ProductType } from "@lib/types/product-contract"
import { usePlanning } from "@modules/planning/context/planning-context"

const SideMenuItems = {
  Home: "/",
  Store: "/store",
  Search: "/search",
  Account: "/account",
  Cart: "/cart",
}

const SideMenu = ({ regions }: { regions: Region[] | null }) => {
  const toggleState = useToggleState()
  const planning = usePlanning()

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button data-testid="nav-menu-button" className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:text-ui-fg-base">
                  Menu
                </Popover.Button>
              </div>

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100 backdrop-blur-2xl"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 backdrop-blur-2xl"
                leaveTo="opacity-0"
              >
                <Popover.Panel className="flex flex-col absolute w-full pr-4 sm:pr-0 sm:w-1/3 2xl:w-1/4 sm:min-w-min h-[calc(100vh-1rem)] z-30 inset-x-0 text-sm text-ui-fg-on-color m-2 backdrop-blur-2xl">
                  <div data-testid="nav-menu-popup" className="flex flex-col h-full bg-[rgba(3,7,18,0.5)] rounded-rounded justify-between p-6 overflow-y-auto">
                    <div className="flex justify-end" id="xmark">
                      <button data-testid="close-menu-button" onClick={close}>
                        <XMark />
                      </button>
                    </div>

                    {/* Start Planning CTA */}
                    <button
                      className="mb-6 py-3 px-5 rounded-full text-center font-heading font-semibold text-white bg-gradient-to-r from-cf-orange to-cf-pink hover:opacity-90 transition-opacity"
                      onClick={() => {
                        close()
                        planning.open()
                      }}
                    >
                      🎉 Start Planning
                    </button>

                    {/* Occasions */}
                    <div className="mb-6">
                      <span className="text-xs uppercase tracking-wider text-ui-fg-muted mb-3 block">
                        Occasions
                      </span>
                      <ul className="flex flex-col gap-3">
                        {OCCASIONS.map((occasion) => (
                          <li key={occasion.slug}>
                            <LocalizedClientLink
                              href={`/occasions/${occasion.slug}`}
                              className="text-xl leading-8 hover:text-ui-fg-disabled flex items-center gap-3"
                              onClick={close}
                            >
                              <span>{occasion.emoji}</span>
                              {occasion.label}
                            </LocalizedClientLink>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Categories */}
                    <div className="mb-6">
                      <span className="text-xs uppercase tracking-wider text-ui-fg-muted mb-3 block">
                        Categories
                      </span>
                      <ul className="flex flex-col gap-3">
                        {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map(
                          (type) => {
                            const item = PRODUCT_TYPE_LABELS[type]
                            return (
                              <li key={type}>
                                <LocalizedClientLink
                                  href={item.href}
                                  className="text-xl leading-8 hover:text-ui-fg-disabled flex items-center gap-3"
                                  onClick={close}
                                >
                                  <span>{item.emoji}</span>
                                  {item.label}
                                </LocalizedClientLink>
                              </li>
                            )
                          }
                        )}
                      </ul>
                    </div>

                    {/* Standard links */}
                    <ul className="flex flex-col gap-4 items-start justify-start mb-auto">
                      {Object.entries(SideMenuItems).map(([name, href]) => (
                        <li key={name}>
                          <LocalizedClientLink
                            href={href}
                            className="text-2xl leading-10 hover:text-ui-fg-disabled"
                            onClick={close}
                            data-testid={`${name.toLowerCase()}-link`}
                          >
                            {name}
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-col gap-y-6">
                      <div
                        className="flex justify-between"
                        onMouseEnter={toggleState.open}
                        onMouseLeave={toggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={toggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150",
                            toggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small">
                        © {new Date().getFullYear()} CrossFriend. All rights
                        reserved.
                      </Text>
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
