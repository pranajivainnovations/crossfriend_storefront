import { Metadata } from "next"
import Link from "next/link"

import { listBakers } from "@lib/data/bakers"
import { BAKERS_FAQ } from "@lib/constants/faq"
import { breadcrumbJsonLd, faqJsonLd, jsonLdScriptProps } from "@lib/util/seo"
import BakerCard from "@modules/bakers/components/baker-card"
import FaqSection from "@modules/common/components/faq-section"

export const metadata: Metadata = {
  alternates: { canonical: "/bakers" },
  title: "Local Bakers",
  description:
    "Discover local bakers on CrossFriend. Browse verified bakeries near you and order cakes, pastries and desserts made fresh.",
  keywords: ["local bakers", "bakery near me", "cake shops", "order from local bakery"],
  openGraph: {
    title: "Local Bakers",
    description: "Discover verified local bakeries and order cakes, pastries and desserts.",
  },
}

const PAGE_SIZE = 24

/**
 * The public baker directory.
 *
 * Search is a plain GET form so the page stays a server component and a search is a shareable URL —
 * consistent with how the rest of this storefront handles filtering, and it works before any
 * JavaScript loads.
 *
 * Only bakers marked public AND active are ever returned; that gate lives in the backend query
 * rather than here, so no page can accidentally widen it.
 */
export default async function BakersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const q = (searchParams.q || "").trim()
  const page = Math.max(parseInt(searchParams.page || "1", 10) || 1, 1)

  const { bakers, pagination } = await listBakers({ q, page, limit: PAGE_SIZE })

  return (
    <div className="content-container py-10">
      <script {...jsonLdScriptProps(faqJsonLd(BAKERS_FAQ))} />
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Bakers", path: "/bakers" },
          ])
        )}
      />

      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl-semi text-grey-90">Local Bakers</h1>
        <p className="mt-2 text-base-regular text-grey-50">
          Every bakery here is part of the CrossFriend network. Browse their work, then order
          directly.
        </p>
      </div>

      <form method="GET" className="mb-8 flex max-w-xl gap-x-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by bakery name or city"
          aria-label="Search bakers"
          className="flex-1 rounded-rounded border border-grey-20 px-4 py-2.5 text-base-regular text-grey-90 placeholder:text-grey-40 focus:border-cf-purple focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-rounded bg-cf-purple px-5 py-2.5 text-base-semi text-white transition hover:bg-cf-purple-700"
        >
          Search
        </button>
      </form>

      {bakers.length === 0 ? (
        <div className="rounded-large border border-dashed border-grey-20 px-6 py-16 text-center">
          <p className="text-base-semi text-grey-70">
            {q ? `No bakers match "${q}"` : "No bakers listed yet"}
          </p>
          <p className="mt-2 text-base-regular text-grey-50">
            {q ? (
              <>
                Try a different name or city, or{" "}
                <Link href="/bakers" className="text-cf-purple underline">
                  browse all bakers
                </Link>
                .
              </>
            ) : (
              "We're onboarding bakeries right now — check back soon."
            )}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-small-regular text-grey-50">
            {pagination.total} {pagination.total === 1 ? "baker" : "bakers"}
            {q && ` matching "${q}"`}
          </p>

          <div className="grid grid-cols-1 gap-6 xsmall:grid-cols-2 small:grid-cols-3 medium:grid-cols-4">
            {bakers.map((baker) => (
              <BakerCard key={baker.slug} baker={baker} />
            ))}
          </div>

          {(page > 1 || pagination.hasMore) && (
            <nav
              className="mt-10 flex items-center justify-center gap-x-4"
              aria-label="Pagination"
            >
              {page > 1 && (
                <Link
                  href={`/bakers?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    page: String(page - 1),
                  })}`}
                  className="rounded-rounded border border-grey-20 px-4 py-2 text-base-regular text-grey-70 transition hover:border-cf-purple hover:text-cf-purple"
                >
                  Previous
                </Link>
              )}
              <span className="text-small-regular text-grey-50">Page {page}</span>
              {pagination.hasMore && (
                <Link
                  href={`/bakers?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    page: String(page + 1),
                  })}`}
                  className="rounded-rounded border border-grey-20 px-4 py-2 text-base-regular text-grey-70 transition hover:border-cf-purple hover:text-cf-purple"
                >
                  Next
                </Link>
              )}
            </nav>
          )}
        </>
      )}

      {/* Rendered because the FAQPage markup above may only describe visible content. Doubles as
          the answer to "who actually bakes this" — the question a first-time marketplace customer
          asks and an answer engine is asked on their behalf. */}
      <FaqSection
        entries={BAKERS_FAQ}
        title="About the bakers on CrossFriend"
        className="!px-0"
      />
    </div>
  )
}
