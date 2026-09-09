"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

/**
 * The Personal Assistant's reminders, read and written on behalf of the signed-in customer.
 *
 * ── Why the token never reaches the browser ────────────────────────────────────────────────────
 * These go straight to the backend with the customer's `_medusa_jwt`, which lives in an httpOnly
 * cookie and must stay there. Doing this from the page would mean either exposing the token or
 * opening CORS on an authenticated endpoint; on the server it is neither.
 *
 * ── Why failures come back as messages rather than exceptions ──────────────────────────────────
 * Every one of these is called from a form. A thrown error becomes an error page, and losing what
 * somebody just typed because the backend hiccuped is a poor trade for a reminder about their mum's
 * birthday. The caller gets `{ ok: false, error }` and can say so in place.
 */

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export interface Reminder {
  id: string
  title: string
  notes: string
  eventDate: string
  repeatRule: "once" | "yearly"
  leadDays: number
  isActive: boolean
  /** The next occurrence we have queued, or null when there is nothing further to send. */
  nextOccurrence: string | null
  nextDueAt: string | null
  lastSentAt: string | null
  lastStatus: string | null
  lastError: string | null
}

export interface ActionResult {
  ok: boolean
  error?: string
}

async function authHeaders(): Promise<Record<string, string> | null> {
  const token = cookies().get("_medusa_jwt")?.value
  if (!token) return null
  return { "Content-Type": "application/json", authorization: `Bearer ${token}` }
}

/** Everything this customer has asked to be reminded about. Empty when signed out. */
export async function listReminders(): Promise<Reminder[]> {
  const headers = await authHeaders()
  if (!headers) return []

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/crossfriend/reminders`, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = (await res.json()) as { reminders?: Reminder[] }
    return data.reminders ?? []
  } catch {
    return []
  }
}

/** Reads the error the backend sent, so the person sees why rather than "something went wrong". */
async function messageFrom(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    return data.error || fallback
  } catch {
    return fallback
  }
}

export async function createReminder(formData: FormData): Promise<ActionResult> {
  const headers = await authHeaders()
  if (!headers) return { ok: false, error: "Please sign in first." }

  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    eventDate: String(formData.get("eventDate") ?? ""),
    repeatRule: formData.get("repeatRule") === "yearly" ? "yearly" : "once",
    leadDays: Number(formData.get("leadDays") ?? 0),
  }

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/crossfriend/reminders`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    if (!res.ok) return { ok: false, error: await messageFrom(res, "Could not save that reminder.") }
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." }
  }

  revalidatePath("/assistant")
  return { ok: true }
}

export async function updateReminder(
  id: string,
  changes: Partial<Pick<Reminder, "title" | "notes" | "eventDate" | "repeatRule" | "leadDays" | "isActive">>
): Promise<ActionResult> {
  const headers = await authHeaders()
  if (!headers) return { ok: false, error: "Please sign in first." }

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/crossfriend/reminders/${id}`, {
      method: "POST",
      headers,
      body: JSON.stringify(changes),
      cache: "no-store",
    })
    if (!res.ok) return { ok: false, error: await messageFrom(res, "Could not save that change.") }
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." }
  }

  revalidatePath("/assistant")
  return { ok: true }
}

export async function deleteReminder(id: string): Promise<ActionResult> {
  const headers = await authHeaders()
  if (!headers) return { ok: false, error: "Please sign in first." }

  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/crossfriend/reminders/${id}`, {
      method: "DELETE",
      headers,
      cache: "no-store",
    })
    if (!res.ok) return { ok: false, error: await messageFrom(res, "Could not delete that.") }
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." }
  }

  revalidatePath("/assistant")
  return { ok: true }
}
