import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/auth/otp/send
 *
 * Asks the backend to issue and deliver a one-time password.
 *
 * This route used to generate a code with Math.random, store it nowhere, and return "OTP sent
 * successfully" without sending anything — which paired with a verify route that accepted any six
 * digits to make the sign-in a no-op. The real work now happens in the backend, for two reasons
 * that are not about tidiness: the code has to be stored somewhere between send and verify and
 * Redis lives there, and the MSG91 auth key belongs with the other backend credentials rather than
 * in this app's runtime environment.
 *
 * What remains here is a proxy. It exists so the browser talks to its own origin rather than to the
 * Medusa host directly, which keeps the backend URL and its CORS surface out of the client.
 */

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

/** Which flow this sign-in belongs to. The backend refuses any key it does not recognise. */
const FLOW = "ai_studio_login"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { mobile } = body as { mobile?: string }

  // Validated here as well as in the backend so an obviously-bad number costs no network round
  // trip. The backend check is the one that matters; this one is only for latency.
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit Indian mobile number" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/crossfriend/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, flow: FLOW }),
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      // The backend's message is already customer-safe — it deliberately never names the internal
      // reason a flow is unavailable — so it is passed through rather than replaced with something
      // vaguer. Rate-limit responses carry a wait the form shows the user.
      return NextResponse.json(
        {
          error: data.error ?? "Could not send the code. Please try again.",
          // Present on a 429. The form uses it to run its countdown from the server's number
          // rather than its own guess, so the button re-enables exactly when the backend will
          // accept another request instead of a few seconds early.
          retryAfterSeconds: data.retryAfterSeconds,
        },
        { status: res.status }
      )
    }

    return NextResponse.json({
      success: true,
      resendAfterSeconds: data.resendAfterSeconds ?? 30,
      otpLength: data.otpLength ?? 6,
      expiresInSeconds: data.expiresInSeconds,
    })
  } catch (error) {
    console.error("[otp/send] backend unreachable", error)
    return NextResponse.json(
      { error: "Could not send the code. Please try again." },
      { status: 502 }
    )
  }
}
