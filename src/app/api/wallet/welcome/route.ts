import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9001"

/**
 * POST /api/wallet/welcome — tell the backend where this customer is, and let it settle the bonus.
 *
 * Called when a signed-in customer sets their pincode. The sign-in token is httpOnly, so the page
 * cannot talk to the backend itself; this forwards it as a bearer, like every other authenticated
 * call in this app.
 *
 * Silent when there is nothing to give. A customer who already has one, or whose area has no campaign
 * running, is told nothing — there is no good version of "you did not qualify" on a screen they did
 * not ask to see.
 */
export async function POST(req: NextRequest) {
  const token = cookies().get("_medusa_jwt")?.value
  if (!token) return NextResponse.json({ granted: false })

  const body = await req.json().catch(() => ({}))
  const pincode = typeof body?.pincode === "string" ? body.pincode : null
  if (!pincode) return NextResponse.json({ granted: false })

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/wallet/welcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ pincode, brand: "crossfriend" }),
      cache: "no-store",
    })
    if (!res.ok) return NextResponse.json({ granted: false })
    return NextResponse.json(await res.json())
  } catch {
    /* A bonus that could not be claimed now is claimed on their next visit — every sign-in and every
       pincode change tries again. Nothing is lost by staying quiet here. */
    return NextResponse.json({ granted: false })
  }
}
