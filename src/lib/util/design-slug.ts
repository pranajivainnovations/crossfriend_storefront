/**
 * URLs for individual gallery designs.
 *
 * The prompt is the whole point. "unicorn birthday cake for a 5 year old" is a phrase people
 * actually type into a search box, and the Studio produces one of these every time somebody uses
 * it — so the URL carries the prompt and the id, in that order:
 *
 *   /ai-cake-studio/gallery/unicorn-birthday-cake-for-a-5-year-old-9f3a2b1c
 *
 * The trailing id is what makes the slug resolvable. Two people will eventually type the same
 * prompt, and prompts get edited; a slug built from text alone would either collide or break. With
 * the id last, the words are free to change without ever invalidating a URL — only the id is read
 * when resolving, and the prose is decoration that happens to be worth ranking.
 *
 * Length is capped well under what a browser or crawler tolerates, because a slug long enough to
 * wrap in a search result reads as spam. The cap trims on a word boundary rather than mid-word.
 */

/** How much of the prompt goes into the slug, before the id is appended. */
const MAX_PROMPT_CHARS = 60

/** The id fragment. Long enough that a truncated prompt cannot make two designs collide. */
const ID_CHARS = 8

function slugifyPrompt(prompt: string): string {
  const base = prompt
    .toLowerCase()
    .normalize("NFKD")
    // Strip combining marks so "café" becomes "cafe" rather than "caf".
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  if (base.length <= MAX_PROMPT_CHARS) return base

  // Trim at the last hyphen inside the budget so the slug never ends mid-word.
  const clipped = base.slice(0, MAX_PROMPT_CHARS)
  const lastBoundary = clipped.lastIndexOf("-")
  return lastBoundary > 20 ? clipped.slice(0, lastBoundary) : clipped
}

/**
 * The canonical path segment for a design.
 *
 * A design whose prompt slugifies to nothing — emoji only, or a script this regex strips entirely —
 * falls back to the id alone. That URL is ugly but valid, which is the right trade: better a design
 * that is reachable and unremarkable than one that 404s.
 */
export function designSlug(design: { id: string; prompt?: string | null }): string {
  const words = slugifyPrompt(design.prompt ?? "")
  const idPart = design.id.replace(/-/g, "").slice(0, ID_CHARS)
  return words ? `${words}-${idPart}` : idPart
}

/**
 * Recovers the id fragment from a slug.
 *
 * Returns the trailing segment, which the route then matches against a design id prefix. Nothing
 * about the prose part is trusted or validated — an old slug whose prompt has since been edited
 * still resolves, and the route redirects to the current spelling.
 */
export function idFragmentFromSlug(slug: string): string {
  const parts = slug.split("-")
  return parts[parts.length - 1] ?? ""
}
