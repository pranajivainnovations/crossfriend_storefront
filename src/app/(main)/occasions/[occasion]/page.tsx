import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getOccasions, getOccasionBySlug } from "@lib/data/dynamic"
import OccasionTemplate from "@modules/occasions/templates/occasion-template"

export const dynamic = "force-dynamic"

type Props = {
  params: { occasion: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const occasion = await getOccasionBySlug(params.occasion)
  if (!occasion) return {}

  const title = `${occasion.label} Celebration | CrossFriend`
  const description = `${occasion.tagline} — shop cakes, decorations, gifts & more for your ${occasion.label.toLowerCase()} celebration.`

  return {
    title,
    description,
    openGraph: { title, description },
  }
}

export default async function OccasionPage({ params }: Props) {
  const occasion = await getOccasionBySlug(params.occasion)

  if (!occasion) {
    notFound()
  }

  return <OccasionTemplate occasion={occasion} />
}
