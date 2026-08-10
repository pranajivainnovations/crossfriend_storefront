import type { Metadata } from "next"
import Link from "next/link"

import { CAKE_SIZE_EXTRA_FAQ, CAKE_SIZE_FAQ } from "@lib/constants/faq"
import {
  absoluteUrl,
  breadcrumbJsonLd,
  faqJsonLd,
  jsonLdScriptProps,
} from "@lib/util/seo"
import FaqSection from "@modules/common/components/faq-section"
import CakeSizeCalculator from "@modules/tools/components/cake-size-calculator"

/**
 * A tool page, not an article.
 *
 * It answers "how much cake for N people" — a query with standing volume that has nothing to do
 * with our catalogue, so it earns traffic while the marketplace is still filling up. Everything
 * renders server-side except the calculator itself, and the reference table below repeats the
 * calculator's own conventions in plain HTML so an answer engine can quote them without running
 * JavaScript.
 */

const TITLE = "Cake Size Calculator — How Much Cake Per Person"
const DESCRIPTION =
  "Work out what weight of cake you need for your guest count. Accounts for how the cake is served, round versus square, and tiers — plus how long cream holds up in Delhi heat."

export const metadata: Metadata = {
  alternates: { canonical: "/cake-size-calculator" },
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/cake-size-calculator"),
    type: "website",
  },
}

/**
 * The same conventions the calculator uses, as static HTML. Two reasons: it is the part people
 * screenshot and share, and it keeps the numbers extractable for answer engines that will not
 * interact with the form.
 */
const REFERENCE_ROWS = [
  { weight: "500 g", dessert: "4", party: "6–7", square: "8" },
  { weight: "1 kg", dessert: "8", party: "13", square: "16" },
  { weight: "1.5 kg", dessert: "12", party: "20", square: "25" },
  { weight: "2 kg", dessert: "16", party: "26", square: "33" },
  { weight: "3 kg", dessert: "24", party: "40", square: "50" },
  { weight: "5 kg", dessert: "40", party: "66", square: "83" },
]

/**
 * Facts worth knowing.
 *
 * The bar for inclusion is that the claim is either arithmetic (the geometry ones are provable from
 * area = πr²) or long-established food science with a named mechanism. Several appealing "cake
 * facts" were deliberately left out because they turned out to be folklore, marketing copy, or
 * country-specific claims that could not be checked — a page that gets quoted by answer engines
 * should not be where an unverified statistic enters circulation.
 */
const CAKE_FACTS = [
  {
    claim: "Double the diameter, and you get four times the cake",
    detail:
      "A round cake's area grows with the square of its radius, so a 12 inch round holds four times as much as a 6 inch — not twice. Even the step from 6 to 8 inches is a 1.8× jump. This is why sizing by inches goes wrong so often, and why Indian bakers quoting by the kilo are doing everyone a favour.",
  },
  {
    claim: "A square cake serves about a quarter more than a round one",
    detail:
      "Same weight, same recipe, more servings — because a square cuts into clean rectangles while a round loses portions to curved edge pieces. If you want the most servings for the money and the shape does not matter, order a square or a rectangle.",
  },
  {
    claim: "Height counts as much as width",
    detail:
      "Three layers at the same diameter is 50% more cake than two. Bakers usually quote servings against a standard cake height, so a taller build at the same width can quietly change how many people it feeds.",
  },
  {
    claim: "Tiers are a look, not a serving strategy",
    detail:
      "Guests do take a slightly smaller slice from a tall tiered cake, which stretches it by roughly 8–15% per kilo. But that is a rounding difference. Choose tiers because you want the height and the moment, not to feed more people — a single larger cake is cheaper per serving.",
  },
  {
    claim: "The fridge is for the frosting, not for the cake",
    detail:
      "Fresh cream, custard and cheese frostings genuinely need refrigeration. The sponge does not — it goes stale fastest just above freezing, because that is where starch retrogradation runs quickest. A plain or fondant-covered cake keeps better in a sealed box on the counter, and for longer storage freezing beats refrigerating outright.",
  },
  {
    claim: "Cold cake tastes flatter",
    detail:
      "Fat firms up and aromatic compounds stay put when cake is cold, so a slice straight from the fridge reads as dense and muted. Take it out 30 to 60 minutes before serving. This is the cheapest possible improvement to any cake.",
  },
  {
    claim: "There is a mathematically better way to cut a cake",
    detail:
      "In 1906 the scientist Francis Galton published a method in Nature for cake eaten over several days: instead of wedges, cut a straight strip through the middle, take that, then push the two halves back together. The cut faces stay pressed against each other and the cake dries out far less than a wedge-cut one.",
  },
]

export default function CakeSizeCalculatorPage() {
  return (
    <>
      <script
        {...jsonLdScriptProps([
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Cake Size Calculator", path: "/cake-size-calculator" },
          ]),
          // Must stay in step with what FaqSection renders below — FAQPage markup describing
          // questions a visitor cannot see is invalid, not merely unhelpful.
          faqJsonLd([...CAKE_SIZE_FAQ, ...CAKE_SIZE_EXTRA_FAQ]),
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Cake Size Calculator",
            url: absoluteUrl("/cake-size-calculator"),
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any",
            browserRequirements: "Requires JavaScript",
            description: DESCRIPTION,
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          },
        ])}
      />

      <section className="content-container py-12 small:py-16">
        <div className="max-w-3xl">
          <h1 className="cf-heading text-3xl small:text-4xl">Cake size calculator</h1>
          <p className="mt-4 text-base-regular leading-relaxed text-grey-60">
            Tell us how many people you are feeding and how the cake is being served. Most people
            over-order for a birthday and under-order when the cake is the only dessert — the
            difference between those two is nearly double.
          </p>
        </div>

        <div className="mt-8">
          <CakeSizeCalculator />
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-grey-60">
          These are standard portion conventions, not measurements from our own orders. Bakers cut
          slightly differently, so treat the result as a starting point and round up if your
          headcount is not final.
        </p>
      </section>

      <section className="content-container pb-12 small:pb-16" aria-labelledby="reference-heading">
        <h2 id="reference-heading" className="cf-heading text-2xl small:text-3xl">
          How many people does each size serve
        </h2>
        <p className="mt-3 max-w-3xl text-base-regular leading-relaxed text-grey-60">
          Dessert portions are about 125 g each; a celebration slice cut after the candles is about
          75 g. The last column shows why shape matters — the same weight in a square tin cuts into
          clean rectangles instead of losing servings to curved edges.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-cf-purple-100">
                <th scope="col" className="py-3 pr-4 text-sm font-semibold uppercase tracking-wide text-grey-60">
                  Cake weight
                </th>
                <th scope="col" className="py-3 pr-4 text-sm font-semibold uppercase tracking-wide text-grey-60">
                  As dessert
                </th>
                <th scope="col" className="py-3 pr-4 text-sm font-semibold uppercase tracking-wide text-grey-60">
                  Celebration slice
                </th>
                <th scope="col" className="py-3 text-sm font-semibold uppercase tracking-wide text-grey-60">
                  Square, celebration
                </th>
              </tr>
            </thead>
            <tbody>
              {REFERENCE_ROWS.map((row) => (
                <tr key={row.weight} className="border-b border-cf-purple-100/60">
                  <th scope="row" className="py-3 pr-4 font-semibold tabular-nums text-grey-90">
                    {row.weight}
                  </th>
                  <td className="py-3 pr-4 tabular-nums text-grey-60">{row.dessert}</td>
                  <td className="py-3 pr-4 tabular-nums text-grey-60">{row.party}</td>
                  <td className="py-3 tabular-nums text-grey-60">{row.square}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-container pb-12 small:pb-16" aria-labelledby="facts-heading">
        <h2 id="facts-heading" className="cf-heading text-2xl small:text-3xl">
          Seven things most people get wrong about cake
        </h2>

        <ul className="mt-6 grid gap-4 small:grid-cols-2">
          {CAKE_FACTS.map((fact, index) => (
            <li
              key={fact.claim}
              className="flex gap-4 rounded-xl border border-cf-purple-100 bg-white p-5"
            >
              <span
                aria-hidden="true"
                className="shrink-0 text-2xl font-bold tabular-nums leading-none text-cf-purple-300"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-base font-semibold text-grey-90">{fact.claim}</h3>
                <p className="mt-2 text-base-regular leading-relaxed text-grey-60">
                  {fact.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <FaqSection
        entries={[...CAKE_SIZE_FAQ, ...CAKE_SIZE_EXTRA_FAQ]}
        title="Cake size questions"
      />

      <section className="content-container pb-16">
        <div className="rounded-2xl border border-cf-purple-100 bg-cf-purple-100/40 p-8 text-center">
          <h2 className="cf-heading text-2xl">Know the size. Now design it.</h2>
          <p className="mx-auto mt-3 max-w-xl text-base-regular leading-relaxed text-grey-60">
            Describe the cake you want and our AI Cake Studio will show you what it could look like,
            with a price for the size you just worked out.
          </p>
          <Link
            href="/ai-cake-studio"
            className="mt-6 inline-block rounded-lg bg-cf-purple-600 px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cf-purple-600"
          >
            Design your cake
          </Link>
        </div>
      </section>
    </>
  )
}
