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

  /**
   * One button, rendered in one of two places depending on the width.
   *
   * On a desktop row it belongs at the end of the line, beside the dismiss control. On a phone the
   * line is four or five lines tall, and a button squeezed into that column shrinks the message to a
   * ribbon of two-word rows — so it goes underneath the text instead, full-width enough to hit.
   * Declared once and placed twice, rather than written twice with two sets of classes to keep in
   * step.
   */
  const cta =
    announcement.ctaLabel && announcement.ctaUrl ? (
      <a
        href={announcement.ctaUrl}
        className="inline-block rounded-lg bg-white/95 px-3.5 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-white"
      >
        {announcement.ctaLabel}
      </a>
    ) : null

  return (
    <div className={theme}>
      {/* items-start on a phone so the close button sits at the top of a tall block rather than
          floating in the middle of the message; centred again once the row is one line high. */}
      <div className="content-container flex items-start gap-3 py-3 small:items-center small:py-2.5">
        {announcement.imageUrl && (
          /**
           * Deliberately larger on a phone than on a desktop, which is the opposite of the usual
           * instinct.
           *
           * At 36px beside five wrapped lines of text it read as an icon — present in the markup,
           * invisible as a picture, and the thing somebody chose to upload was the one part of the
           * banner nobody could see. On a desktop the same 36px sits beside a single line and is in
           * proportion, so the small size stays where it works.
           */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={announcement.imageUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-white/40 small:h-9 small:w-9 small:rounded-lg"
            loading="lazy"
          />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug">{announcement.title}</p>
          {announcement.body && (
            <p className="mt-0.5 text-xs leading-snug opacity-90">{announcement.body}</p>
          )}
          {cta && <div className="mt-2 small:hidden">{cta}</div>}
        </div>

        {cta && <div className="hidden shrink-0 small:block">{cta}</div>}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="-mr-1.5 shrink-0 rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white small:mr-0"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
