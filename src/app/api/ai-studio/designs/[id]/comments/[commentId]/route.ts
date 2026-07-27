import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * DELETE /api/ai-studio/designs/:id/comments/:commentId
 *
 * Deletes the caller's own comment. Auth required.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const token = cookies().get("_medusa_jwt")?.value

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Authentication required.", code: "AUTH_REQUIRED" },
      { status: 401 }
    )
  }

  try {
    const backendRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/ai-studio/designs/${params.id}/comments/${params.commentId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    )

    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[api/ai-studio/designs/:id/comments/:commentId] Failed to reach Medusa backend", error)
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
