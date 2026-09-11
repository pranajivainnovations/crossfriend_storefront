import { Metadata } from "next"

import MarketplaceTemplate from "@modules/marketplace/templates"

/**
 * Dynamic, but not cache-hostile.
 *
 * force-dynamic is back because this page fetches catalogue data through the Medusa client and
 * touches no cookies, so without it Next prerenders it during `next build`. That works locally,
 * where MEDUSA_BACKEND_URL points at the live backend, and fails inside Docker, where it points at
 * localhost:9001 and nothing is listening — which is exactly how it broke the image build.
 *
 * fetchCache is set explicitly because force-dynamic otherwise implies `force-no-store` for every
 * fetch in the route, layouts included. That is what previously stopped getSiteSettings,
 * getAnnouncement and getTaxonomy from ever caching despite each asking for `revalidate: 60`.
 * "default-cache" keeps rendering per-request while letting those honour their own revalidate.
 */
export const dynamic = "force-dynamic"
export const fetchCache = "default-cache"

export const metadata: Metadata = {
  alternates: { canonical: "/ready-to-order" },
  title: "Ready to Order",
  description:
    "Cakes, pastries, desserts and gifts from local bakers — already made and ready to deliver. Order from verified bakeries in the areas we serve.",
  keywords: [
    "order cake online",
    "cakes near me",
    "local bakery delivery",
    "pastries online",
    "same day cake delivery",
  ],
  openGraph: {
    title: "Ready to Order",
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
