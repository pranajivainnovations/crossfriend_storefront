import { Metadata } from "next"
import { getCustomer } from "@lib/data"
import HeroSection from "@modules/ai-cake-studio/components/hero-section"
import AiStudioSection from "@modules/ai-cake-studio/components/ai-studio-section"
import ShowcaseGallery from "@modules/ai-cake-studio/components/showcase-gallery"
import BottomCta from "@modules/ai-cake-studio/components/bottom-cta"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "AI Cake Studio | CrossFriend",
  description:
    "Design your dream cake in 60 seconds with AI and order from local verified bakers.",
  authors: [{ name: "CrossFriend" }],
  keywords: [
    "AI cake studio",
    "custom cake design",
    "cake builder",
    "local bakers",
    "bakery ready design",
  ],
  openGraph: {
    title: "AI Cake Studio | CrossFriend",
    description: "Powered by AI + Local Bakers Near You",
  },
}

export default async function AiCakeStudioPage() {
  let customer = null
  try {
    customer = await getCustomer()
  } catch {
    customer = null
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#f9f6ff] via-white to-[#fcfaff]">
      <HeroSection />
      <AiStudioSection customer={customer} />
      <ShowcaseGallery />
      <BottomCta />
    </main>
  )
}
