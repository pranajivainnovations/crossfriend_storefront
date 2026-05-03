import { NextRequest, NextResponse } from "next/server"

/**
 * Simplified middleware for CrossFriend — India-only storefront.
 * No [countryCode] routing. Flat URLs like /occasions/birthday, /store, /cart.
 *
 * Future: Reintroduce dynamic routing as [region] for city/area support
 * e.g., /ghaziabad/occasions/birthday
 */
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
    return NextResponse.next()
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

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico).*)"],
}
