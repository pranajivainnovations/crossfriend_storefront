import { Customer } from "@medusajs/medusa"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import WalletCard from "@modules/account/components/wallet-card"
import ReferralCard from "@modules/account/components/referral-card"
import type { Wallet } from "@lib/data/wallet"
import type { Referral } from "@lib/data/referral"
import type { OrderSummary } from "@lib/data/orders-cart"
import { rupees } from "@lib/money"

/** The customer's words for each step, matching the account list and the order page. */
const ORDER_STEP: Record<string, string> = {
  placed: "Finding a baker",
  accepted: "Baker assigned",
  making: "Being made",
  out_for_delivery: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

type OverviewProps = {
  customer: Omit<Customer, "password_hash"> | null
  orders: OrderSummary[] | null
  wallet?: Wallet | null
  referral?: Referral | null
}

const Overview = ({ customer, orders, wallet, referral }: OverviewProps) => {
  return (
    <div data-testid="overview-page-wrapper">
      {/**
       * Outside the desktop-only block below, deliberately.
       *
       * Everything else on this page is wrapped in `hidden small:block`, because on a phone the
       * account route shows the navigation list and not a dashboard. Leaving these two inside it
       * meant a customer's credit and their referral code existed only on a desktop — on a storefront
       * whose customers are almost entirely on phones, which is to say they existed almost nowhere.
       *
       * Money the customer holds comes first, then the invitation: what they already have outranks
       * what they could earn by doing something for us.
       */}
      {(wallet || referral) && (
        <div className="mb-6 mt-6 flex flex-col gap-6">
          {wallet && <WalletCard wallet={wallet} />}
          {referral && <ReferralCard referral={referral} />}
        </div>
      )}

      <div className="hidden small:block">
        <div className="text-xl-semi flex justify-between items-center mb-4">
          <span data-testid="welcome-message" data-value={customer?.first_name}>Hello {customer?.first_name}</span>
          <span className="text-small-regular text-ui-fg-base">
            Signed in as:{" "}
            <span className="font-semibold" data-testid="customer-email" data-value={customer?.email}>{customer?.email}</span>
          </span>
        </div>

        <div className="flex flex-col py-8 border-t border-gray-200">
          <div className="flex flex-col gap-y-4 h-full col-span-1 row-span-2 flex-1">
            <div className="flex items-start gap-x-16 mb-6">
              <div className="flex flex-col gap-y-4">
                <h3 className="text-large-semi">Profile</h3>
                <div className="flex items-end gap-x-2">
                  <span className="text-3xl-semi leading-none" data-testid="customer-profile-completion" data-value={getProfileCompletion(customer)}>
                    {getProfileCompletion(customer)}%
                  </span>
                  <span className="uppercase text-base-regular text-ui-fg-subtle">
                    Completed
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-y-4">
                <h3 className="text-large-semi">Addresses</h3>
                <div className="flex items-end gap-x-2">
                  <span className="text-3xl-semi leading-none" data-testid="addresses-count" data-value={customer?.shipping_addresses?.length || 0}>
                    {customer?.shipping_addresses?.length || 0}
                  </span>
                  <span className="uppercase text-base-regular text-ui-fg-subtle">
                    Saved
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-y-4">
              <div className="flex items-center gap-x-2">
                <h3 className="text-large-semi">Recent orders</h3>
              </div>
              <ul className="flex flex-col gap-y-3" data-testid="orders-wrapper">
                {orders && orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => (
                    <li key={order.id} data-testid="order-wrapper" data-value={order.id}>
                      <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="font-mono text-sm font-semibold tabular-nums text-slate-900"
                                data-testid="order-id"
                                data-value={order.displayId}
                              >
                                #{order.displayId}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                                {ORDER_STEP[order.status] ?? order.status}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-sm text-slate-600">
                              {order.titles.join(", ")}
                            </p>
                            <p
                              className="mt-0.5 text-xs text-slate-400"
                              data-testid="order-created-date"
                            >
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <span
                            className="shrink-0 text-sm font-semibold tabular-nums text-slate-900"
                            data-testid="order-amount"
                          >
                            {rupees(order.payablePaise)}
                          </span>
                        </div>
                      </LocalizedClientLink>
                    </li>
                  ))
                ) : (
                  <span data-testid="no-orders-message">No recent orders</span>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const getProfileCompletion = (
  customer: Omit<Customer, "password_hash"> | null
) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  if (customer.billing_address) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
