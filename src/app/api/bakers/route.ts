import { NextResponse } from "next/server"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * GET /api/bakers?pincode=XXXXXX
 *
 * Proxy to the real GET /store/ai-studio/bakers — replaces the old
 * hardcoded sample-data response. Public, no auth needed (finding a baker
 * by pincode doesn't require knowing who's asking), so this is a plain
 * fetch, unlike the JWT-forwarding proxies used elsewhere in ai-studio.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pincode = (searchParams.get("pincode") ?? "").trim()

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { error: "Please enter a valid 6-digit pincode" },
      { status: 400 }
    )
  }

  try {
    const backendRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/ai-studio/bakers?pincode=${pincode}`,
      { cache: "no-store" }
    )
    const data = await backendRes.json()
    return NextResponse.json(data, { status: backendRes.status })
  } catch (error) {
    console.error("[api/bakers] Failed to reach Medusa backend", error)
    return NextResponse.json(
      { error: "Baker search is temporarily unavailable. Please try again in a moment." },
      { status: 502 }
    )
  }
}
