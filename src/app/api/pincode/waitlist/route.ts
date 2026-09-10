import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * POST /api/pincode/waitlist   { pincode, mobile, source? }
 *
 * Forwards "tell me when you deliver here" to the backend, which owns the table and the validation.
 *
 * Deliberately thin: the shape is checked again on the other side, so duplicating the rules here
 * would only create somewhere for the two copies to drift apart. What this layer adds is a browser-
 * reachable origin and an error the customer can read when the backend is unreachable.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  try {
    const backendRes = await fetch(`${MEDUSA_BACKEND_URL}/store/pincode/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await backendRes.json().catch(() => ({}))
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[api/pincode/waitlist] Failed to reach Medusa backend", error)
    return NextResponse.json(
      { error: "Couldn't save that just now. Please try again." },
      { status: 502 }
    )
  }
}
