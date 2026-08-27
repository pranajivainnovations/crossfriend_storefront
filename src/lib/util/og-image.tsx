import fs from "node:fs"
import path from "node:path"

import { ImageResponse } from "next/og"

/**
 * The font, supplied explicitly rather than left to @vercel/og's default.
 *
 * Its built-in loader does `fileURLToPath(path.join(import.meta.url, "../noto-sans-...ttf"))`, and
 * `path.join` on a file:// URL mangles it — backslashes on Windows, a collapsed `file:/` on Linux.
 * Both throw, so every image route failed to prerender with "TypeError: Invalid URL" regardless of
 * platform. Passing `fonts` skips that code path entirely.
 *
 * The file is the same OFL-licensed Noto Sans that ships inside the dependency, vendored into
 * `public/` so the build does not reach into node_modules internals and so it survives in the
 * standalone output — the Dockerfile already copies `public/`, which the dynamic routes need at
 * request time.
 *
 * Read once at module scope: these routes render per request for the dynamic pages, and re-reading
 * 27KB from disk on every social-crawler hit would be pure waste.
 */
const FONT = fs.readFileSync(
  path.join(process.cwd(), "public", "fonts", "noto-sans-regular.ttf")
)

/**
 * One weight registered under both 400 and 700.
 *
 * Only the regular face is available, and satori does not synthesise bold — an unmatched 700 would
 * silently fall back to a system font and change the card's look between environments. Registering
 * the same file for both keeps rendering identical everywhere; hierarchy comes from size and colour
 * instead, which is where it was doing most of the work anyway.
 */
const FONTS = [
  { name: "Noto Sans", data: FONT, weight: 400 as const, style: "normal" as const },
  { name: "Noto Sans", data: FONT, weight: 700 as const, style: "normal" as const },
]

/**
 * The shared Open Graph card.
 *
 * Nine indexable routes were sharing one generic site image, so a link to "Birthday cakes" and a
 * link to "Ready to order" looked identical in WhatsApp — which is where most of this site's links
 * are actually shared. The image is the largest element in a link preview and the only part read
 * before the text, so identical images means the page title is doing all the work at the smallest
 * type in the card.
 *
 * Generated per route rather than designed per route: there is no design resource for nine images,
 * and hand-exported files go stale the moment a page is renamed. Passing the page's own title in
 * makes the card specific at no ongoing cost.
 */

/** Facebook and WhatsApp both crop toward 1.91:1; 1200×630 is the size everything agrees on. */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

export function ogImage({
  title,
  eyebrow,
  subtitle,
}: {
  title: string
  /** The section this page belongs to — "Occasion", "Collection", "Shop". */
  eyebrow?: string
  subtitle?: string
}) {
  /**
   * Long titles shrink rather than wrap indefinitely. A baker name or a collection handle can be
   * far longer than "Birthday", and without this the text either overflows the card or pushes the
   * wordmark off the bottom — both of which look like a broken image rather than a long title.
   */
  const titleSize = title.length > 46 ? 62 : title.length > 28 ? 76 : 92

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #7B2FF7 0%, #8B47FF 45%, #FF2D87 100%)",
          color: "#FFFFFF",
          fontFamily: "Noto Sans",
        }}
      >
        {eyebrow ? (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "10px 22px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.18)",
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 400,
                color: "rgba(255,255,255,0.86)",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 13,
              background: "#FFFFFF",
              color: "#7B2FF7",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 600 }}>crossfriend.in</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: FONTS }
  )
}

/** `birthday-cakes` → `Birthday Cakes`, for routes whose param is all the name we have. */
export function titleFromHandle(handle: string): string {
  return decodeURIComponent(handle)
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
