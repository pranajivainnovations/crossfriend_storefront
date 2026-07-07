import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { medusaClient } from "@lib/config"

const DOMAIN = "pranajiva.in"

/**
 * Derives a deterministic password for a mobile-based Medusa account.
 * The OTP is the real authentication gate; this password is only used to
 * satisfy Medusa's email+password auth model.
 *
 * Uses OTP_PASSWORD_SALT from env — set a strong random value in production.
 */
function derivePassword(mobile: string): string {
  const salt = process.env.OTP_PASSWORD_SALT || "cf_change_this_salt_in_production"
  return `CF_${mobile}_${salt.slice(0, 8)}`
}

/**
 * POST /api/auth/otp/verify
 *
 * Verifies the OTP and silently creates or logs in the Medusa customer.
 *
 * Body: { mobile: string, otp: string }
 *
 * On success: sets _medusa_jwt cookie and returns { success: true, isNewUser: boolean }
 * On failure: returns 4xx/5xx with { error: string }
 *
 * ── OTP VERIFICATION ──────────────────────────────────────────────────────
 * Currently MOCKED: any 6-digit code is accepted.
 * In production: validate against your OTP provider session here.
 * ─────────────────────────────────────────────────────────────────────────
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { mobile, otp } = body as { mobile?: string; otp?: string }

  if (!mobile || !otp) {
    return NextResponse.json({ error: "Mobile and OTP are required" }, { status: 400 })
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 })
  }

  // ── Mock OTP check ────────────────────────────────────────────────────────
  // Replace this block with a real provider verification (e.g. MSG91 session).
  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json(
      { error: "Invalid OTP. Please enter the 6-digit code sent to your mobile." },
      { status: 400 }
    )
  }
  // In the mock any 6-digit code passes. In production verify with provider here.
  // ─────────────────────────────────────────────────────────────────────────

  const email = `${mobile}@${DOMAIN}`
  const password = derivePassword(mobile)
  let isNewUser = false

  const setJwt = (token: string) => {
    cookies().set("_medusa_jwt", token, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
  }

  // 1. Try to login (customer already exists)
  try {
    const { access_token } = await medusaClient.auth.getToken(
      { email, password },
      { next: { tags: ["auth"] } } as Record<string, unknown>
    )
    if (access_token) setJwt(access_token)
    return NextResponse.json({ success: true, isNewUser: false })
  } catch {
    // Customer likely doesn't exist — create one below
  }

  // 2. Create new customer then login
  try {
    await medusaClient.customers.create({
      email,
      password,
      first_name: mobile,
      last_name: "",
      phone: `+91${mobile}`,
    })

    const { access_token } = await medusaClient.auth.getToken(
      { email, password },
      { next: { tags: ["auth"] } } as Record<string, unknown>
    )
    if (access_token) setJwt(access_token)
    isNewUser = true
    return NextResponse.json({ success: true, isNewUser })
  } catch (err) {
    console.error("[OTP Verify] Medusa auth failed:", err)
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    )
  }
}
