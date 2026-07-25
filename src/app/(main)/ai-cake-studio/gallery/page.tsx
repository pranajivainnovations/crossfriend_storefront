import { Metadata } from "next"
import { Pool } from "pg"
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

// ─── Server-side data fetch (SEO) ────────────────────────────────────────────

let pool: Pool | null = null

function getPool(): Pool {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL not set")
  pool = new Pool({ connectionString, max: 5 })
  return pool
}

interface ShowcaseDesign {
  id: string
  imageUrl: string
  prompt: string
  style: string
  occasion: string
  flavor: string
  likeCount: number
  viewCount: number
  createdAt: string
}

async function fetchInitialDesigns(): Promise<{ designs: ShowcaseDesign[]; total: number }> {
  try {
    const db = getPool()

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM ai_studio.cake_designs
       WHERE status = 'active' AND is_public = true AND image_url IS NOT NULL AND image_url != ''`
    )
    const total = parseInt(countResult.rows[0]?.total || "0", 10)

    const result = await db.query(
      `SELECT id, image_url, prompt, style, occasion, flavor, view_count, save_count, created_at
       FROM ai_studio.cake_designs
       WHERE status = 'active' AND is_public = true AND image_url IS NOT NULL AND image_url != ''
       ORDER BY save_count DESC, view_count DESC, created_at DESC
       LIMIT 24`
    )

    const designs: ShowcaseDesign[] = result.rows.map((row) => ({
      id: row.id,
      imageUrl: row.image_url,
      prompt: row.prompt,
      style: row.style,
      occasion: row.occasion || "",
      flavor: row.flavor || "",
      likeCount: row.save_count || 0,
      viewCount: row.view_count || 0,
      createdAt: row.created_at,
    }))

    return { designs, total }
  } catch (error) {
    console.error("[Gallery Page] Failed to fetch designs:", error)
    return { designs: [], total: 0 }
  }
}

// ─── Page component ──────────────────────────────────────────────────────────

export default async function GalleryPage() {
  const { designs, total } = await fetchInitialDesigns()

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f9f6ff] via-white to-[#fcfaff]">
      <GalleryClient initialDesigns={designs} initialTotal={total} />
    </main>
  )
}
