import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * POST /api/ai-studio/designs/:id/visibility   { isPublic: boolean }
 *
 * Server-side proxy to the backend's visibility route, which publishes a design to the community
 * gallery or pulls it back out. Same auth pattern as the like proxy — reads the httpOnly
 * `_medusa_jwt` cookie and forwards it as a Bearer token. The backend scopes the update to the
 * design's owner, so this can only ever change the caller's own designs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = cookies().get("_medusa_jwt")?.value

  if (!token) {
    return NextResponse.json(
      { error: "Please log in to change who can see this design." },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  try {
    const backendRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/ai-studio/designs/${params.id}/visibility`,
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

    const data = await backendRes.json().catch(() => ({}))
    return NextResponse.json(data, { status: backendRes.status })
  } catch {
    return NextResponse.json(
      { error: "Could not reach the server. Please try again." },
      { status: 502 }
    )
  }
}
