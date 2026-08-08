import { Metadata } from "next"

import MarketplaceTemplate from "@modules/marketplace/templates"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ready to Order",
  description:
    "Cakes, pastries, desserts and gifts from local bakers — already made and ready to deliver. Order from verified bakeries near you.",
  keywords: [
    "order cake online",
    "cakes near me",
    "local bakery delivery",
    "pastries online",
    "same day cake delivery",
  ],
  openGraph: {
    title: "Ready to Order | CrossFriend",
    description: "Cakes and treats from local bakers, ready to deliver.",
  },
}

export default async function ReadyToOrderPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = Math.max(parseInt(searchParams.page || "1", 10) || 1, 1)
  return <MarketplaceTemplate page={page} />
}
