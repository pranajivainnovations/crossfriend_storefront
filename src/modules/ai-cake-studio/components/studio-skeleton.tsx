/**
 * Placeholder for the interactive half of the studio while the customer lookup resolves.
 *
 * ── Why this is a component and not ai-cake-studio/loading.tsx ─────────────────────────────────
 * It used to be a route-level loading file. In the App Router a loading file creates a Suspense
 * boundary for its segment *and every route nested under it*, which meant this skeleton also
 * covered /ai-cake-studio/gallery/[slug] — two problems at once. The visible one: a gallery design
 * page briefly rendered a studio builder skeleton it has nothing to do with. The costly one: the
 * boundary made Next stream those pages, so the HTTP 200 was already sent by the time the design
 * page called notFound(), turning every missing or hidden design into a soft 404 that Google keeps
 * indexing. Verified by removing the file: 404s started working immediately.
 *
 * As a fallback passed to a Suspense boundary inside the studio page itself, it covers exactly the
 * part it was drawn for and nothing else.
 *
 * The hero is deliberately absent — it renders immediately now, along with the FAQ, the how-it-works
 * section and every piece of JSON-LD, none of which ever needed to wait for a customer lookup.
 */
export default function StudioSkeleton() {
  return (
    <div className="content-container pb-16" aria-hidden="true">
      <div className="mx-auto max-w-3xl rounded-2xl border border-cf-purple-100 bg-white p-6 shadow-sm">
        <div className="h-6 w-48 animate-pulse rounded bg-cf-purple-100" />
        <div className="mt-6 h-28 w-full animate-pulse rounded-xl bg-cf-purple-50" />
        <div className="mt-4 flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded-full bg-cf-purple-100" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-cf-purple-50" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-cf-purple-50" />
        </div>
        <div className="mt-6 h-11 w-full animate-pulse rounded-xl bg-cf-purple-200/70" />
      </div>
    </div>
  )
}
