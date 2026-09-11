import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getOccasions, getOccasionBySlug } from "@lib/data/dynamic"
import OccasionTemplate from "@modules/occasions/templates/occasion-template"

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

type Props = {
  params: { occasion: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const occasion = await getOccasionBySlug(params.occasion)
  if (!occasion) return {}

  const title = `${occasion.label} Celebration`
  const description = `${occasion.tagline} — shop cakes, decorations, gifts & more for your ${occasion.label.toLowerCase()} celebration.`

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/occasions/${params.occasion}` },
  }
}

export default async function OccasionPage({ params }: Props) {
  const occasion = await getOccasionBySlug(params.occasion)

  if (!occasion) {
    notFound()
  }

  return <OccasionTemplate occasion={occasion} />
}
