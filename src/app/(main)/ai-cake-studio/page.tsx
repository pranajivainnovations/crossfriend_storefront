import { Metadata } from "next"
import { getCustomer } from "@lib/data"
import { STUDIO_FAQ } from "@lib/constants/faq"
import {
  ORGANIZATION_ID,
  absoluteUrl,
  breadcrumbJsonLd,
  faqJsonLd,
  jsonLdScriptProps,
} from "@lib/util/seo"
import FaqSection from "@modules/common/components/faq-section"
import HeroSection from "@modules/ai-cake-studio/components/hero-section"
import AiStudioSection from "@modules/ai-cake-studio/components/ai-studio-section"
import ShowcaseGallery from "@modules/ai-cake-studio/components/showcase-gallery"
import BottomCta from "@modules/ai-cake-studio/components/bottom-cta"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  alternates: { canonical: "/ai-cake-studio" },
  title: "AI Cake Studio",
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
    title: "AI Cake Studio",
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

  /**
   * Until now this page carried a title and nothing else machine-readable. A crawler — and more to
   * the point, an answer engine deciding what to say when someone asks "can I design a cake with
   * AI?" — saw a generic web page. The most differentiated thing CrossFriend has was invisible to
   * exactly the systems we want to be found by.
   *
   * SoftwareApplication says what the tool IS and that it costs nothing to use; the zero-price
   * Offer is the property that makes "free" a fact rather than marketing copy. Service says what
   * CrossFriend DOES with it, and ties the tool to a real provider and a real area.
   */
  const studioUrl = absoluteUrl("/ai-cake-studio")

  const applicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${studioUrl}#application`,
    name: "CrossFriend AI Cake Studio",
    url: studioUrl,
    applicationCategory: "DesignApplication",
    applicationSubCategory: "AI cake design",
    operatingSystem: "Any — runs in a web browser",
    description:
      "A free browser-based tool that turns a written description into a cake design. Choose occasion, flavour, style, shape, weight and tiers, see a live price estimate for your pincode, and order the result from a local baker.",
    // Free to use. Ordering the cake is a separate, priced transaction.
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "Generate a cake design from a written description",
      "Choose from 9 flavours, 4 shapes and 7 design styles",
      "Cakes from 0.5 kg to 5 kg and 1 to 4 tiers",
      "Live price estimate based on your delivery pincode",
      "Browse and reuse designs made by other people",
      "Order the design from a verified local baker",
    ],
    isAccessibleForFree: true,
    inLanguage: "en-IN",
    publisher: { "@id": ORGANIZATION_ID },
  }

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${studioUrl}#service`,
    name: "Custom AI cake design and delivery",
    serviceType: "Custom cake design and delivery",
    url: studioUrl,
    provider: { "@id": ORGANIZATION_ID },
    areaServed: { "@type": "Country", name: "India" },
    description:
      "Design a custom cake with AI and have it baked and delivered by an independent local bakery on CrossFriend.",
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#f9f6ff] via-white to-[#fcfaff]">
      <script {...jsonLdScriptProps([applicationJsonLd, serviceJsonLd])} />
      <script {...jsonLdScriptProps(faqJsonLd(STUDIO_FAQ))} />
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "AI Cake Studio", path: "/ai-cake-studio" },
          ])
        )}
      />

      <HeroSection />
      <AiStudioSection customer={customer} />
      <ShowcaseGallery customer={customer} />
      {/* The answers must render, not just appear in the markup above. */}
      <FaqSection entries={STUDIO_FAQ} title="Questions about the AI Cake Studio" />
      <BottomCta />
    </main>
  )
}
