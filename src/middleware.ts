import { NextRequest, NextResponse } from "next/server"

import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
  normaliseReferralParam,
} from "@lib/referral"

/**
 * Simplified middleware for CrossFriend — India-only storefront.
 * No [countryCode] routing. Flat URLs like /occasions/birthday, /store, /cart.
 *
 * Future: Reintroduce dynamic routing as [region] for city/area support
 * e.g., /ghaziabad/occasions/birthday
 */

/**
 * Remembers who sent this visitor, on whichever page they landed on.
 *
 * ── Why the middleware and not a page ──────────────────────────────────────────────────────────
 * A referral link points at whatever the sharer was looking at — a product, a category, the home
 * page — so there is no single page to put this on. The middleware sees all of them, and it sees
 * them before anything renders, so the code is captured even if the visitor closes the tab a second
 * later.
 *
 * ── First touch, checked against the cookie already present ────────────────────────────────────
 * A second link from a different sharer does not overwrite the first. See @lib/referral for why the
 * rule lives in two places.
 *
 * Applied by stamping the response the middleware was going to return anyway, so this cannot change
 * any redirect the cart or onboarding logic decided on.
 */
function captureReferral(request: NextRequest, response: NextResponse): NextResponse {
  if (request.cookies.get(REFERRAL_COOKIE)) return response

  const code = normaliseReferralParam(request.nextUrl.searchParams.get("ref"))
  if (!code) return response

  response.cookies.set(REFERRAL_COOKIE, code, {
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    httpOnly: true,
    /* Lax, not strict: the visit that carries the code is by definition a navigation from somewhere
       else — a WhatsApp message, an Instagram bio — and a strict cookie set on that request would be
       withheld from it. */
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  return response
}

export async function middleware(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const isOnboarding = searchParams.get("onboarding") === "true"
  const cartId = searchParams.get("cart_id")
  const checkoutStep = searchParams.get("step")
  const onboardingCookie = request.cookies.get("_medusa_onboarding")
  const cartIdCookie = request.cookies.get("_medusa_cart_id")

  // If no special params, pass through
  if (
    (!isOnboarding || onboardingCookie) &&
    (!cartId || cartIdCookie)
  ) {
    return captureReferral(request, NextResponse.next())
  }

  let redirectUrl = request.nextUrl.href
  let response = NextResponse.redirect(redirectUrl, 307)

  // If a cart_id is in the params, set it as a cookie and redirect to the address step.
  if (cartId && !checkoutStep) {
    redirectUrl = `${redirectUrl}&step=address`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
    response.cookies.set("_medusa_cart_id", cartId, { maxAge: 60 * 60 * 24 })
  }

  // Set a cookie to indicate that we're onboarding.
  if (isOnboarding) {
    response.cookies.set("_medusa_onboarding", "true", {
      maxAge: 60 * 60 * 24,
    })
  }

  return captureReferral(request, response)
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico).*)"],
}
