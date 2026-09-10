import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * GET /api/pincode/check?pincode=XXXXXX[&baker=slug]
 *
 * What CrossFriend can actually do for someone at this pincode.
 *
 * ── What used to be here ───────────────────────────────────────────────────────────────────────
 * A hardcoded table of thirteen 3-digit prefixes, and a comment reading "in production, replace
 * with delivery partner API". It answered `available: true, estimatedDays: 2` for the whole of
 * Mumbai, Bangalore, Chennai, Hyderabad and Kolkata, and `estimatedDays: 0` — same day — for Delhi
 * and Gurgaon. No baker has ever been onboarded in any of them. Every product page rendered that as
 * a green tick with a city name and a day count, which is a delivery promise made to most of urban
 * India on the strength of a string comparison.
 *
 * Coverage now comes from the same tables OPS writes to, so a pincode is served when someone in OPS
 * has said it is and not before. Nothing here decides anything — see /store/pincode/coverage.
 *
 * ── Why an unserved pincode is a 200 and not an error ──────────────────────────────────────────
 * The old route returned `success: false` for anywhere it did not recognise, and the UI turned that
 * into "Sorry, delivery is not available in your area yet". But designing a cake is free and works
 * anywhere in India — so "we cannot deliver" is never the whole answer, and treating it as a failure
 * throws away the offer that is still on the table. Every well-formed pincode gets a 200 and a tier;
 * only a malformed one is an error.
 *
 *   "deliver"     — a baker can fulfil here (and, with ?baker=, that specific baker can)
 *   "design_only" — real pincode, no fulfilment yet: the studio still works, so say so
 *   "unknown"     — not in the India Post directory; almost always a typo worth re-checking
 */

export type CoverageTier = "deliver" | "design_only" | "unknown"

type BackendCoverage = {
  pincode: string
  serviceStatus: "enabled" | "coming_soon" | "unknown"
  bakerCount: number
  district: string | null
  state: string | null
  baker?: { slug: string; name: string; serves: boolean; turnaroundHours: number | null }
  error?: string
}

/** Title Case for district names, which arrive from India Post shouting ("GAUTAM BUDDHA NAGAR"). */
function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
}

export async function GET(request: NextRequest) {
  const pincode = (request.nextUrl.searchParams.get("pincode") ?? "").trim()
  const baker = (request.nextUrl.searchParams.get("baker") ?? "").trim()

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { success: false, error: "Invalid pincode. Must be 6 digits." },
      { status: 400 }
    )
  }

  let data: BackendCoverage
  try {
    const qs = new URLSearchParams({ pincode })
    if (baker) qs.set("baker", baker)

    const backendRes = await fetch(
      `${MEDUSA_BACKEND_URL}/store/pincode/coverage?${qs.toString()}`,
      { cache: "no-store" }
    )
    if (!backendRes.ok) throw new Error(`backend ${backendRes.status}`)
    data = await backendRes.json()
  } catch (error) {
    console.error("[api/pincode/check] Failed to reach Medusa backend", error)
    /* Explicitly not a "we don't deliver there" — an unreachable backend tells us nothing about
       coverage, and answering "no" on its behalf would be the same invented claim in the other
       direction. */
    return NextResponse.json(
      { success: false, error: "Couldn't check that pincode right now. Please try again." },
      { status: 502 }
    )
  }

  /* With ?baker=, the question is whether THIS baker reaches the customer — a launched pincode with
     other bakers in it is still "no" for the product being looked at. Without it, the area-level
     answer: can anybody fulfil here. */
  const canDeliver = data.baker ? data.baker.serves : data.bakerCount > 0

  const tier: CoverageTier =
    data.serviceStatus === "unknown" ? "unknown" : canDeliver ? "deliver" : "design_only"

  return NextResponse.json({
    success: true,
    data: {
      /* `available`, `city` and `area` keep their old names and meanings so existing callers do not
         have to change shape — `available` is simply true only when it is now true. */
      available: tier === "deliver",
      city: data.district ? titleCase(data.district) : "",
      area: data.state ? titleCase(data.state) : "",
      tier,
      bakerCount: data.bakerCount,
      bakerName: data.baker?.name,
      bakerServes: data.baker?.serves,
      turnaroundHours: data.baker?.turnaroundHours ?? null,
    },
  })
}
