import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

/**
 * Revalidation endpoint — clears Next.js page cache after config changes.
 *
 * Use after editing src/lib/config/type-occasion-map.json on the server.
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

  // Revalidate all known occasion pages + home
  const paths = [
    "/",
    "/occasions",
    "/occasions/birthday",
    "/occasions/anniversary",
    "/occasions/festival",
    "/occasions/kids",
    "/occasions/special",
  ]

  for (const p of paths) {
    revalidatePath(p)
  }

  return NextResponse.json({ revalidated: true, paths })
}
