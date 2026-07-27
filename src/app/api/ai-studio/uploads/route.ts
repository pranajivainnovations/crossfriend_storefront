import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * POST /api/ai-studio/uploads
 *
 * Server-side proxy to the Medusa backend's POST /store/ai-studio/uploads.
 * Same auth pattern as /api/ai-studio/generate — the browser never sees the
 * Medusa backend origin or the JWT. Unlike that route, this one forwards
 * multipart/form-data (a file + a purpose field), not JSON — the body is
 * read as FormData and re-sent as FormData so fetch generates the correct
 * multipart boundary itself; it must NOT be forwarded as a raw stream or
 * with a manually-set Content-Type.
 */
export async function POST(request: NextRequest) {
  const token = cookies().get("_medusa_jwt")?.value

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: "Authentication required. Please log in to upload an image.",
        code: "AUTH_REQUIRED",
      },
      { status: 401 }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid upload.", code: "INVALID_REQUEST" },
      { status: 400 }
    )
  }

  try {
    const backendRes = await fetch(`${MEDUSA_BACKEND_URL}/store/ai-studio/uploads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      cache: "no-store",
    })

    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[api/ai-studio/uploads] Failed to reach Medusa backend", error)
    return NextResponse.json(
      {
        success: false,
        error: "Upload service is temporarily unavailable. Please try again in a moment.",
        code: "PROVIDER_ERROR",
      },
      { status: 502 }
    )
  }
}
