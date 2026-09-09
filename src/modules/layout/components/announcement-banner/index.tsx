"use client"

import { useEffect, useState } from "react"

import type { Announcement } from "@lib/data/announcement"

/**
 * The announcement banner.
 *
 * ── Why the theme is a key and not a colour ────────────────────────────────────────────────────
 * OPS stores a preset name; this file owns what that name looks like. Two reasons. Tailwind reads
 * source text, so a class assembled from a database value would never be generated and the banner
 * would render unstyled. And a colour value crossing the wire is a colour value somebody can get
 * wrong — an unreadable banner published site-wide is not a mistake a colour picker can catch,
 * whereas an unknown key here just falls back to brand.
 *
 * ── Why it can be dismissed, and why that is remembered per announcement ───────────────────────
 * A banner nobody can close is a banner people learn to scroll past, and it costs the top of every
 * page forever. Dismissal is keyed by announcement id, so closing today's does not silently hide
 * tomorrow's — which would be the worst outcome: the team publishing something urgent that a chunk
 * of visitors never see because they closed an unrelated one last month.
 *
 * ── Why it renders nothing on the server pass ──────────────────────────────────────────────────
 * Whether it was dismissed lives in localStorage, which does not exist during server rendering. If
 * the banner rendered on the server and then vanished on hydration, every page would visibly jump.
 * So the first client pass decides, and the space is never reserved for something that may not
 * appear.
 */

const THEMES: Record<string, string> = {
  purple: "bg-gradient-to-r from-cf-purple-600 to-fuchsia-600 text-white",
  warm: "bg-gradient-to-r from-orange-500 to-amber-500 text-white",
  info: "bg-sky-600 text-white",
  alert: "bg-red-600 text-white",
}

const dismissKey = (id: string) => `cf-announcement-dismissed-${id}`

export default function AnnouncementBanner({ announcement }: { announcement: Announcement }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(dismissKey(announcement.id)) === null)
    } catch {
      // Private mode, blocked storage, an unusual browser. Showing the banner is the right failure:
      // the cost is a banner somebody has to close twice, not a message nobody sees.
      setVisible(true)
    }
  }, [announcement.id])

  if (!visible) return null

  const theme = THEMES[announcement.theme] ?? THEMES.purple

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(dismissKey(announcement.id), "1")
    } catch {
      // Closing still works for this page view even if the choice cannot be remembered.
    }
  }

  return (
    <div className={theme}>
      <div className="content-container flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
        {announcement.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={announcement.imageUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-white/40"
            loading="lazy"
          />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug">{announcement.title}</p>
          {announcement.body && (
            <p className="mt-0.5 text-xs leading-snug opacity-90">{announcement.body}</p>
          )}
        </div>

        {announcement.ctaLabel && announcement.ctaUrl && (
          <a
            href={announcement.ctaUrl}
            className="shrink-0 rounded-lg bg-white/95 px-3.5 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-white"
          >
            {announcement.ctaLabel}
          </a>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
