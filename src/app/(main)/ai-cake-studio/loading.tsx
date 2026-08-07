/**
 * The page is `force-dynamic` and resolves the customer before rendering anything, so without a
 * loading state the whole studio is a blank screen until that round trip lands. Mirrors the real
 * layout (hero, then the builder panel) so the shell doesn't jump when content arrives.
 */
export default function Loading() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#f9f6ff] via-white to-[#fcfaff]">
      {/* Hero */}
      <div className="content-container flex flex-col items-center gap-4 py-16">
        <div className="h-10 w-3/4 max-w-2xl animate-pulse rounded-lg bg-violet-100" />
        <div className="h-10 w-1/2 max-w-xl animate-pulse rounded-lg bg-violet-100" />
        <div className="mt-2 h-5 w-2/3 max-w-lg animate-pulse rounded bg-violet-50" />
      </div>

      {/* Builder panel */}
      <div className="content-container pb-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
          <div className="h-6 w-48 animate-pulse rounded bg-violet-100" />
          <div className="mt-6 h-28 w-full animate-pulse rounded-xl bg-violet-50" />

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="h-11 animate-pulse rounded-lg bg-violet-50"
              />
            ))}
          </div>

          <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-violet-100" />
        </div>
      </div>
    </main>
  )
}
