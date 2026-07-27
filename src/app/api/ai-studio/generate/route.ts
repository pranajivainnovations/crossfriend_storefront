import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * POST /api/ai-studio/generate
 *
 * Server-side proxy to the Medusa backend's POST /store/ai-studio/generate.
 * The browser never sees the Medusa backend origin or the JWT — this route
 * reads the httpOnly `_medusa_jwt` cookie and forwards it as a Bearer token,
 * matching the auth pattern used in `@lib/data/index.ts`.
 */
export async function POST(request: NextRequest) {
  const token = cookies().get("_medusa_jwt")?.value

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: "Authentication required. Please log in to generate designs.",
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
      {
        success: false,
        error: "Invalid request body.",
        code: "INVALID_REQUEST",
      },
      { status: 400 }
    )
  }

  try {
    const backendRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/ai-studio/generate`,
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
    console.error("[api/ai-studio/generate] Failed to reach Medusa backend", error)
    return NextResponse.json(
      {
        success: false,
        error: "AI provider is temporarily unavailable. Please try again in a moment.",
        code: "PROVIDER_ERROR",
      },
      { status: 502 }
    )
  }
}
