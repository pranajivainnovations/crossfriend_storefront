import Link from "next/link"

/**
 * The two things a customer can be here to do.
 *
 * CrossFriend now has two genuinely different purchase intents, and the homepage's job is to make
 * the choice obvious rather than bury one of them:
 *
 *   "I want something now"        -> Ready to Order
 *   "I want something unique"     -> AI Cake Studio
 *
 * Ready to Order leads. It is the shorter path to a completed order, and it is what most people
 * arriving at a cake site want; the Studio is the differentiated experience, not the default one.
 *
 * Bakers is deliberately a quieter third link rather than a third card of equal weight — browsing
 * bakeries is a way of shopping, not a reason to visit. Making it a peer would imply CrossFriend is
 * a directory, which it is not.
 *
 * Colour follows the house rule: orange is the primary commit action, purple is Studio identity.
 */
export default function IntentPaths() {
  return (
    <section className="content-container py-12" aria-labelledby="intent-heading">
      <h2 id="intent-heading" className="sr-only">
        What would you like to do?
      </h2>

      <div className="grid gap-4 small:grid-cols-2">
        {/* Ready to Order */}
        <Link
          href="/ready-to-order"
          className="group relative flex flex-col justify-between overflow-hidden rounded-large border border-cf-orange/20 bg-gradient-to-br from-cf-warm to-cf-warm-dark p-7 transition hover:border-cf-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cf-orange"
        >
          <div>
            <p className="text-small-regular font-semibold uppercase tracking-wider text-cf-orange">
              Order now
            </p>
            <h3 className="mt-2 text-2xl-semi text-grey-90">Ready to Order</h3>
            <p className="mt-2 max-w-sm text-base-regular text-grey-60">
              Cakes, pastries and treats from local bakers — already made, ready to deliver.
            </p>
          </div>
          <span className="mt-6 inline-flex w-fit items-center gap-x-2 rounded-rounded bg-cf-orange px-5 py-2.5 text-base-semi text-white transition group-hover:bg-cf-orange-dark">
            Browse cakes
            <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </Link>

        {/* AI Cake Studio */}
        <Link
          href="/ai-cake-studio"
          className="group relative flex flex-col justify-between overflow-hidden rounded-large border border-cf-purple-200 bg-gradient-to-br from-cf-purple-50 to-cf-purple-100 p-7 transition hover:border-cf-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cf-purple"
        >
          <div>
            <p className="text-small-regular font-semibold uppercase tracking-wider text-cf-purple">
              Make it yours
            </p>
            <h3 className="mt-2 text-2xl-semi text-grey-90">AI Cake Studio</h3>
            <p className="mt-2 max-w-sm text-base-regular text-grey-60">
              Describe the cake you imagine, see it designed, then have a local baker make it.
            </p>
          </div>
          <span className="mt-6 inline-flex w-fit items-center gap-x-2 rounded-rounded bg-cf-purple px-5 py-2.5 text-base-semi text-white transition group-hover:bg-cf-purple-700">
            Start designing
            <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </Link>
      </div>

      <p className="mt-4 text-center text-base-regular text-grey-50">
        Or{" "}
        <Link href="/bakers" className="text-cf-purple underline hover:text-cf-purple-700">
          discover local bakers
        </Link>{" "}
        near you.
      </p>
    </section>
  )
}
