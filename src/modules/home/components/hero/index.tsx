import Link from "next/link"

import { getShowcaseDesigns } from "@lib/data/showcase"
import DesignMarquee, { DesignStrip } from "./design-marquee"
import PromptBar from "./prompt-bar"

/**
 * The homepage hero.
 *
 * ── Why the Studio is the subject, not a link ───────────────────────────────────────────────────
 * The previous hero was a gradient, four floating emoji and the line "Shop cakes, decorations,
 * gifts, costumes and more" — true of a hundred sites and specific to none. CrossFriend's one
 * genuinely differentiated thing is that you can describe a cake in your own words and a local
 * baker makes it. So the hero asks for those words.
 *
 * ── Why a dark ground ──────────────────────────────────────────────────────────────────────────
 * Everything below this is warm white. Deep plum here does two things: the cakes — which are
 * saturated, brightly lit photographs — glow against it in a way they cannot against cream, and the
 * seam where the hero ends gives the page a rhythm it previously lacked (it was nine sections of
 * equal weight, so nothing led).
 *
 * ── Why real designs ───────────────────────────────────────────────────────────────────────────
 * Every image here is a real generation with the prompt someone actually typed. "A cake shaped like
 * a vintage red rotary telephone" is not something a stock library has, and it demonstrates the
 * product more honestly than any description of it. If the gallery is unreachable the hero still
 * stands on its own — the marquee simply does not render.
 *
 * ── The second path ────────────────────────────────────────────────────────────────────────────
 * Most visitors want to buy a cake, not design one. "Browse cakes" is deliberately quieter than the
 * prompt bar but never hidden — a homepage that only offers the clever path loses the ordinary
 * customer, and the ordinary customer is most of them.
 */
export default async function Hero() {
  const designs = await getShowcaseDesigns(12)

  // Real prompts, shortest first — the placeholder has to fit on a phone, and a truncated example
  // makes the point less well than a complete short one.
  const examples = designs
    .map((d) => d.prompt)
    .filter((p) => p.length > 12 && p.length < 70)
    .sort((a, b) => a.length - b.length)
    .slice(0, 6)

  return (
    <section className="relative overflow-hidden bg-[#170B2B] text-white">
      {/* Ambient colour. Two soft pools rather than a full gradient wash, so the centre stays dark
          enough for white text to hold contrast at the top of the copy. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-[32rem] w-[32rem] rounded-full bg-cf-purple/25 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 h-[28rem] w-[28rem] rounded-full bg-cf-orange/15 blur-[120px]" />
      </div>

      <div className="content-container relative py-16 small:py-24">
        <div className="grid items-center gap-12 small:grid-cols-[1.05fr_0.95fr] small:gap-16">
          {/* ── Copy ────────────────────────────────────────────────────────────────────── */}
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cf-purple-300/30 bg-cf-purple/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-cf-purple-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cf-purple-300" />
              AI Cake Studio
            </p>

            <h1 className="cf-heading mt-6 text-4xl leading-[1.05] tracking-tight text-white small:text-[3.5rem] medium:text-6xl">
              Describe the cake
              <br />
              <span className="bg-gradient-to-r from-cf-yellow via-cf-orange to-cf-pink bg-clip-text text-transparent">
                you can picture.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/60">
              See it designed in seconds. Then have a local baker near you make it — for real, for
              your celebration.
            </p>

            <div className="mt-8">
              <PromptBar examples={examples} />
            </div>

            {/* The ordinary path. Quieter than the prompt bar, never hidden. */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <Link
                href="/categories/cakes"
                className="group inline-flex items-center gap-2 font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
              >
                Or browse cakes ready to order
                <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
              <Link
                href="/bakers"
                className="text-white/45 underline decoration-white/20 underline-offset-4 transition hover:text-white/80"
              >
                Find a local baker
              </Link>
            </div>
          </div>

          {/* ── Real designs ────────────────────────────────────────────────────────────── */}
          {/* The gallery link lives with the marquee rather than below the whole grid: as a
              standalone line at the bottom it was orphaned in dead space and read as a footer,
              when it is really a caption for the images beside it. */}
          <div className="hidden small:flex small:flex-col">
            <div className="relative h-[30rem] medium:h-[34rem]">
              <DesignMarquee designs={designs} />
            </div>
            {designs.length > 0 && (
              <Link
                href="/ai-cake-studio/gallery"
                className="group mt-5 inline-flex items-center gap-1.5 self-start text-sm text-white/40 transition hover:text-white/75"
              >
                Browse all {designs.length >= 12 ? "community designs" : "designs"}
                <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile carries the designs as real, tappable content — the marquee is decorative and
            hidden at this width, so without this the strongest proof of the product vanishes on the
            device most people arrive on. */}
        <div className="mt-12 small:hidden">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/35">
              Made in the Studio
            </p>
            <Link
              href="/ai-cake-studio/gallery"
              className="text-xs font-medium text-white/45 underline decoration-white/20 underline-offset-4"
            >
              See all
            </Link>
          </div>
          <DesignStrip designs={designs} />
        </div>
      </div>
    </section>
  )
}
