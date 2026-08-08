import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * GET /api/pincode/lookup?pincode=110001
 *
 * Proxy to GET /store/pincode/lookup, which answers from baker_network.pincode_directory — the
 * India Post directory we already import and already use for baker matching. One source of truth
 * for pincode geography across the whole product; no third-party call at request time.
 *
 * Distinct from /api/pincode/check, which answers "do we deliver here?" against our own
 * serviceable-area rules. This one is pure geography and answers for any pincode in the directory,
 * including ones we don't deliver to — a billing address or a gift order still needs a real city
 * and state, and serviceability is enforced elsewhere.
 *
 * Cached hard in the browser: a pincode's district and state don't change, so a customer who
 * corrects a typo and comes back to the same pincode pays nothing for it.
 *
 * Response 200: { success: true, data: { city, state } }
 * Response 200: { success: false, error }
 * Response 400: { success: false, error }
 */

const CACHE_SECONDS = 60 * 60 * 24 * 30

export async function GET(request: NextRequest) {
  const pincode = (request.nextUrl.searchParams.get("pincode") || "").trim()

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { success: false, error: "Invalid pincode. Must be 6 digits." },
      { status: 400 }
    )
  }

  try {
    const backendRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/pincode/lookup?pincode=${pincode}`,
      { next: { revalidate: CACHE_SECONDS } }
    )

    const data = await backendRes.json().catch(() => null)

    if (!backendRes.ok || !data?.success) {
      return NextResponse.json({
        success: false,
        error: data?.error || "We couldn't recognise that pincode.",
      })
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, stale-while-revalidate=86400`,
      },
    })
  } catch (error) {
    console.error("[api/pincode/lookup] Failed to reach Medusa backend", error)
    // The customer can always type city and state themselves — a lookup outage costs convenience,
    // never the order.
    return NextResponse.json({
      success: false,
      error: "Pincode lookup is unavailable right now.",
    })
  }
}
