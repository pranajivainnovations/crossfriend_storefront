import { ENTITY } from "@lib/constants/legal"

/**
 * Contact details and social links, editable in OPS without a redeploy.
 *
 * The reason this exists: the WhatsApp button on every page was hardcoded to 919876543210 — the
 * standard dummy Indian number — in three separate files, with a "Replace with actual number"
 * comment still attached. Nothing about the site looked broken, so nobody caught it. Values that
 * live in component source get set once and then quietly rot.
 *
 * ── Defaults are not empty ─────────────────────────────────────────────────────────────────────
 * Every setting falls back to the compiled-in value from legal.ts, which is the same detail printed
 * on the six legal pages. If the backend is unreachable, the site shows correct contact information
 * from the bundle rather than a blank space or a dead link. A failure here removes the ability to
 * CHANGE a phone number for a minute; it never removes the phone number.
 *
 * Plain fetch, not the Medusa JS client — that client uses axios, which silently ignores Next's
 * `next: { revalidate }`, so a cached response would never refresh.
 */

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export interface SiteSettings {
  whatsappNumber: string
  supportPhone: string
  supportEmail: string
  grievanceName: string
  grievanceEmail: string
  /** Only the profiles that are actually configured, in display order. */
  socialLinks: { label: string; url: string }[]
}

/** Used when the backend is unreachable, and as the value for any setting left blank in OPS. */
const DEFAULTS: SiteSettings = {
  // Derived from the support number rather than written again, so the two cannot drift apart.
  whatsappNumber: ENTITY.supportPhone.replace(/\D/g, ""),
  supportPhone: ENTITY.supportPhone,
  supportEmail: ENTITY.supportEmail,
  grievanceName: ENTITY.grievanceOfficer.name,
  grievanceEmail: ENTITY.grievanceOfficer.email,
  socialLinks: [],
}

const SOCIAL_ORDER: { key: string; label: string }[] = [
  { key: "google_business_url", label: "Google" },
  { key: "instagram_url", label: "Instagram" },
  { key: "facebook_url", label: "Facebook" },
  { key: "linkedin_url", label: "LinkedIn" },
  { key: "youtube_url", label: "YouTube" },
  { key: "x_url", label: "X" },
]

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/crossfriend/settings`, {
      // Long enough that a crawler cannot make this query run per page view, short enough that an
      // ops correction to a wrong phone number is live within a minute.
      next: { revalidate: 60, tags: ["site-settings"] },
    })
    if (!res.ok) return DEFAULTS

    const data = (await res.json()) as { settings?: Record<string, string> }
    const s = data.settings ?? {}

    // `|| DEFAULTS.x` rather than `??`: a setting cleared to "" in OPS should fall back to the
    // known-good value, not blank the field. Social links are the deliberate exception — there,
    // empty genuinely means "we don't have one, don't render it".
    return {
      whatsappNumber: (s.whatsapp_number || DEFAULTS.whatsappNumber).replace(/\D/g, ""),
      supportPhone: s.support_phone || DEFAULTS.supportPhone,
      supportEmail: s.support_email || DEFAULTS.supportEmail,
      grievanceName: s.grievance_name || DEFAULTS.grievanceName,
      grievanceEmail: s.grievance_email || DEFAULTS.grievanceEmail,
      socialLinks: SOCIAL_ORDER.filter(({ key }) => (s[key] || "").trim()).map(({ key, label }) => ({
        label,
        url: s[key].trim(),
      })),
    }
  } catch (error) {
    console.error("[site-settings] falling back to compiled-in defaults", error)
    return DEFAULTS
  }
}

/** `https://wa.me/…` for a number, with an optional prefilled message. */
export function whatsappUrl(number: string, message?: string): string {
  const digits = number.replace(/\D/g, "")
  return message
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digits}`
}
