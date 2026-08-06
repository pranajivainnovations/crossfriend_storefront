import React, { useState, useEffect, useMemo } from "react"
import { Address, Cart, Customer } from "@medusajs/medusa"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { Container } from "@medusajs/ui"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  countryCode,
}: {
  customer: Omit<Customer, "password_hash"> | null
  cart: Omit<Cart, "refundable_amount" | "refunded_total"> | null
  checked: boolean
  onChange: () => void
  countryCode: string
}) => {
  const countriesInRegion = useMemo(
    () => cart?.region.countries.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.shipping_addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.shipping_addresses, countriesInRegion]
  )

  // Returning customers shouldn't have to re-type an address they've already used — if the cart
  // doesn't have one yet, prefill from their most recently saved one instead of showing blank fields
  // and making them pick it from the dropdown below.
  const mostRecentAddress = useMemo(() => {
    if (!addressesInRegion?.length) return null
    return [...addressesInRegion].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
  }, [addressesInRegion])

  const defaultAddress = cart?.shipping_address?.address_1
    ? cart.shipping_address
    : mostRecentAddress

  // The AI Cake Studio price was calculated against the pincode the customer entered before designing
  // — it's stashed on the line item's metadata when the order is placed. If present, the postal code
  // here must match it exactly, so the field is locked instead of left editable.
  const lockedPincode = cart?.items?.find(
    (item: any) => item?.metadata?.pincode
  )?.metadata?.pincode as string | undefined

  const [formData, setFormData] = useState({
    "shipping_address.first_name": defaultAddress?.first_name || "",
    "shipping_address.last_name": defaultAddress?.last_name || "",
    "shipping_address.address_1": defaultAddress?.address_1 || "",
    "shipping_address.company": defaultAddress?.company || "",
    "shipping_address.postal_code":
      lockedPincode || defaultAddress?.postal_code || "",
    "shipping_address.city": defaultAddress?.city || "",
    "shipping_address.country_code":
      defaultAddress?.country_code || countryCode || "",
    "shipping_address.province": defaultAddress?.province || "",
    email: cart?.email || customer?.email || "",
    "shipping_address.phone": defaultAddress?.phone || "",
  })

  useEffect(() => {
    setFormData({
      "shipping_address.first_name": defaultAddress?.first_name || "",
      "shipping_address.last_name": defaultAddress?.last_name || "",
      "shipping_address.address_1": defaultAddress?.address_1 || "",
      "shipping_address.company": defaultAddress?.company || "",
      "shipping_address.postal_code":
        lockedPincode || defaultAddress?.postal_code || "",
      "shipping_address.city": defaultAddress?.city || "",
      "shipping_address.country_code": defaultAddress?.country_code || "",
      "shipping_address.province": defaultAddress?.province || "",
      email: cart?.email || customer?.email || "",
      "shipping_address.phone": defaultAddress?.phone || "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.shipping_address, cart?.email, mostRecentAddress, lockedPincode])

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
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            {`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
          </p>
          <AddressSelect addresses={customer.shipping_addresses} cart={cart} />
        </Container>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label="Last name"
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
        <Input
          label="Address"
          name="shipping_address.address_1"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="shipping-address-input"
        />
        <Input
          label="Company"
          name="shipping_address.company"
          value={formData["shipping_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="shipping-company-input"
        />
        <div className="flex flex-col">
          <Input
            label="Postal code"
            name="shipping_address.postal_code"
            autoComplete="postal-code"
            value={formData["shipping_address.postal_code"]}
            onChange={handleChange}
            required
            readOnly={!!lockedPincode}
            style={lockedPincode ? { cursor: "not-allowed", opacity: 0.7 } : undefined}
            title={
              lockedPincode
                ? "This pincode was used to price your cake and can't be changed here."
                : undefined
            }
            data-testid="shipping-postal-code-input"
          />
          {lockedPincode && (
            <span className="text-ui-fg-subtle txt-small mt-1">
              Locked — your cake&apos;s price and delivery were calculated for this pincode.
            </span>
          )}
        </div>
        <Input
          label="City"
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"]}
          onChange={handleChange}
          required
          data-testid="shipping-city-input"
        />
        <CountrySelect
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-country-select"
        />
        <Input
          label="State / Province"
          name="shipping_address.province"
          autoComplete="address-level1"
          value={formData["shipping_address.province"]}
          onChange={handleChange}
          data-testid="shipping-province-input"
        />
      </div>
      <div className="my-8">
        <Checkbox
          label="Billing address same as shipping address"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Input
          label="Email"
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        <Input
          label="Phone"
          name="shipping_address.phone"
          autoComplete="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          data-testid="shipping-phone-input"
        />
      </div>
    </>
  )
}

export default ShippingAddress
