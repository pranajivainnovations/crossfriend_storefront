import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * POST /api/ai-studio/designs/:id/report
 *
 * Reports a design, or a specific comment on it (body: { commentId? }).
 * Auth required.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = cookies().get("_medusa_jwt")?.value

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Authentication required.", code: "AUTH_REQUIRED" },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  try {
    const backendRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/ai-studio/designs/${params.id}/report`,
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
    console.error("[api/ai-studio/designs/:id/report] Failed to reach Medusa backend", error)
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
