import { createClient } from "@sanity/client"
import imageUrlBuilder from "@sanity/image-url"

/**
 * Read-only Sanity access for the published knowledge articles.
 *
 * ── Why there is no token here ─────────────────────────────────────────────────────────────────
 * The dataset is public, which is the correct setting for a blog and removes a whole category of
 * problem: no credential to inject at build time, none to leak into an image, none to rotate. Draft
 * articles are still private — Sanity keeps them under a `drafts.` prefix that the public API does
 * not return — so "unpublished" genuinely means unpublished.
 *
 * ── Why useCdn is true ─────────────────────────────────────────────────────────────────────────
 * apicdn.sanity.io is globally distributed. That matters more here than it would elsewhere: this
 * storefront runs in Mumbai and the Medusa backend in Stockholm, so every other data call on the
 * site crosses roughly six thousand kilometres. Knowledge pages deliberately do not — they are the
 * one part of the site whose content comes from an edge near the reader.
 *
 * The CDN can be a minute or so behind a publish. Pages revalidate on a window anyway, so the
 * freshest possible read would buy nothing a reader could perceive.
 */
export const SANITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "q9n8m46w"
export const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production"
export const SANITY_API_VERSION = "2024-10-01"

export const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true,
  perspective: "published",
})

const builder = imageUrlBuilder(sanityClient)

/**
 * A sized, re-encoded URL for a Sanity image.
 *
 * Sanity's image pipeline resizes and converts on its own CDN, which is why cover images do not go
 * through Next's optimiser: it would mean pulling the full original from Sanity into our container
 * in Mumbai, re-encoding it, and serving it — paying for the work twice and adding the Stockholm-
 * shaped latency back in. `auto("format")` gives WebP or AVIF to browsers that accept them.
 */
export function imageUrl(
  source: unknown,
  { width, height }: { width: number; height?: number }
): string | null {
  if (!source) return null
  try {
    let b = builder.image(source as never).width(width).auto("format").fit("max")
    if (height) b = b.height(height).fit("crop")
    return b.url()
  } catch {
    // A malformed asset reference must not take a page down; the caller renders without an image.
    return null
  }
}
