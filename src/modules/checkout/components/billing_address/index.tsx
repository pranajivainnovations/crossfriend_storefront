import React, { useState, useEffect, useCallback, useRef } from "react"
import Input from "@modules/common/components/input"
import CountrySelect from "../country-select"
import { Cart } from "@medusajs/medusa"
import { usePincodeAutofill } from "../../hooks/use-pincode-autofill"

const BillingAddress = ({
  cart,
  countryCode,
}: {
  cart: Omit<Cart, "refundable_amount" | "refunded_total"> | null
  countryCode: string
}) => {
  // Single builder for the initial state and the effect below — see the same note in
  // ../shipping-address: keeping two copies is how the effect lost the `countryCode` fallback and
  // reset the country select to its placeholder on mount.
  const buildFormData = useCallback(
    () => ({
      "billing_address.first_name": cart?.billing_address?.first_name || "",
      "billing_address.last_name": cart?.billing_address?.last_name || "",
      "billing_address.address_1": cart?.billing_address?.address_1 || "",
      "billing_address.company": cart?.billing_address?.company || "",
      "billing_address.postal_code": cart?.billing_address?.postal_code || "",
      "billing_address.city": cart?.billing_address?.city || "",
      "billing_address.country_code":
        cart?.billing_address?.country_code || countryCode || "",
      "billing_address.province": cart?.billing_address?.province || "",
      "billing_address.phone": cart?.billing_address?.phone || "",
    }),
    [cart?.billing_address, countryCode]
  )

  const [formData, setFormData] = useState(buildFormData)

  useEffect(() => {
    setFormData(buildFormData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.billing_address])

  // City and State come from the pincode here too; the customer's own edits always win.
  const autofilledRef = useRef<{ city: string; province: string }>({
    city: "",
    province: "",
  })

  const applyPincodeArea = useCallback(
    ({ city, state }: { city: string; state: string }) => {
      setFormData((prev) => {
        const next = { ...prev }

        const cityIsOurs =
          !prev["billing_address.city"] ||
          prev["billing_address.city"] === autofilledRef.current.city
        if (city && cityIsOurs) {
          next["billing_address.city"] = city
          autofilledRef.current.city = city
        }

        const provinceIsOurs =
          !prev["billing_address.province"] ||
          prev["billing_address.province"] === autofilledRef.current.province
        if (state && provinceIsOurs) {
          next["billing_address.province"] = state
          autofilledRef.current.province = state
        }

        return next
      })
    },
    []
  )

  usePincodeAutofill(formData["billing_address.postal_code"], applyPincodeArea)

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          name="billing_address.first_name"
          autoComplete="given-name"
          value={formData["billing_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="billing-first-name-input"
        />
        <Input
          label="Last name"
          name="billing_address.last_name"
          autoComplete="family-name"
          value={formData["billing_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="billing-last-name-input"
        />
        <Input
          label="Address"
          name="billing_address.address_1"
          autoComplete="address-line1"
          value={formData["billing_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="billing-address-input"
        />
        <Input
          label="Company"
          name="billing_address.company"
          value={formData["billing_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="billing-company-input"
        />
        <Input
          label="Postal code"
          name="billing_address.postal_code"
          autoComplete="postal-code"
          value={formData["billing_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="billing-postal-input"
        />
        <Input
          label="City"
          name="billing_address.city"
          autoComplete="address-level2"
          value={formData["billing_address.city"]}
          onChange={handleChange}
          required
          data-testid="billing-city-input"
        />
        <CountrySelect
          name="billing_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["billing_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="billing-country-select"
        />
        <Input
          label="State / Province"
          name="billing_address.province"
          autoComplete="address-level1"
          value={formData["billing_address.province"]}
          onChange={handleChange}
          data-testid="billing-province-input"
        />
        <Input
          label="Phone"
          name="billing_address.phone"
          autoComplete="tel"
          value={formData["billing_address.phone"]}
          onChange={handleChange}
          data-testid="billing-phone-input"
        />
      </div>
    </>
  )
}

export default BillingAddress
