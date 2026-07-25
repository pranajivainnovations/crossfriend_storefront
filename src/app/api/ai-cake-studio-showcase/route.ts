import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

let pool: Pool | null = null

function getPool(): Pool {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("[Showcase API] DATABASE_URL is not set")
  }
  pool = new Pool({ connectionString, max: 5 })
  return pool
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const occasion = searchParams.get("occasion") || null
    const style = searchParams.get("style") || null
    const sort = searchParams.get("sort") || "popular"
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 50)
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
    const offset = (page - 1) * limit

    const db = getPool()

    // Build WHERE conditions
    const conditions: string[] = [
      "status = 'active'",
      "is_public = true",
      "image_url IS NOT NULL",
      "image_url != ''",
    ]
    const params: any[] = []
    let paramIndex = 1

    if (occasion) {
      conditions.push(`occasion = $${paramIndex}`)
      params.push(occasion)
      paramIndex++
    }

    if (style) {
      conditions.push(`style = $${paramIndex}`)
      params.push(style)
      paramIndex++
    }

    // Trending: only last 7 days
    if (sort === "trending") {
      conditions.push(`created_at > NOW() - INTERVAL '7 days'`)
    }

    const whereClause = conditions.join(" AND ")

    // Sort order
    let orderClause: string
    switch (sort) {
      case "recent":
        orderClause = "created_at DESC"
        break
      case "trending":
        orderClause = "view_count DESC, save_count DESC, created_at DESC"
        break
      case "popular":
      default:
        orderClause = "save_count DESC, view_count DESC, created_at DESC"
        break
    }

    // Count total
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM ai_studio.cake_designs WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0]?.total || "0", 10)

    // Fetch designs
    const result = await db.query(
      `SELECT
        id, image_url, prompt, style, occasion, flavor,
        view_count, save_count,
        created_at
      FROM ai_studio.cake_designs
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    const designs = result.rows.map((row) => ({
      id: row.id,
      imageUrl: row.image_url,
      prompt: row.prompt,
      style: row.style,
      occasion: row.occasion,
      flavor: row.flavor,
      likeCount: row.save_count || 0,
      commentCount: 0,
      viewCount: row.view_count || 0,
      createdAt: row.created_at,
    }))

    return NextResponse.json({
      designs,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error("[Showcase API] Error:", error)

    // Graceful fallback — never crash the page
    return NextResponse.json({
      designs: [],
      pagination: { page: 1, limit: 12, total: 0, hasMore: false },
    })
  }
}
