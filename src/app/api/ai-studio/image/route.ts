import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/ai-studio/image?url=<absolute design image URL>
 *
 * Streams a design image back through our own origin.
 *
 * ── Why this exists ────────────────────────────────────────────────────────────────────────────
 * `navigator.share({ files })` needs the actual bytes of the image, which means the browser has to
 * `fetch()` it and read the response body. Reading a cross-origin response body requires the remote
 * host to send CORS headers, and an S3 bucket does not unless someone has configured it to. Ours has
 * not — the storefront only ever renders these images in `<img>` tags, which needs no CORS at all,
 * so nothing has forced the question until now.
 *
 * Rather than change bucket configuration from here — the buckets are shared with other services and
 * their settings are maintained by hand — the bytes are relayed from same-origin, where CORS does not
 * apply. This also means the share path keeps working if the images ever move to a different host.
 *
 * ── Why a URL parameter is safe here, and how it is kept that way ──────────────────────────────
 * Passing a URL to a server that then fetches it is the shape of an SSRF, so the host is checked
 * against a fixed list before anything is requested. The list is the same one `next.config.js`
 * already allows `next/image` to load from, which is the honest boundary: these are exactly the
 * hosts whose bytes this site already serves to browsers, and every object on them is public-read
 * already. Anything else is refused without a request being made.
 *
 * Note the ordering — the allow-list is checked against the *parsed* hostname, never against the
 * raw string. `https://evil.example/?x=pranajiva-innovations.s3.eu-north-1.amazonaws.com` contains
 * an allowed host as a substring while pointing somewhere else entirely.
 */

/** Hosts whose objects this site already serves. Mirrors `images.remotePatterns` in next.config.js. */
const ALLOWED_HOSTS = new Set([
  "pranajiva-innovations.s3.eu-north-1.amazonaws.com",
  "medusa-public-images.s3.eu-west-1.amazonaws.com",
])

/** Images are content-addressed in practice — a design's URL never changes once generated. */
const CACHE_SECONDS = 60 * 60 * 24 * 30

const FETCH_TIMEOUT_MS = 10_000

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")
  if (!raw) {
    return NextResponse.json({ error: "Missing url." }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return NextResponse.json({ error: "Not a valid URL." }, { status: 400 })
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: "That host is not allowed." }, { status: 403 })
  }

  // A hung upstream must not hold a request open until the platform's own timeout — the share sheet
  // is waiting on this, and a spinner that never resolves is worse than a quick failure the caller
  // can fall back from.
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS)

  try {
    const upstream = await fetch(target.toString(), {
      signal: abort.signal,
      cache: "no-store",
    })

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "Could not load that image." },
        { status: upstream.status === 404 ? 404 : 502 }
      )
    }

    const contentType = upstream.headers.get("content-type") ?? ""
    // Only images. Without this the route would relay whatever happens to sit at that key, and these
    // buckets hold more than pictures.
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "That is not an image." }, { status: 415 })
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, immutable`,
        // The download fallback uses an <a download> on this URL when the device cannot share files.
        "Content-Disposition": "inline",
      },
    })
  } catch {
    return NextResponse.json({ error: "Could not load that image." }, { status: 502 })
  } finally {
    clearTimeout(timer)
  }
}
