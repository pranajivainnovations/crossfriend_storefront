import Link from "next/link"

import { getRegion } from "@lib/data"
import {
  listMarketplaceProducts,
  MARKETPLACE_CATEGORIES,
} from "@lib/data/marketplace"
import MarketplaceGrid from "../components/marketplace-grid"

/**
 * Ready to Order — the marketplace.
 *
 * Named for the customer's intent, not for what it contains. "Products" is what we call them
 * internally; "Ready to Order" is the thing a person is actually choosing between when the
 * alternative is designing a cake from scratch in the Studio.
 *
 * Category filtering is a set of links, not a client-side filter — each one is a real URL that can
 * be shared, bookmarked and indexed, and the filtering happens in Postgres.
 */
export default async function MarketplaceTemplate({
  categoryHandle,
  page,
}: {
  categoryHandle?: string
  page: number
}) {
  const [region, result] = await Promise.all([
    getRegion("in"),
    listMarketplaceProducts({ categoryHandle, page }),
  ])

  const active = MARKETPLACE_CATEGORIES.find((c) => c.handle === categoryHandle)
  const basePath = categoryHandle ? `/ready-to-order/${categoryHandle}` : "/ready-to-order"

  return (
    <div className="content-container py-10">
      <div className="mb-6 max-w-2xl">
        <h1 className="text-2xl-semi text-grey-90">
          {active ? active.label : "Ready to Order"}
        </h1>
        <p className="mt-2 text-base-regular text-grey-50">
          {active
            ? `${active.label} from local bakers, ready to order now.`
            : "Cakes and treats from local bakers — already made, ready to deliver."}
        </p>
      </div>

      {/* Category filter */}
      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Categories">
        <CategoryChip href="/ready-to-order" label="All" active={!categoryHandle} />
        {MARKETPLACE_CATEGORIES.map((c) => (
          <CategoryChip
            key={c.handle}
            href={`/ready-to-order/${c.handle}`}
            label={c.label}
            active={c.handle === categoryHandle}
          />
        ))}
      </nav>

      {result.products.length === 0 || !region ? (
        <div className="rounded-large border border-dashed border-grey-20 px-6 py-16 text-center">
          <p className="text-base-semi text-grey-70">
            {active ? `No ${active.label.toLowerCase()} listed yet` : "Nothing listed yet"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-base-regular text-grey-50">
            Our bakers are still adding their menus. In the meantime you can{" "}
            <Link href="/ai-cake-studio" className="text-cf-purple underline">
              design your own cake
            </Link>{" "}
            or{" "}
            <Link href="/bakers" className="text-cf-purple underline">
              browse local bakers
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-small-regular text-grey-50">
            {result.count} {result.count === 1 ? "item" : "items"}
          </p>

          <MarketplaceGrid products={result.products} region={region} />

          {(page > 1 || result.hasMore) && (
            <nav className="mt-10 flex items-center justify-center gap-x-4" aria-label="Pagination">
              {page > 1 && (
                <Link
                  href={page === 2 ? basePath : `${basePath}?page=${page - 1}`}
                  className="rounded-rounded border border-grey-20 px-4 py-2 text-base-regular text-grey-70 transition hover:border-cf-purple hover:text-cf-purple"
                >
                  Previous
                </Link>
              )}
              <span className="text-small-regular text-grey-50">Page {page}</span>
              {result.hasMore && (
                <Link
                  href={`${basePath}?page=${page + 1}`}
                  className="rounded-rounded border border-grey-20 px-4 py-2 text-base-regular text-grey-70 transition hover:border-cf-purple hover:text-cf-purple"
                >
                  Next
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  )
}

function CategoryChip({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-circle border px-4 py-2 text-base-regular transition ${
        active
          ? "border-cf-purple bg-cf-purple text-white"
          : "border-grey-20 bg-white text-grey-70 hover:border-cf-purple hover:text-cf-purple"
      }`}
    >
      {label}
    </Link>
  )
}
