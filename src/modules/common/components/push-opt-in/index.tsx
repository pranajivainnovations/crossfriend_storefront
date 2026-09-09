"use client"

import { useEffect, useState } from "react"

import { getPushKey, subscribeToPush, unsubscribeFromPush } from "@lib/data/push"

/**
 * Asking a visitor whether they want notifications.
 *
 * ── Why this is not shown on page load ─────────────────────────────────────────────────────────
 * A permission prompt that appears before anybody has asked for one is the fastest route to being
 * permanently blocked. Browsers remember a refusal, several now penalise sites that prompt
 * unprompted, and the visitor cannot easily undo it — one badly-timed prompt costs that person
 * forever, not just today. So the browser is only ever asked after a deliberate click on our own
 * card, and the card itself only appears once somebody has generated a design.
 *
 * That moment is chosen on purpose. It is the point of highest investment on the whole site: they
 * described a cake and watched it appear, so an offer to tell them about new styles and offers reads
 * as a continuation rather than an interruption. Asking a stranger on arrival would reach more
 * people and convert far fewer of them, and would spend the one chance we get with each.
 *
 * ── Why it says what it will send ──────────────────────────────────────────────────────────────
 * Consent has to be specific to be meaningful, and under the DPDP Act it has to be demonstrable.
 * The card names what will arrive before the browser prompt appears, and the context is recorded
 * with the subscription so the record says what was agreed to, not merely that something was.
 */

type State = "checking" | "hidden" | "off" | "on" | "working" | "blocked"

/** VAPID keys travel as base64url; PushManager wants raw bytes. */
function urlBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(normalised)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  /* An ArrayBuffer, not the Uint8Array: applicationServerKey is typed as BufferSource backed by a
     real ArrayBuffer, and a Uint8Array is typed over ArrayBufferLike. Same bytes either way. */
  return output.buffer
}

export default function PushOptIn({
  context = "unknown",
  compact = false,
}: {
  /** Which screen is asking. Stored as the consent context — see the note above. */
  context?: string
  /** A single line rather than a card, for placing in a footer. */
  compact?: boolean
}) {
  const [state, setState] = useState<State>("checking")
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const read = async () => {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        // Includes an iPhone in a normal Safari tab, where the API exists only for a site added to
        // the Home Screen. Nothing here can fix that, so the card stays out of the way entirely
        // rather than offering a button that cannot work.
        if (!cancelled) setState("hidden")
        return
      }

      /**
       * The key is fetched on mount, not inside the click handler.
       *
       * Notification.requestPermission() has to be reached in the same task as the tap or Safari
       * discards the user activation and silently refuses. An awaited server action before it would
       * break exactly that — the same rule that governs navigator.share elsewhere in this codebase.
       */
      const key = await getPushKey()
      if (cancelled) return
      if (!key) {
        setState("hidden")
        return
      }
      setPublicKey(key)

      if (Notification.permission === "denied") {
        setState("blocked")
        return
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js")
        const existing = await registration?.pushManager.getSubscription()
        if (!cancelled) setState(existing ? "on" : "off")
      } catch {
        if (!cancelled) setState("off")
      }
    }

    void read()
    return () => {
      cancelled = true
    }
  }, [])

  const enable = async () => {
    if (!publicKey) return
    setState("working")
    setNote(null)

    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off")
        return
      }

      const registration = await navigator.serviceWorker.register("/sw.js")
      // register() resolves before the worker can be used; subscribing against one that is still
      // installing fails intermittently, which is the worst kind of bug to chase.
      await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        // Chrome refuses a subscription without it, and a silent push is exactly the capability
        // browsers spent years removing.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(publicKey),
      })

      const json = subscription.toJSON()
      const saved = await subscribeToPush({
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        context,
      })

      if (!saved) {
        /* Rolled back rather than left half-done. A browser subscribed to a push service we have no
           record of is a subscription nobody can ever send to and nobody can ever switch off. */
        await subscription.unsubscribe().catch(() => {})
        setNote("Could not turn these on. Please try again.")
        setState("off")
        return
      }

      setState("on")
      setNote("You're set — we'll let you know.")
    } catch (error) {
      console.error("[push] enable failed", error)
      setNote("Your browser refused notifications here.")
      setState("off")
    }
  }

  const disable = async () => {
    setState("working")
    setNote(null)
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js")
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        // The browser first, then our record. In that order, because if the second call fails the
        // person is still off — the reverse would leave them subscribed after being told they were
        // not, which is the failure that matters.
        await subscription.unsubscribe().catch(() => {})
        await unsubscribeFromPush(subscription.endpoint)
      }
      setState("off")
      setNote("Turned off.")
    } catch {
      setState("on")
      setNote("Could not turn these off. Please try again.")
    }
  }

  if (state === "checking" || state === "hidden") return null

  if (state === "blocked") {
    // Only the person can undo a denial, in their browser's settings. Saying so is more use than a
    // button that would do nothing — and in the compact placement, silence is better than a
    // paragraph about browser settings in a footer.
    if (compact) return null
    return (
      <p className="text-xs text-slate-400">
        Notifications are blocked for this site in your browser settings.
      </p>
    )
  }

  const busy = state === "working"

  if (compact) {
    return (
      <button
        type="button"
        onClick={state === "on" ? disable : enable}
        disabled={busy}
        className="text-xs text-slate-400 underline underline-offset-2 transition hover:text-slate-600 disabled:opacity-60"
      >
        {busy ? "…" : state === "on" ? "Turn off notifications" : "Get notified about offers"}
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cf-purple-200 bg-cf-purple-50/50 px-4 py-3">
      <span className="text-2xl" aria-hidden="true">
        {state === "on" ? "🔔" : "🎂"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">
          {state === "on" ? "Notifications are on" : "Want to know when we add new styles?"}
        </p>
        {/* Named before the prompt appears, not after. This sentence is the consent. */}
        <p className="mt-0.5 text-xs text-slate-500">
          {state === "on"
            ? note ?? "We'll send offers and new cake styles. Turn them off any time."
            : note ?? "Offers and new cake styles, now and then. No spam, off in one click."}
        </p>
      </div>
      <button
        type="button"
        onClick={state === "on" ? disable : enable}
        disabled={busy}
        className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition disabled:opacity-60 ${
          state === "on"
            ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            : "bg-cf-purple-600 text-white hover:bg-cf-purple-700"
        }`}
      >
        {busy ? "…" : state === "on" ? "Turn off" : "Notify me"}
      </button>
    </div>
  )
}
