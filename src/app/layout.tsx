import { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "styles/globals.css"

import { getSiteSettings } from "@lib/data/site-settings"
import {
  BASE_URL,
  ORGANIZATION_ID,
  WEBSITE_ID,
  jsonLdScriptProps,
} from "@lib/util/seo"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "CrossFriend — Make Every Celebration Unforgettable",
    template: "%s | CrossFriend",
  },
  description:
    "Plan your perfect celebration. Shop cakes, decorations, gifts, costumes and more — all in one place with same-day delivery.",
  keywords: [
    "celebration shop",
    "party supplies",
    "cakes online",
    "birthday decorations",
    "gifts delivery",
    "costumes",
    "anniversary",
    "festival shopping",
    "same day delivery",
  ],
  authors: [{ name: "CrossFriend" }],
  creator: "CrossFriend",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "CrossFriend",
    title: "CrossFriend — Make Every Celebration Unforgettable",
    description:
      "Plan your perfect celebration. Shop cakes, decorations, gifts, costumes and more — all in one place.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CrossFriend — Make Every Celebration Unforgettable",
    description:
      "Plan your perfect celebration. Shop cakes, decorations, gifts, costumes and more.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  /**
   * sameAs now comes from OPS site settings rather than a compiled-in list, so adding a social
   * account is a form field instead of a deploy. This is the property that tells Google and AI
   * answer engines that this site, the Instagram account and the Google Business Profile are one
   * business — without it each mention is orphaned and none accumulate to the same brand.
   */
  const settings = await getSiteSettings()
  const sameAs = settings.socialLinks.map((link) => link.url)

  /**
   * Site-wide identity. Every other page's structured data references these two by @id rather
   * than repeating the organisation inline, which is what lets Google treat "the seller of this
   * cake" and "the site publishing this page" as the same entity.
   *
   * The SearchAction that used to sit here was removed. It advertised /search to Google, but the
   * search feature is switched off in store.config.json and no MeiliSearch instance is configured
   * — so the page it pointed at answers every query with nothing. Telling a crawler about a search
   * endpoint that returns no results is worse than telling it nothing. Restore this when search
   * actually works.
   */
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "CrossFriend",
      url: BASE_URL,
      description:
        "Cakes, decorations, gifts and costumes for every celebration, from local bakers and makers.",
      areaServed: { "@type": "Country", name: "India" },
      // Only when there is something to point at: `sameAs: []` asserts "this brand exists nowhere
      // else", which is a worse claim than saying nothing.
      ...(sameAs.length ? { sameAs } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ghaziabad",
        addressRegion: "Uttar Pradesh",
        postalCode: "201016",
        addressCountry: "IN",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        // From settings, so a support number changed in OPS is corrected in the structured data
        // too — otherwise the markup keeps telling search engines an old number indefinitely.
        email: settings.supportEmail,
        telephone: settings.supportPhone,
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: "CrossFriend",
      url: BASE_URL,
      description:
        "Plan your perfect celebration. Shop cakes, decorations, gifts, costumes and more.",
      publisher: { "@id": ORGANIZATION_ID },
      inLanguage: "en-IN",
    },
  ]

  return (
    <html lang="en" data-mode="light">
      <head>
        <script {...jsonLdScriptProps(jsonLd)} />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans`}>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
