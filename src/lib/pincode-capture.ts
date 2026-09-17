/**
 * The one place a confirmed pincode is recorded, wherever it was typed.
 *
 * ── Why this exists as a standalone function ───────────────────────────────────────────────────
 * A visitor can tell us their area in four different places: the prompt on arrival, the bar that
 * follows it, the cake studio when they price a design, and the delivery address at checkout. Each
 * of those screens has its own state and its own reason to exist, and none of them knew about the
 * others — so three of the four told us nothing, and the welcome bonus was left waiting on the only
 * one that did.
 *
 * Making each screen adopt a shared context would have meant rewriting three working flows. This is
 * the smaller idea: they keep their own state, and each calls this at the moment the pincode is
 * confirmed. One line per screen, and the plumbing lives here.
 *
 * ── What it does ───────────────────────────────────────────────────────────────────────────────
 * Writes the pincode where the server can read it, and asks whether a welcome bonus is owed. Both are
 * safe to repeat: the cookie is overwritten with the same value, and the backend grants at most once
 * per customer whatever happens.
 *
 * ── Why nothing is awaited and nothing is returned ─────────────────────────────────────────────
 * Every caller is in the middle of doing something the customer asked for — pricing a cake, checking
 * delivery, filling an address. None of them should wait on a promotions call, and none of them has
 * anything useful to do if it fails. A bonus that could not be claimed now is claimed on the next
 * sign-in or the next time a pincode is entered.
 */

export const PINCODE_COOKIE = "cf_pincode"
const PINCODE_COOKIE_DAYS = 180

/** Six digits, not starting with zero — the shape of an Indian pincode. */
function isPincode(code: string): boolean {
  return /^[1-9][0-9]{5}$/.test(code)
}

/**
 * Remembers the pincode where the server can see it.
 *
 * Not httpOnly, because the page sets it. There is nothing to protect: a visitor editing their own
 * pincode cookie is a visitor typing a different pincode into the box, which they may do anyway. What
 * it must never be is the last word on where an order is delivered — that comes from the address on
 * the order, and every reward that pays on delivery reads it from there.
 */
export function writePincodeCookie(code: string | null): void {
  if (typeof document === "undefined") return
  if (code) {
    const expires = new Date(Date.now() + PINCODE_COOKIE_DAYS * 86400000).toUTCString()
    document.cookie = `${PINCODE_COOKIE}=${encodeURIComponent(code)}; path=/; expires=${expires}; samesite=lax`
  } else {
    document.cookie = `${PINCODE_COOKIE}=; path=/; max-age=0; samesite=lax`
  }
}

/**
 * Called wherever a customer confirms where they are.
 *
 * Silently does nothing for anything that is not a pincode, so a caller can hand it a half-typed
 * field without checking first.
 */
export function capturePincode(code: string | null | undefined): void {
  const trimmed = String(code ?? "").trim()
  if (!isPincode(trimmed)) return

  writePincodeCookie(trimmed)

  /* Signed out, this returns "nothing granted" and costs one request. Asking anyway is simpler and
     cheaper than teaching four screens how to know whether somebody is signed in. */
  void fetch("/api/wallet/welcome", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pincode: trimmed }),
  }).catch(() => {})
}
