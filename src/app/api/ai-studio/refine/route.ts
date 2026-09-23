import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * /api/ai-studio/refine
 *
 * Server-side proxy to the backend's /store/ai-studio/refine, the same shape as the generate and
 * allowance proxies beside it: the browser never sees the Medusa origin or the JWT, so this route
 * lifts the httpOnly `_medusa_jwt` cookie into a Bearer header.
 */
async function forward(method: "GET" | "POST", body?: unknown) {
  const token = cookies().get("_medusa_jwt")?.value

  if (!token) {
    return NextResponse.json(
      { error: "Sign in so we can get back to you.", code: "AUTH_REQUIRED" },
      { status: 401 }
    )
  }

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/ai-studio/refine`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
    })

    return NextResponse.json(await res.json(), { status: res.status })
  } catch (error) {
    console.error("[api/ai-studio/refine] Failed to reach Medusa backend", error)
    return NextResponse.json(
      { error: "We could not send that just now. Please try again in a moment." },
      { status: 502 }
    )
  }
}

export async function GET() {
  return forward("GET")
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }
  return forward("POST", body)
}
