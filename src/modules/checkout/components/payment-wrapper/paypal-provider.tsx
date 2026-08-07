"use client"

import { PayPalScriptProvider } from "@paypal/react-paypal-js"

/**
 * Everything PayPal-specific, isolated in one module so ./index.tsx can pull it in with next/dynamic
 * and keep the PayPal SDK out of the checkout bundle for stores that don't use PayPal.
 */
const PaypalProvider = ({
  currencyCode,
  children,
}: {
  currencyCode: string
  children: React.ReactNode
}) => {
  return (
    <PayPalScriptProvider
      options={{
        "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
        currency: currencyCode.toUpperCase(),
        intent: "authorize",
        components: "buttons",
      }}
    >
      {children}
    </PayPalScriptProvider>
  )
}

export default PaypalProvider
