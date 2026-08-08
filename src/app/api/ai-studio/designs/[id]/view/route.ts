import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * POST /api/ai-studio/designs/:id/view
 *
 * Server-side proxy to the backend's POST /store/ai-studio/designs/:id/view, which records that a
 * design was actually opened rather than just scrolled past in a grid.
 *
 * Unlike the like/comment proxies this forwards no auth — views are counted for anonymous visitors
 * too, who are most of them. Always answers 204 regardless of what the backend says: a lost view is
 * worth nothing next to a lightbox that throws.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await fetch(
      `${MEDUSA_BACKEND_URL}/store/ai-studio/designs/${params.id}/view`,
      { method: "POST", cache: "no-store" }
    )
  } catch {
    // Swallowed on purpose — see above.
  }

  return new NextResponse(null, { status: 204 })
}
