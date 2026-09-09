"use server"

/**
 * Subscribing this browser to CrossFriend notifications.
 *
 * ── Why these are server actions and not a fetch from the browser ──────────────────────────────
 * The subscription goes to the Medusa backend, which is a different origin. Calling it from the page
 * would need CORS opened on a public write endpoint, and would put the backend's address into every
 * client bundle for anyone to point a script at. Going through the server keeps the write on our own
 * origin and leaves the backend reachable only from where it should be.
 *
 * ── Why the VAPID key is fetched rather than inlined ───────────────────────────────────────────
 * The browser needs the public key to subscribe, which makes `NEXT_PUBLIC_VAPID_PUBLIC_KEY` the
 * obvious move. It is a trap in this codebase: `NEXT_PUBLIC_*` is inlined at *build* time inside the
 * Docker builder stage, so the value would have to exist as a build argument rather than on the
 * server — and a missing one produces a site that builds cleanly and fails silently at runtime. That
 * mistake has already cost two deploys here, so the key is read at runtime and handed out by this
 * action instead.
 *
 * ── Why everything fails quietly ───────────────────────────────────────────────────────────────
 * Notifications are an extra. A backend blip must never surface as an error on a page somebody is
 * using to design a cake, so every path returns a plain false and the control simply says it did not
 * work.
 */

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

/** The public half of the VAPID pair, or null when notifications are not configured on this server. */
export async function getPushKey(): Promise<string | null> {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null
}

export interface PushSubscriptionInput {
  endpoint: string
  p256dh: string
  auth: string
  /** Which screen asked, recorded as the consent context. */
  context: string
}

export async function subscribeToPush(input: PushSubscriptionInput): Promise<boolean> {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/crossfriend/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    })
    return res.ok
  } catch {
    return false
  }
}

export async function unsubscribeFromPush(endpoint: string): Promise<boolean> {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/crossfriend/push/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
      cache: "no-store",
    })
    return res.ok
  } catch {
    return false
  }
}
