import React, { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Address, Cart, Customer } from "@medusajs/medusa"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { Container } from "@medusajs/ui"
import { usePincodeAutofill } from "../../hooks/use-pincode-autofill"

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
  //
  // Falls back to the address book unfiltered, and then to the billing address, before giving up.
  // The region filter above is right for the *dropdown* (offering an address we can't ship to is
  // pointless), but as a prefill gate it was too strict: a saved address whose country_code never got
  // set, or a region whose countries list came back empty, silently produced a blank form for a
  // customer who demonstrably has an address on file. A prefill is a suggestion in an editable field,
  // so the cost of being slightly wrong is far lower than the cost of making them type it all again.
  const mostRecentAddress = useMemo(() => {
    const pool = addressesInRegion?.length
      ? addressesInRegion
      : customer?.shipping_addresses ?? []

    const saved = [...pool]
      .filter((a) => a.address_1)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

    if (saved) return saved

    return customer?.billing_address?.address_1
      ? (customer.billing_address as Address)
      : null
  }, [addressesInRegion, customer?.shipping_addresses, customer?.billing_address])

  const defaultAddress = cart?.shipping_address?.address_1
    ? cart.shipping_address
    : mostRecentAddress

  // The AI Cake Studio price was calculated against the pincode the customer entered before designing
  // — it's stashed on the line item's metadata when the order is placed. If present, the postal code
  // here must match it exactly, so the field is locked instead of left editable.
  const lockedPincode = cart?.items?.find(
    (item: any) => item?.metadata?.pincode
  )?.metadata?.pincode as string | undefined

  // One builder for both the initial state and the effect below. They used to be two copies that had
  // drifted apart: the effect had lost the `countryCode` fallback, so it ran on mount, overwrote the
  // country the initial state had correctly defaulted to, and left the select sitting on its
  // placeholder for every customer without a saved address — which is every new customer.
  const buildFormData = useCallback(
    () => ({
      "shipping_address.first_name":
        defaultAddress?.first_name || customer?.first_name || "",
      "shipping_address.last_name":
        defaultAddress?.last_name || customer?.last_name || "",
      "shipping_address.address_1": defaultAddress?.address_1 || "",
      "shipping_address.company": defaultAddress?.company || "",
      "shipping_address.postal_code":
        lockedPincode || defaultAddress?.postal_code || "",
      "shipping_address.city": defaultAddress?.city || "",
      "shipping_address.country_code":
        defaultAddress?.country_code || countryCode || "",
      "shipping_address.province": defaultAddress?.province || "",
      email: cart?.email || customer?.email || "",
      "shipping_address.phone": defaultAddress?.phone || customer?.phone || "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultAddress, customer, cart?.email, lockedPincode, countryCode]
  )

  const [formData, setFormData] = useState(buildFormData)

  useEffect(() => {
    setFormData(buildFormData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.shipping_address, cart?.email, mostRecentAddress, lockedPincode])

  // City and State are determined by the pincode, so we fill them rather than asking twice. Anything
  // the customer typed themselves wins — we only write into a field that's empty or still holds our
  // own previous suggestion, so correcting the city sticks even if the lookup answers again later.
  const autofilledRef = useRef<{ city: string; province: string }>({
    city: "",
    province: "",
  })

  const applyPincodeArea = useCallback(
    ({ city, state }: { city: string; state: string }) => {
      setFormData((prev) => {
        const next = { ...prev }

        const cityIsOurs =
          !prev["shipping_address.city"] ||
          prev["shipping_address.city"] === autofilledRef.current.city
        if (city && cityIsOurs) {
          next["shipping_address.city"] = city
          autofilledRef.current.city = city
        }

        const provinceIsOurs =
          !prev["shipping_address.province"] ||
          prev["shipping_address.province"] === autofilledRef.current.province
        if (state && provinceIsOurs) {
          next["shipping_address.province"] = state
          autofilledRef.current.province = state
        }

        return next
      })
    },
    []
  )

  const pincodeStatus = usePincodeAutofill(
    formData["shipping_address.postal_code"],
    applyPincodeArea
  )

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

  // Nothing in checkout ever wrote to the customer's address book — Medusa only fills it from the
  // account pages — so the prefill above had nothing to read and every order started from a blank
  // form, however many times that customer had ordered before. This tells the server action to save
  // it, and the comparison here means we ask only when it's genuinely a new address, keeping the
  // extra write off the path for everyone who's just reusing one.
  const isNewAddress = useMemo(() => {
    const line = formData["shipping_address.address_1"].trim().toLowerCase()
    const pin = formData["shipping_address.postal_code"].trim()

    if (!customer || !line || !pin) return false

    return !customer.shipping_addresses?.some(
      (a) =>
        (a.address_1 || "").trim().toLowerCase() === line &&
        (a.postal_code || "").trim() === pin
    )
  }, [
    customer,
    formData["shipping_address.address_1"],
    formData["shipping_address.postal_code"],
  ])

  return (
    <>
      <input type="hidden" name="save_address" value={isNewAddress ? "1" : ""} />
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
          {lockedPincode ? (
            <span className="text-ui-fg-subtle txt-small mt-1">
              Locked — your cake&apos;s price and delivery were calculated for this pincode.
            </span>
          ) : pincodeStatus === "resolving" ? (
            <span className="text-ui-fg-subtle txt-small mt-1">
              Looking up your city and state…
            </span>
          ) : pincodeStatus === "unknown" ? (
            <span className="text-ui-fg-subtle txt-small mt-1">
              We couldn&apos;t recognise that pincode — please fill in city and state yourself.
            </span>
          ) : pincodeStatus === "resolved" ? (
            <span className="text-ui-fg-subtle txt-small mt-1">
              City and state filled in from your pincode — edit them if they&apos;re wrong.
            </span>
          ) : null}
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
