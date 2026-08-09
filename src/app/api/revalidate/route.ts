import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

import { getOccasions } from "@lib/data/dynamic"

/**
 * Revalidation endpoint — clears Next.js page cache after a taxonomy change.
 *
 * Optional: the taxonomy is read on a 60s window, so an OPS edit appears on its own within a
 * minute. Call this to make it immediate.
 *
 * Usage:
 *   curl -X POST "https://your-domain.com/api/revalidate" \
 *        -H "Content-Type: application/json" \
 *        -d '{"secret": "YOUR_REVALIDATE_SECRET"}'
 *
 * Optional: pass a specific path to revalidate only that page:
 *   -d '{"secret": "...", "path": "/occasions/anniversary"}'
 *
 * Omit path to revalidate all occasion pages + home page.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET

  if (!secret) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET is not configured on this server." },
      { status: 500 }
    )
  }

  let body: { secret?: string; path?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (body.secret !== secret) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 })
  }

  // Revalidate a specific path or all occasion + home pages
  if (body.path) {
    revalidatePath(body.path)
    return NextResponse.json({ revalidated: true, path: body.path })
  }

  // Drop the cached taxonomy first, so the occasion list below is read fresh rather than from the
  // 60s window we are trying to bypass — and so every page that renders navigation picks up an OPS
  // change on its next request instead of waiting out the window.
  revalidateTag("taxonomy")

  // Occasion paths are derived, not listed. The previous hardcoded array could not know about an
  // occasion added in OPS, so a new one would have kept serving a stale page until it happened to
  // expire — the same "config that silently disagrees with the database" problem this whole change
  // set exists to remove.
  const occasions = await getOccasions()
  const paths = ["/", "/occasions", ...occasions.map((o) => `/occasions/${o.slug}`)]

  for (const p of paths) {
    revalidatePath(p)
  }

  return NextResponse.json({ revalidated: true, paths })
}
