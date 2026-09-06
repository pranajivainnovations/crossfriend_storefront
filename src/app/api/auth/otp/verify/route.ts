import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { medusaClient } from "@lib/config"

const DOMAIN = "pranajiva.in"
const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const FLOW = "ai_studio_login"

/**
 * The salt that turns a mobile number into a Medusa password.
 *
 * ── Why this throws instead of defaulting ──────────────────────────────────────────────────────
 * It used to read `process.env.OTP_PASSWORD_SALT || "cf_change_this_salt_in_production"`, and the
 * variable was set in no environment file — so production ran on the literal. Every customer's
 * password was therefore `CF_<mobile>_cf_chang`, computable by anyone who could read this file, and
 * usable directly against the Medusa API without ever touching the sign-in form. A fallback that
 * silently ships is worse than no fallback, because nothing ever fails to draw attention to it.
 *
 * Failing closed here means a missing salt breaks sign-in loudly at deploy time rather than
 * quietly leaving the door open.
 */
function derivePassword(mobile: string): string {
  const salt = process.env.OTP_PASSWORD_SALT
  if (!salt || salt.length < 32) {
    throw new Error("OTP_PASSWORD_SALT must be set to at least 32 characters")
  }
  return `CF_${mobile}_${salt.slice(0, 16)}`
}

/**
 * The password shape produced by the old hardcoded fallback.
 *
 * Kept only so existing customers are not locked out the moment a real salt is set: their stored
 * password was derived from the literal below, and nothing has re-hashed it. When a login with the
 * current salt fails and this one succeeds, the account is silently upgraded — see below.
 *
 * Delete this once the accounts created before the salt was set have all signed in at least once,
 * or once they have been force-rotated. It is a known-value password by definition and every day it
 * remains valid is a day that credential still works.
 */
function legacyPassword(mobile: string): string {
  return `CF_${mobile}_cf_chang`
}

/**
 * POST /api/auth/otp/verify
 *
 * Verifies the code with the backend, then creates or logs in the Medusa customer.
 *
 * The verification and the session are split deliberately. The backend owns the code — it is the
 * only place that knows what was issued and the only place that can consume it — but the session
 * cookie has to be set on this origin, so the login half stays here. A caller who verifies against
 * the backend directly consumes the code and gets no cookie, which makes that a way to break your
 * own login rather than a way around it.
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

  // ── The actual verification ───────────────────────────────────────────────────────────────
  // Everything below this block runs only if the backend confirmed the code. There is no branch
  // that reaches the login on a bad code, and no shape check standing in for a comparison.
  try {
    const verifyRes = await fetch(`${MEDUSA_BACKEND_URL}/store/crossfriend/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp, flow: FLOW }),
      cache: "no-store",
    })

    const verifyData = await verifyRes.json().catch(() => ({}))

    if (!verifyRes.ok || verifyData.verified !== true) {
      return NextResponse.json(
        { error: verifyData.error ?? "Incorrect code. Please try again." },
        { status: verifyRes.status === 500 ? 502 : verifyRes.status || 400 }
      )
    }
  } catch (error) {
    console.error("[otp/verify] backend unreachable", error)
    return NextResponse.json(
      { error: "Could not verify the code right now. Please try again." },
      { status: 502 }
    )
  }
  // ──────────────────────────────────────────────────────────────────────────────────────────

  const email = `${mobile}@${DOMAIN}`

  let password: string
  try {
    password = derivePassword(mobile)
  } catch (error) {
    console.error("[otp/verify] misconfigured:", error)
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable. Please try again later." },
      { status: 503 }
    )
  }

  const setJwt = (token: string) => {
    cookies().set("_medusa_jwt", token, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
  }

  const login = async (pw: string): Promise<string | null> => {
    try {
      const { access_token } = await medusaClient.auth.getToken(
        { email, password: pw },
        { next: { tags: ["auth"] } } as Record<string, unknown>
      )
      return access_token ?? null
    } catch {
      return null
    }
  }

  // 1. Existing customer, current salt.
  const token = await login(password)
  if (token) {
    setJwt(token)
    return NextResponse.json({ success: true, isNewUser: false })
  }

  /**
   * 2. Existing customer created before a real salt was set.
   *
   * Their stored hash came from the known fallback, so a login with the current salt just failed.
   * Rotate them onto the real password now — they have proved possession of the mobile number by
   * passing the OTP a moment ago, which is a stronger check than the password being replaced.
   *
   * A failed rotation is logged but not surfaced: the customer is legitimately signed in either
   * way, and the next sign-in will simply try again.
   */
  const legacyToken = await login(legacyPassword(mobile))
  if (legacyToken) {
    try {
      await medusaClient.customers.update(
        { password },
        { Authorization: `Bearer ${legacyToken}` }
      )
      const rotated = await login(password)
      setJwt(rotated ?? legacyToken)
    } catch (err) {
      console.error("[otp/verify] password rotation failed for an existing customer", err)
      setJwt(legacyToken)
    }
    return NextResponse.json({ success: true, isNewUser: false })
  }

  // 3. New customer.
  try {
    await medusaClient.customers.create({
      email,
      password,
      first_name: mobile,
      last_name: "",
      phone: `+91${mobile}`,
    })

    const newToken = await login(password)
    if (!newToken) {
      console.error("[otp/verify] created customer but could not log them in")
      return NextResponse.json(
        { error: "Authentication failed. Please try again." },
        { status: 500 }
      )
    }

    setJwt(newToken)
    return NextResponse.json({ success: true, isNewUser: true })
  } catch (err) {
    console.error("[otp/verify] Medusa customer creation failed:", err)
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    )
  }
}
