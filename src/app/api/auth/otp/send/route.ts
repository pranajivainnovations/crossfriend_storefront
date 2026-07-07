import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/auth/otp/send
 *
 * Sends a one-time password to the provided mobile number.
 * Currently MOCKED — logs the OTP to the console in development.
 *
 * Replace the mock block with your real OTP provider (MSG91, Twilio, etc.)
 * before going to production.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { mobile } = body as { mobile?: string }

  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit Indian mobile number" },
      { status: 400 }
    )
  }

  // ── Mock OTP ──────────────────────────────────────────────────────────────
  // In production: call MSG91 / Twilio / your OTP provider here and store
  // the OTP in a short-lived server-side store (Redis / KV) keyed by mobile.
  const mockOtp = Math.floor(100000 + Math.random() * 900000).toString()
  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP Mock] Code for +91${mobile} → ${mockOtp}`)
  }
  // ─────────────────────────────────────────────────────────────────────────

  return NextResponse.json({ success: true, message: "OTP sent successfully" })
}
