/**
 * The site-wide announcement banner, composed in OPS.
 *
 * ── Why the cache window is short ──────────────────────────────────────────────────────────────
 * Sixty seconds, against the hour used for contact details. The two are different in kind: a phone
 * number is corrected occasionally and nobody is watching the clock, whereas an announcement is
 * taken down *because something is wrong* — a sold-out offer, a wrong date, an outage that has been
 * fixed. The value of "Take it down" is measured in how fast it disappears, and an hour of cache
 * would make that button a lie.
 *
 * ── Why failure is silence ─────────────────────────────────────────────────────────────────────
 * Every failure path returns null and the banner simply does not render. This sits above every page
 * on the site; a backend blip must cost a banner, never the page under it. There is deliberately no
 * fallback content — unlike contact details, there is no correct value to fall back to. The honest
 * answer to "is anything being announced right now" when we cannot tell is nothing.
 */

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export interface Announcement {
  id: string
  title: string
  body: string
  imageUrl: string | null
  /** A key from the shared preset list, never a colour value. See the renderer. */
  theme: string
  ctaLabel: string | null
  ctaUrl: string | null
}

export async function getAnnouncement(): Promise<Announcement | null> {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/crossfriend/announcement`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null

    const data = (await res.json()) as { announcement?: Announcement | null }
    const announcement = data.announcement
    if (!announcement?.id || !announcement.title) return null

    return announcement
  } catch {
    return null
  }
}
