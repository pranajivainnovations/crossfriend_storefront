import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * GET /api/ai-studio/allowance
 *
 * Server-side proxy to the backend's GET /store/ai-studio/allowance, the same shape as the generate
 * proxy beside it: the browser never sees the Medusa origin or the JWT, so this route lifts the
 * httpOnly `_medusa_jwt` cookie into a Bearer header.
 *
 * Signed out is not an error here. The Studio page asks on mount regardless of who is looking, and
 * a visitor who has not signed in simply has no allowance to report — answering 401 with a body the
 * page can read keeps that out of the console and off the screen.
 */
export async function GET() {
  const token = cookies().get("_medusa_jwt")?.value

  if (!token) {
    return NextResponse.json({ remaining: null, code: "AUTH_REQUIRED" }, { status: 401 })
  }

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/ai-studio/allowance`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error("[api/ai-studio/allowance] Failed to reach Medusa backend", error)
    return NextResponse.json({ remaining: null, error: "Unavailable." }, { status: 502 })
  }
}
