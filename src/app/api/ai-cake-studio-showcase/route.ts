import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

const EMPTY_PAGE = {
  designs: [],
  pagination: { page: 1, limit: 12, total: 0, hasMore: false },
}

/**
 * GET /api/ai-cake-studio-showcase
 *
 * Server-side proxy to the Medusa backend's GET /store/ai-studio/showcase.
 * Public route — no auth required. Query params (occasion, style, sort,
 * limit, page) are forwarded as-is. The _medusa_jwt cookie is forwarded
 * too, if present, purely so the backend can personalize `isLiked` per
 * design — browsing works identically for anonymous visitors.
 *
 * Never errors out to the caller — on any failure it returns an empty page
 * so the storefront gallery degrades gracefully instead of crashing.
 */
export async function GET(request: NextRequest) {
  const { search } = new URL(request.url)
  const token = cookies().get("_medusa_jwt")?.value

  try {
    const backendRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/ai-studio/showcase${search}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      }
    )

    if (!backendRes.ok) {
      console.error(
        `[Showcase Proxy] Backend responded with ${backendRes.status}`
      )
      return NextResponse.json(EMPTY_PAGE)
    }

    const data = await backendRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[Showcase Proxy] Failed to reach Medusa backend", error)
    return NextResponse.json(EMPTY_PAGE)
  }
}
