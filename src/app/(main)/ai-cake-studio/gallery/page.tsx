import { Metadata } from "next"
import { cookies } from "next/headers"
import { getCustomer } from "@lib/data"
import GalleryClient from "./gallery-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "AI Cake Design Gallery | CrossFriend",
  description:
    "Browse hundreds of AI-generated cake designs created by our community. Get inspired for your next celebration — birthday, wedding, kids party and more.",
  keywords: [
    "AI cake designs",
    "cake design gallery",
    "cake inspiration",
    "birthday cake ideas",
    "wedding cake designs",
    "custom cake gallery",
  ],
  openGraph: {
    title: "AI Cake Design Gallery | CrossFriend",
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f9f6ff] via-white to-[#fcfaff]">
      <GalleryClient initialDesigns={designs} initialTotal={total} customer={customer} />
    </main>
  )
}
