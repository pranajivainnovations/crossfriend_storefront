import { NextRequest, NextResponse } from "next/server"

import { BASE_URL } from "@lib/util/seo"
import { renderShareCard, type ShareCardVariant } from "@lib/share-card/render"

/**
 * GET /api/ai-studio/designs/:id/share-card?variant=story|og
 *
 * The branded image for one design — the cake untouched, with the spec strip beneath or beside it.
 *
 * ── Why this is keyed by design id and not by image URL ────────────────────────────────────────
 * Because the specs have to come from somewhere, and the only honest source is the design record.
 * Accepting them as query parameters would mean any caller could mint a CrossFriend-branded picture
 * claiming any weight and any flavour, which is a thing we would rather not put on the internet.
 *
 * It also gets visibility right for free. The backend refuses to serve a design the customer has
 * made private, so this route cannot render a card for one either — no separate check to forget.
 *
 * ── Runtime ───────────────────────────────────────────────────────────────────────────────────
 * Node, explicitly. sharp is a native binding and satori reads a font off disk; neither exists on
 * the edge runtime, and the failure mode there is a module resolution error at request time rather
 * than anything visible at build.
 */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * A design's image never changes once generated, and neither do its specs.
 *
 * Long cache, and it matters more than usual here: every WhatsApp link preview, every crawler and
 * every share fetches this, and each miss costs an S3 round trip plus a composite. Without it, one
 * design going around a large group chat would re-render the same picture hundreds of times.
 */
const CACHE_SECONDS = 60 * 60 * 24 * 30

interface BackendDesign {
  id: string
  imageUrl: string
  prompt?: string
  style?: string
  occasion?: string
  flavor?: string
  weight?: string
  tiers?: number
  shape?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const variant: ShareCardVariant =
    request.nextUrl.searchParams.get("variant") === "og" ? "og" : "story"

  let design: BackendDesign | null = null

  try {
    const res = await fetch(
      `${MEDUSA_BACKEND_URL}/store/ai-studio/designs/${encodeURIComponent(params.id)}`,
      { next: { revalidate: 3600 } }
    )
    if (res.ok) {
      const body = (await res.json()) as { design?: BackendDesign }
      design = body.design ?? null
    }
  } catch {
    design = null
  }

  // Private, deleted or never-existed all arrive here identically, and all mean the same thing to a
  // caller: there is no card. The share path falls back to the raw image, which is what shipped
  // before this route existed.
  if (!design?.imageUrl) {
    return NextResponse.json({ error: "No card for that design." }, { status: 404 })
  }

  try {
    // The short form deliberately — see renderShareCard's note on why the QR gets the sparse URL.
    const qrUrl = `${BASE_URL}/ai-cake-studio/gallery/${design.id.replace(/-/g, "").slice(0, 8)}`
    const card = await renderShareCard(design, qrUrl, variant)

    return new NextResponse(card as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, immutable`,
      },
    })
  } catch (error) {
    // Compositing is the one part of this that can fail for reasons nobody anticipated — a design
    // image that is a format sharp will not decode, an S3 timeout, a font that did not ship. Logged
    // rather than swallowed, because a card that silently stops rendering would show up only as a
    // gradual loss of branding that nobody attributes to anything.
    console.error(`[share-card] could not render ${params.id}`, error)
    return NextResponse.json({ error: "Could not build that card." }, { status: 502 })
  }
}
