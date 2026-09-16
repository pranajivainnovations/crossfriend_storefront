import { Metadata } from "next"

import { getCustomer, listCustomerOrders } from "@lib/data"
import { getWallet } from "@lib/data/wallet"
import Overview from "@modules/account/components/overview"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Account",
  description: "Overview of your account activity.",
}

export default async function OverviewTemplate() {
  /* Fetched together: three independent reads, and making them wait on each other would add two
     round trips to the page a signed-in customer lands on most often. */
  const [customer, orders, wallet] = await Promise.all([
    getCustomer().catch(() => null),
    listCustomerOrders().catch(() => null),
    getWallet().catch(() => null),
  ])

  if (!customer) {
    notFound()
  }

  return <Overview customer={customer} orders={orders ?? null} wallet={wallet} />
}
