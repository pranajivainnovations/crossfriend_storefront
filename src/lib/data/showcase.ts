import { cache } from "react"

/**
 * Community cake designs from the AI Studio — real generations, with the prompts that made them.
 *
 * Used on the homepage hero. The point of showing these rather than stock photography is that they
 * are demonstrably ours: "a cake shaped like a vintage red rotary telephone" is not a thing a stock
 * library has, and the prompt beside the image is the whole pitch for the Studio in one glance.
 *
 * Plain `fetch`, so Next's data cache genuinely applies — the Medusa JS client uses axios, where
 * `next: { revalidate }` is silently ignored. Five minutes is generous for a gallery that grows a
 * few designs a day, and it keeps the homepage off the network on most requests.
 */

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9000"

export interface ShowcaseDesign {
  id: string
  imageUrl: string
  prompt: string
  occasion: string | null
  likeCount: number
}

export const getShowcaseDesigns = cache(async function getShowcaseDesigns(
  limit = 12
): Promise<ShowcaseDesign[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/ai-studio/showcase?limit=${limit}`, {
      next: { revalidate: 300, tags: ["showcase"] },
    })
    if (!res.ok) return []

    const data = (await res.json()) as { designs?: ShowcaseDesign[] }
    return (data.designs ?? [])
      // A design with no image cannot do the one job it has here.
      .filter((d) => Boolean(d.imageUrl))
      .map((d) => ({
        id: d.id,
        imageUrl: d.imageUrl,
        prompt: (d.prompt ?? "").trim(),
        occasion: d.occasion ?? null,
        likeCount: d.likeCount ?? 0,
      }))
  } catch (error) {
    // The hero renders without them rather than failing — see the fallback in hero/index.tsx.
    console.error("[showcase] unreachable", error)
    return []
  }
})
