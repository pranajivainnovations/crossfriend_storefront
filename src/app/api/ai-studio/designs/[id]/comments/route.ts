import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

const EMPTY_PAGE = {
  comments: [],
  pagination: { page: 1, limit: 20, total: 0, hasMore: false },
}

/**
 * GET /api/ai-studio/designs/:id/comments
 *
 * Public — no auth required. Forwards the _medusa_jwt cookie (if present)
 * so the backend can mark the caller's own comments isOwn: true; never
 * required. Never errors out to the caller — falls back to an empty page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = cookies().get("_medusa_jwt")?.value
  const { search } = new URL(request.url)

  try {
    const backendRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/ai-studio/designs/${params.id}/comments${search}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      }
    )

    if (!backendRes.ok) {
      console.error(`[Comments Proxy] Backend responded with ${backendRes.status}`)
      return NextResponse.json(EMPTY_PAGE)
    }

    const data = await backendRes.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[Comments Proxy] Failed to reach Medusa backend", error)
    return NextResponse.json(EMPTY_PAGE)
  }
}

/**
 * POST /api/ai-studio/designs/:id/comments
 *
 * Adds a comment. Auth required — reads the httpOnly _medusa_jwt cookie
 * and forwards it as a Bearer token, same pattern as /ai-studio/generate.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = cookies().get("_medusa_jwt")?.value

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: "Authentication required. Please log in to comment.",
        code: "AUTH_REQUIRED",
      },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body.", code: "INVALID_REQUEST" },
      { status: 400 }
    )
  }

  try {
    const backendRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/ai-studio/designs/${params.id}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    )

    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[Comments Proxy] Failed to reach Medusa backend", error)
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again.",
        code: "PROVIDER_ERROR",
      },
      { status: 502 }
    )
  }
}
