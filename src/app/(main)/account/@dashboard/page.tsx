import { Metadata } from "next"

import { getCustomer, listCustomerOrders } from "@lib/data"
import { getWallet } from "@lib/data/wallet"
import { getReferral } from "@lib/data/referral"
import Overview from "@modules/account/components/overview"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Account",
  description: "Overview of your account activity.",
}

export default async function OverviewTemplate() {
  /* Fetched together: four independent reads, and making them wait on each other would add three
     round trips to the page a signed-in customer lands on most often. */
  const [customer, orders, wallet, referral] = await Promise.all([
    getCustomer().catch(() => null),
    listCustomerOrders().catch(() => null),
    getWallet().catch(() => null),
    getReferral().catch(() => null),
  ])

  if (!customer) {
    notFound()
  }

  return (
    <Overview
      customer={customer}
      orders={orders ?? null}
      wallet={wallet}
      referral={referral}
    />
  )
}
