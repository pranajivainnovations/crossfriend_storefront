"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Cart, Customer } from "@medusajs/medusa"
import { CheckCircleSolid } from "@medusajs/icons"
import { Heading, Text, useToggleState } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"

import BillingAddress from "../billing_address"
import ShippingAddress from "../shipping-address"
import { setAddresses } from "../../actions"
import { SubmitButton } from "../submit-button"
import { useFormState } from "react-dom"
import ErrorMessage from "../error-message"
import compareAddresses from "@lib/util/compare-addresses"

const Addresses = ({
  cart,
  customer,
  activeStep,
}: {
  cart: Omit<Cart, "refundable_amount" | "refunded_total"> | null
  customer: Omit<Customer, "password_hash"> | null
  /** Resolved by CheckoutForm — the URL's ?step when there is one, the cart's own step otherwise. */
  activeStep: string
}) => {
  const router = useRouter()
  const pathname = usePathname()

  // India-only: fixed country code. Future: derive from [region] param.
  const countryCode = "in"

  const isOpen = activeStep === "address"

  const { state: sameAsSBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [state, formAction] = useFormState(setAddresses, null)

  // A client-side transition, not `window.location.href`. The full document reload this replaced was
  // the single slowest moment in checkout — it threw away the loaded app and re-downloaded every
  // bundle just to move between two steps of the same page. What it was guarding against was a stale
  // Router Cache entry for the review step, cached before shipping/payment existed; `setAddresses`
  // already revalidates those paths server-side before returning, and the `refresh()` below forces
  // the new route's data to come from the server regardless, so the guarantee survives without the
  // reload. `replace`, not `push`, keeps Back out of a half-submitted address form.
  useEffect(() => {
    if (state?.redirectTo) {
      router.replace(state.redirectTo)
      router.refresh()
    }
  }, [state, router])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
        >
          Shipping Address
          {!isOpen && <CheckCircleSolid />}
        </Heading>
        {!isOpen && cart?.shipping_address && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-address-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      {isOpen ? (
        <form action={formAction}>
          <div className="pb-8">
            <ShippingAddress
              customer={customer}
              countryCode={countryCode}
              checked={sameAsSBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
            />

            {!sameAsSBilling && (
              <div>
                <Heading
                  level="h2"
                  className="text-3xl-regular gap-x-4 pb-6 pt-8"
                >
                  Billing address
                </Heading>

                <BillingAddress cart={cart} countryCode={countryCode} />
              </div>
            )}
            <SubmitButton className="mt-6" data-testid="submit-address-button">Continue to review</SubmitButton>
            <ErrorMessage error={state?.error} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && cart.shipping_address ? (
              <div className="flex items-start gap-x-8">
                <div className="flex items-start gap-x-1 w-full">
                  <div className="flex flex-col w-1/3" data-testid="shipping-address-summary">
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Shipping Address
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.first_name}{" "}
                      {cart.shipping_address.last_name}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.address_1}{" "}
                      {cart.shipping_address.address_2}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.postal_code},{" "}
                      {cart.shipping_address.city}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.country_code?.toUpperCase()}
                    </Text>
                  </div>

                  <div className="flex flex-col w-1/3 " data-testid="shipping-contact-summary">
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Contact
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.phone}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.email}
                    </Text>
                  </div>

                  <div className="flex flex-col w-1/3" data-testid="billing-address-summary">
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Billing Address
                    </Text>

                    {sameAsSBilling ? (
                      <Text className="txt-medium text-ui-fg-subtle">
                        Billing- and delivery address are the same.
                      </Text>
                    ) : (
                      <>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address.first_name}{" "}
                          {cart.billing_address.last_name}
                        </Text>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address.address_1}{" "}
                          {cart.billing_address.address_2}
                        </Text>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address.postal_code},{" "}
                          {cart.billing_address.city}
                        </Text>
                        <Text className="txt-medium text-ui-fg-subtle">
                          {cart.billing_address.country_code?.toUpperCase()}
                        </Text>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Addresses
