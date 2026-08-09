import { Metadata } from "next"
import { cookies } from "next/headers"
import { getCustomer } from "@lib/data"
import { absoluteUrl, breadcrumbJsonLd, jsonLdScriptProps } from "@lib/util/seo"
import GalleryClient from "./gallery-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  alternates: { canonical: "/ai-cake-studio/gallery" },
  title: "AI Cake Design Gallery",
  // Deliberately not "hundreds of designs" — there are 44. An overstated count is a small lie on a
  // web page and a quoted falsehood once an answer engine repeats it, and it is the kind of claim
  // that quietly ages into being true, so nobody ever goes back and checks it.
  description:
    "Browse AI-generated cake designs created by the CrossFriend community, each shown with the prompt that made it. Get inspired for a birthday, wedding, kids party or any celebration — then design your own.",
  keywords: [
    "AI cake designs",
    "cake design gallery",
    "cake inspiration",
    "birthday cake ideas",
    "wedding cake designs",
    "custom cake gallery",
  ],
  openGraph: {
    title: "AI Cake Design Gallery",
    description: "Browse community-created AI cake designs. Get inspired or use a prompt to create your own.",
  },
}

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

interface ShowcaseDesign {
  id: string
  imageUrl: string
  prompt: string
  style: string
  occasion: string
  flavor: string
  likeCount: number
  commentCount: number
  viewCount: number
  isLiked: boolean
  createdAt: string
}

// ─── Server-side data fetch (SEO) ────────────────────────────────────────────
// Goes through the Medusa backend, same as the /api/ai-cake-studio-showcase
// proxy — this page used to connect to Postgres directly, which required
// DATABASE_URL in the frontend env and duplicated the backend's query logic.

async function fetchInitialDesigns(): Promise<{ designs: ShowcaseDesign[]; total: number }> {
  try {
    const token = cookies().get("_medusa_jwt")?.value
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/ai-studio/showcase?limit=24`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    })

    if (!res.ok) {
      console.error(`[Gallery Page] Backend responded with ${res.status}`)
      return { designs: [], total: 0 }
    }

    const data = await res.json()
    return { designs: data.designs || [], total: data.pagination?.total || 0 }
  } catch (error) {
    console.error("[Gallery Page] Failed to fetch designs:", error)
    return { designs: [], total: 0 }
  }
}

// ─── Page component ──────────────────────────────────────────────────────────

export default async function GalleryPage() {
  const [{ designs, total }, customer] = await Promise.all([
    fetchInitialDesigns(),
    getCustomer().catch(() => null),
  ])

  /**
   * The gallery is a collection of images, and until now it said so nowhere a machine could read.
   * ItemList + ImageObject makes each design an addressable item with the prompt that produced it
   * as its caption — which is the part worth indexing, because "what prompt makes a cake look like
   * X" is a question people actually ask.
   *
   * `total` comes from the backend rather than a hardcoded claim, so the page can never advertise
   * more designs than exist.
   */
  const galleryUrl = absoluteUrl("/ai-cake-studio/gallery")
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${galleryUrl}#designs`,
    name: "CrossFriend AI cake design gallery",
    description:
      "Cake designs generated in the CrossFriend AI Cake Studio, each shown with the prompt that produced it.",
    numberOfItems: total || designs.length,
    itemListElement: designs.slice(0, 24).map((design, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "ImageObject",
        "@id": `${galleryUrl}#design-${design.id}`,
        contentUrl: design.imageUrl,
        caption: design.prompt,
        creditText: "Created in the CrossFriend AI Cake Studio",
        ...(design.createdAt ? { uploadDate: design.createdAt } : {}),
        isPartOf: { "@id": `${galleryUrl}#designs` },
      },
    })),
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f9f6ff] via-white to-[#fcfaff]">
      <script {...jsonLdScriptProps(itemListJsonLd)} />
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "AI Cake Studio", path: "/ai-cake-studio" },
            { name: "Gallery", path: "/ai-cake-studio/gallery" },
          ])
        )}
      />
      <GalleryClient initialDesigns={designs} initialTotal={total} customer={customer} />
    </main>
  )
}
