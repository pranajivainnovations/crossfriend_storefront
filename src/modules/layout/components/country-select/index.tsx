"use client"

import { Region } from "@medusajs/medusa"
import ReactCountryFlag from "react-country-flag"

import { StateType } from "@lib/hooks/use-toggle-state"

type CountrySelectProps = {
  toggleState: StateType
  regions: Region[]
}

/**
 * India-only storefront — simplified country display.
 * Future: Replace with city/area selector when [region] routing is added.
 */
const CountrySelect = ({ toggleState, regions }: CountrySelectProps) => {
  return (
    <div>
      <div className="py-1 w-full">
        <div className="txt-compact-small flex items-start gap-x-2">
          <span>Shipping to:</span>
          <span className="txt-compact-small flex items-center gap-x-2">
            <ReactCountryFlag
              svg
              style={{
                width: "16px",
                height: "16px",
              }}
              countryCode="IN"
            />
            India
          </span>
        </div>
      </div>
    </div>
  )
}

export default CountrySelect
