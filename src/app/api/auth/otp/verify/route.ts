import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

import { REFERRAL_COOKIE } from "@lib/referral"

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const FLOW = "ai_studio_login"

/**
 * POST /api/auth/otp/verify
 *
 * Verifies the code with the backend and puts the returned session in a cookie.
 *
 * ── What used to be here, and why it is gone ───────────────────────────────────────────────────
 * This file used to derive a Medusa password from the mobile number and a shared salt, then log in
 * with it — plus a fallback to a hardcoded constant for accounts created before a real salt existed.
 *
 * Both were the same mistake in different sizes: a password anybody could compute. The salt was a
 * master key to every customer, and the constant needed no key at all. Neither could be revoked for
 * one account, and neither was protected by anything on the OTP path — an attacker went straight to
 * `POST /store/auth` with a computed password and never requested a code at all.
 *
 * The backend now issues the session itself, in the same request that verifies the code. Customers
 * have random passwords that nothing recomputes and nobody knows. There is no secret in this file.
 *
 * ── Why the cookie is still set here ───────────────────────────────────────────────────────────
 * The token has to become an httpOnly cookie on this origin, and only this origin can set it. That
 * is the whole remaining job. A future mobile app would call the backend directly and keep the token
 * itself, which the old cookie-only design could not support.
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

  let data: { verified?: boolean; token?: string; isNewUser?: boolean; error?: string }
  let status: number

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/crossfriend/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp, flow: FLOW }),
      cache: "no-store",
    })
    status = res.status
    data = await res.json().catch(() => ({}))
  } catch (error) {
    console.error("[otp/verify] backend unreachable", error)
    return NextResponse.json(
      { error: "Could not verify the code right now. Please try again." },
      { status: 502 }
    )
  }

  /* Both conditions, not either. A response missing the token is not a sign-in however cheerful its
     body is — and setting a cookie from an absent value would produce a session that looks real and
     authenticates as nobody. */
  if (!data.verified || !data.token) {
    return NextResponse.json(
      { error: data.error ?? "Incorrect code. Please try again." },
      { status: status === 500 ? 502 : status || 400 }
    )
  }

  /**
   * Thirty days, matching the token's own lifetime.
   *
   * It was seven, which meant a customer who visits monthly did an OTP every single time — friction
   * for them and a per-message cost to us, on an identity they had already proved. A cookie outliving
   * its token would be worse than either: a browser that believes it is signed in and is silently
   * rejected by every request.
   */
  cookies().set("_medusa_jwt", data.token, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })

  const referral = await claimPendingReferral(data.token)

  return NextResponse.json({
    success: true,
    isNewUser: data.isNewUser === true,
    referral,
  })
}

/**
 * Spends the referral cookie, if this visitor arrived with one.
 *
 * ── Why it runs on every sign-in and not only on a new account ─────────────────────────────────
 * `isNewUser` is right here and it would be the obvious gate. It is the wrong one: somebody who
 * signed up months ago, never ordered, and has now been talked into it by a friend is exactly what a
 * referral is, and gating on account creation refuses them. The backend's rule is "has never
 * ordered", which is the event that actually says the customer was already ours — so the decision
 * belongs there, and this sends every code it holds and lets the backend decline.
 *
 * ── Why a failure here cannot fail a sign-in ───────────────────────────────────────────────────
 * The session is already set by the time this runs. A customer who cannot get into their account
 * because a referral lookup timed out would be a catastrophic trade for a feature that credits
 * somebody else a few rupees, so every outcome — declined, unreachable, malformed — returns quietly
 * and the sign-in succeeds regardless.
 *
 * ── Why the cookie survives a network failure ──────────────────────────────────────────────────
 * It is cleared when the backend gives an answer, including a refusal, because in every one of those
 * cases the code has been considered and is finished with. It is deliberately kept when the backend
 * could not be reached at all: that referral has not been declined, it has not been asked, and
 * throwing it away would lose a real attribution to a momentary blip.
 */
async function claimPendingReferral(
  token: string
): Promise<{ attributed: boolean; message: string } | null> {
  const code = cookies().get(REFERRAL_COOKIE)?.value
  if (!code) return null

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/referral/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code, brand: "crossfriend" }),
      cache: "no-store",
    })

    /* A 5xx is the backend failing, not declining — treated like unreachable, cookie kept. */
    if (res.status >= 500) return null

    const result = (await res.json().catch(() => ({}))) as {
      attributed?: boolean
      message?: string
    }

    cookies().delete(REFERRAL_COOKIE)

    return {
      attributed: result.attributed === true,
      message: result.message ?? "",
    }
  } catch (error) {
    console.error("[otp/verify] referral claim failed", error)
    return null
  }
}
