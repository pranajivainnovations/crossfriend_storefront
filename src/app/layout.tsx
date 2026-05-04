import { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "styles/globals.css"

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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"

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

export default function RootLayout(props: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CrossFriend",
    url: BASE_URL,
    description:
      "Plan your perfect celebration. Shop cakes, decorations, gifts, costumes and more.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <html lang="en" data-mode="light">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans`}>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
