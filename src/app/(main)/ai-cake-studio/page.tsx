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
  // og:url and og:image were both absent. In India the practical consequence is WhatsApp: a shared
  // link with no image renders as a bare grey row, and this is the page most likely to be shared.
  // The image is a real file in public/ — never point og:image at a path that 404s, because the
  // preview silently falls back to nothing and nobody notices.
  openGraph: {
    title: "AI Cake Studio — Design Your Cake with AI",
    description:
      "Describe the cake you want and see it designed in seconds. Pick flavour, style, shape and size, get a price for your pincode, and order from a verified local baker.",
    url: absoluteUrl("/ai-cake-studio"),
    siteName: "CrossFriend",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: absoluteUrl("/ai-cake-studio/hero/hero-cake.jpg"),
        width: 1200,
        height: 630,
        alt: "A custom cake designed in the CrossFriend AI Cake Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Cake Studio — Design Your Cake with AI",
    description:
      "Describe the cake you want and see it designed in seconds, then order it from a verified local baker.",
    images: [absoluteUrl("/ai-cake-studio/hero/hero-cake.jpg")],
  },
}

/**
 * The steps, as prose.
 *
 * The studio itself is an interactive widget: a crawler sees controls, not an explanation. Anyone
 * asking "how does it work" — a person skimming, or an answer engine composing a reply — had
 * nothing to read. These four steps are the same ones emitted as HowTo structured data, defined
 * once here so the visible section and the markup cannot drift apart.
 */
const HOW_IT_WORKS = [
  {
    title: "Describe the cake you want",
    detail:
      "Write it the way you would say it out loud — 'two-tier chocolate cake for a 5th birthday, dinosaur theme'. No design skill and no account needed to start.",
  },
  {
    title: "Choose the details",
    detail:
      "Pick the occasion, flavour, design style, shape, weight and number of tiers. Nine flavours, four shapes and seven styles, from 0.5 kg to 5 kg and one to four tiers.",
  },
  {
    title: "See the design and the price",
    detail:
      "The studio generates the design and shows a live price estimate for your delivery pincode, so the cost is clear before you commit to anything.",
  },
  {
    title: "Order it from a local baker",
    detail:
      "Send the design to a verified bakery near you. A real baker makes the cake and delivers it — the design is the brief they work from.",
  },
]

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

  /**
   * HowTo describes the studio as a process rather than a thing.
   *
   * It matters for a specific reason: when someone asks an assistant "how do I design a custom
   * cake online", a numbered set of steps is the shape of answer it wants to give, and a page that
   * supplies those steps gets quoted over one that only describes itself. The steps below match
   * what the tool actually does and the section rendered further down the page — a HowTo that
   * describes a flow the visitor cannot follow is invalid markup, not a shortcut.
   */
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${studioUrl}#howto`,
    name: "How to design a custom cake with AI",
    description:
      "Turn a written description into a cake design, price it for your delivery area, and order it from a local bakery.",
    totalTime: "PT2M",
    estimatedCost: { "@type": "MonetaryAmount", currency: "INR", value: "0" },
    supply: [],
    tool: [{ "@type": "HowToTool", name: "A web browser" }],
    step: HOW_IT_WORKS.map((entry, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: entry.title,
      text: entry.detail,
      url: `${studioUrl}#step-${index + 1}`,
    })),
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
      <script {...jsonLdScriptProps([applicationJsonLd, serviceJsonLd, howToJsonLd])} />
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

      {/* The visible half of howToJsonLd. Both come from HOW_IT_WORKS, so they cannot disagree. */}
      <section
        className="content-container py-12 small:py-16"
        aria-labelledby="how-it-works-heading"
      >
        <h2
          id="how-it-works-heading"
          className="font-heading text-2xl font-semibold text-slate-900 small:text-3xl"
        >
          How the AI Cake Studio works
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          Four steps, about two minutes, and nothing to pay until you decide to order.
        </p>

        <ol className="mt-8 grid gap-6 small:grid-cols-2 large:grid-cols-4">
          {HOW_IT_WORKS.map((entry, index) => (
            <li
              key={entry.title}
              id={`step-${index + 1}`}
              className="scroll-mt-24 rounded-2xl border border-cf-purple-100 bg-white p-6"
            >
              <span
                aria-hidden="true"
                className="text-sm font-bold tabular-nums text-cf-purple-600"
              >
                {index + 1}
              </span>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{entry.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-slate-600">{entry.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* The answers must render, not just appear in the markup above. */}
      <FaqSection entries={STUDIO_FAQ} title="Questions about the AI Cake Studio" />
      <BottomCta />
    </main>
  )
}
