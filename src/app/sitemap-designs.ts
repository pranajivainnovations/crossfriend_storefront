import type { MetadataRoute } from "next"

import { designSlug } from "@lib/util/design-slug"

/**
 * Gallery design pages for the sitemap.
 *
 * Kept in its own file rather than inlined into sitemap.ts because it is the one section that grows
 * without anybody publishing anything — a design page appears every time a customer generates and
 * shares. That makes it both the most valuable section to have listed and the one most likely to
 * need its own limits, which are easier to reason about here than buried in a 400-line builder.
 */

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

/**
 * How many designs to list.
 *
 * The showcase endpoint caps a page at 50, so this is four requests at most. A cap exists at all
 * because an unbounded sitemap section is how a file quietly grows past the 50,000-URL limit and
 * starts being ignored in full; when the gallery approaches that, this should become a sitemap
 * index rather than a bigger number here.
 */
const MAX_DESIGNS = 200
const PAGE_SIZE = 50

interface ShowcaseRow {
  id: string
  prompt: string
  createdAt: string
}

export async function collectDesignEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
  const seen = new Set<string>()

  try {
    for (let page = 1; entries.length < MAX_DESIGNS; page++) {
      const res = await fetch(
        `${MEDUSA_BACKEND_URL}/store/ai-studio/showcase?sort=recent&limit=${PAGE_SIZE}&page=${page}`,
        { cache: "no-store" }
      )
      if (!res.ok) break

      const body = (await res.json()) as {
        designs?: ShowcaseRow[]
        pagination?: { hasMore?: boolean }
      }
      const designs = body.designs ?? []
      if (designs.length === 0) break

      for (const design of designs) {
        const slug = designSlug(design)
        if (seen.has(slug)) continue
        seen.add(slug)
        entries.push({
          url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://crossfriend.in"}/ai-cake-studio/gallery/${slug}`,
          lastModified: design.createdAt ? new Date(design.createdAt) : undefined,
          changeFrequency: "monthly" as const,
          // Below products and above filtered listing URLs: these are real destinations, but a
          // design page is not what someone buying a cake most needs to land on.
          priority: 0.5,
        })
      }

      if (!body.pagination?.hasMore) break
    }
  } catch (error) {
    // A sitemap missing its design section is far better than a sitemap that fails to build. The
    // caller already serves the last known good file on error; this keeps one flaky section from
    // triggering that path for everything else.
    console.error("[sitemap] design entries unavailable", error)
  }

  return entries.slice(0, MAX_DESIGNS)
}
