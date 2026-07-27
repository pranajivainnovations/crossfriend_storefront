import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * POST /api/ai-studio/designs/:id/like
 *
 * Server-side proxy to the Medusa backend's POST /store/ai-studio/designs/:id/like.
 * Same auth pattern as /api/ai-studio/generate — reads the httpOnly
 * `_medusa_jwt` cookie and forwards it as a Bearer token.
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
        error: "Authentication required. Please log in to like a design.",
        code: "AUTH_REQUIRED",
      },
      { status: 401 }
    )
  }

  try {
    const backendRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/ai-studio/designs/${params.id}/like`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    )

    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[api/ai-studio/designs/:id/like] Failed to reach Medusa backend", error)
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
