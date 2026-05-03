import { Metadata } from "next"
import { notFound } from "next/navigation"
import { OCCASION_MAP, OCCASIONS } from "@lib/constants"
import type { OccasionCollection } from "@lib/types/product-contract"
import OccasionTemplate from "@modules/occasions/templates/occasion-template"

type Props = {
  params: { occasion: string }
}

export async function generateStaticParams() {
  return OCCASIONS.map((o) => ({ occasion: o.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = OCCASION_MAP[params.occasion as OccasionCollection]
  if (!config) return {}

  const title = `${config.label} Celebration | CrossFriend`
  const description = `${config.tagline} — shop cakes, decorations, gifts & more for your ${config.label.toLowerCase()} celebration.`

  return {
    title,
    description,
    openGraph: { title, description },
  }
}

export default function OccasionPage({ params }: Props) {
  const config = OCCASION_MAP[params.occasion as OccasionCollection]

  if (!config) {
    notFound()
  }

  return <OccasionTemplate occasion={config} />
}
