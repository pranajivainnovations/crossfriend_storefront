import Link from "next/link"

import { listBakers } from "@lib/data/bakers"
import BakerCard from "@modules/bakers/components/baker-card"

/**
 * Local bakers on the homepage.
 *
 * Four is deliberate — enough to show this is a real network of real bakeries, few enough that the
 * homepage does not turn into a directory. The brief is explicit that bakers must not become the
 * primary homepage concept, so this sits below the marketplace preview and links out rather than
 * trying to be browsable in place.
 *
 * The backend already orders by featured_priority, then trust badge, blue tick and rating — so the
 * four shown are ops's own pick rather than whatever the planner returned first.
 *
 * Renders nothing when no bakers are public yet. On a marketplace that is still onboarding, an
 * empty "Local Bakers" row advertises exactly the wrong thing.
 */
export default async function LocalBakers() {
  const { bakers, pagination } = await listBakers({ limit: 4, page: 1 })

  if (bakers.length === 0) {
    return null
  }

  return (
    <section className="content-container py-12" aria-labelledby="local-bakers-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="local-bakers-heading" className="text-xl-semi text-grey-90">
            Local Bakers
          </h2>
          <p className="mt-1 text-base-regular text-grey-50">
            Independent bakeries in the CrossFriend network.
          </p>
        </div>
        {pagination.total > bakers.length && (
          <Link
            href="/bakers"
            className="text-base-semi text-cf-purple hover:text-cf-purple-700 hover:underline"
          >
            All {pagination.total} bakers →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xsmall:grid-cols-2 small:grid-cols-4">
        {bakers.map((baker) => (
          <BakerCard key={baker.slug} baker={baker} />
        ))}
      </div>
    </section>
  )
}
