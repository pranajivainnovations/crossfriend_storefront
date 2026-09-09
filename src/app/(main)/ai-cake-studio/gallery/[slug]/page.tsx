import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { designSlug, idFragmentFromSlug } from "@lib/util/design-slug"
import DesignShareButton from "@modules/ai-cake-studio/components/design-share-button"
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScriptProps,
  ORGANIZATION_ID,
} from "@lib/util/seo"

/**
 * One AI-generated cake design, on its own indexable URL.
 *
 * ── Why this page exists ────────────────────────────────────────────────────────────────────────
 * Every design carries the prompt that produced it, and those prompts are search queries people
 * actually type: "unicorn birthday cake for a 5 year old", "cricket themed cake", "50th anniversary
 * gold cake". Until now all of them lived on a single gallery URL, so none could rank for anything.
 *
 * The site's problem is thin content — six of nine key pages sit around 200 words, and there is no
 * guide section. The usual answer is to write articles, which is slow and depends on someone having
 * time. This is the other answer: the Studio generates a new long-tail phrase every time somebody
 * uses it, so the content scales with product usage rather than with writing time. It is the only
 * item on the SEO backlog that needs no copy from anyone.
 *
 * ── Rendering ───────────────────────────────────────────────────────────────────────────────────
 * Dynamic rather than statically generated. The set of designs changes continuously, and
 * `generateStaticParams` over a growing gallery would mean either a stale page for anything created
 * since the last build, or a rebuild on every generation. Next caches the fetch, so the cost is a
 * revalidation rather than a round trip per visit.
 */

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9001"

interface Design {
  id: string
  imageUrl: string
  prompt: string
  compiledPrompt?: string
  style?: string
  occasion?: string
  flavor?: string
  weight?: string
  tiers?: number
  shape?: string
  likeCount: number
  commentCount: number
  viewCount: number
  createdAt: string
}

interface Sibling {
  id: string
  imageUrl: string
  prompt: string
  occasion?: string
}

async function fetchDesign(
  slug: string
): Promise<{ design: Design; siblings: Sibling[] } | null> {
  const fragment = idFragmentFromSlug(slug)
  if (!fragment) return null

  try {
    const res = await fetch(
      `${MEDUSA_BACKEND_URL}/store/ai-studio/designs/${encodeURIComponent(fragment)}`,
      // Long enough that a crawler sweeping the gallery does not hammer the database, short enough
      // that an unpublished design stops being served within the hour.
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/** Sentence-cases a prompt for use as a heading without shouting or mangling proper nouns. */
function asTitle(prompt: string): string {
  const trimmed = prompt.trim().replace(/\s+/g, " ")
  if (!trimmed) return "AI cake design"
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/**
 * The one-line description, built from the physical spec the image depicts.
 *
 * Written from real fields rather than a template with blanks, so a design missing style or flavour
 * produces a shorter sentence instead of "a  cake in  style".
 */
function describe(design: Design): string {
  const parts: string[] = []
  if (design.style) parts.push(`${design.style.toLowerCase()} style`)
  if (design.flavor) parts.push(`${design.flavor.toLowerCase()} flavour`)
  if (design.weight) parts.push(`${design.weight} kg`)
  if (design.tiers && design.tiers > 1) parts.push(`${design.tiers} tiers`)

  const spec = parts.length ? ` — ${parts.join(", ")}` : ""
  const occasion = design.occasion ? ` for a ${design.occasion.toLowerCase()}` : ""
  return `An AI-generated cake design${occasion}${spec}. Order it from a verified local baker on CrossFriend.`
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const data = await fetchDesign(params.slug)

  // A missing design must not produce a 200 with fallback metadata — that is a soft 404, which
  // Google indexes as a real page. Returning bare metadata lets the component below call notFound()
  // and send a genuine 404 status.
  if (!data) return { title: "Design not found", robots: { index: false, follow: false } }

  const { design } = data
  const title = asTitle(design.prompt)
  const canonical = `/ai-cake-studio/gallery/${designSlug(design)}`

  return {
    title,
    description: describe(design),
    alternates: { canonical },
    openGraph: {
      title,
      description: describe(design),
      url: absoluteUrl(canonical),
      type: "article",
      /**
       * The branded card, not the bare image.
       *
       * The design is still the picture — the card is the design with a spec strip beside it. What
       * that buys is a preview that survives being screenshotted: the raw file said nothing about
       * size, flavour or who made it, so the moment somebody photographed the chat rather than
       * forwarding it, every trace of us was gone.
       *
       * 1200×630 because that is what the platforms crop toward; the route renders that variant.
       */
      images: [
        {
          url: absoluteUrl(`/api/ai-studio/designs/${design.id}/share-card?variant=og`),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: describe(design),
      images: [absoluteUrl(`/api/ai-studio/designs/${design.id}/share-card?variant=og`)],
    },
  }
}

export default async function DesignPage({ params }: { params: { slug: string } }) {
  const data = await fetchDesign(params.slug)
  if (!data) notFound()

  const { design, siblings } = data
  const canonicalSlug = designSlug(design)

  // An older or hand-typed slug still resolves, because only the id fragment is read. Send it to
  // the current spelling so one design never accumulates several indexed URLs.
  if (params.slug !== canonicalSlug) {
    redirect(`/ai-cake-studio/gallery/${canonicalSlug}`)
  }

  const title = asTitle(design.prompt)
  const path = `/ai-cake-studio/gallery/${canonicalSlug}`

  /**
   * ImageObject rather than Product.
   *
   * This page shows a design, not something with a price and stock. Marking it as a Product would
   * be a claim we cannot honour — there is no offer here, and the price depends entirely on the
   * baker, weight and pincode chosen afterwards. ImageObject describes what this genuinely is and
   * makes the design eligible for image search, which is where the prompt-shaped queries land.
   */
  const imageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": absoluteUrl(path) + "#image",
    contentUrl: design.imageUrl,
    url: absoluteUrl(path),
    name: title,
    description: describe(design),
    datePublished: design.createdAt,
    creditText: "Generated with CrossFriend AI Cake Studio",
    creator: { "@id": ORGANIZATION_ID },
    // The design belongs to the customer who wrote the prompt; CrossFriend publishes it with
    // their consent. Naming a licence we have not written would be worse than naming none.
    representativeOfPage: true,
  }

  return (
    <div className="content-container py-8 small:py-12">
      <script {...jsonLdScriptProps(imageJsonLd)} />
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd([
            { name: "AI Cake Studio", path: "/ai-cake-studio" },
            { name: "Design gallery", path: "/ai-cake-studio/gallery" },
            { name: title, path },
          ])
        )}
      />

      <nav className="mb-6 text-sm text-grey-50">
        <Link href="/ai-cake-studio/gallery" className="hover:text-grey-90">
          ← Back to the design gallery
        </Link>
      </nav>

      <div className="grid gap-8 small:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-grey-5">
          <Image
            src={design.imageUrl}
            // The prompt is the most accurate description of this image that exists — it is
            // literally what the image was made from. Nothing hand-written would describe it better.
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>

        <div>
          {/* The prompt as H1. This is the page's whole reason to exist: the phrase a person typed
              is the phrase another person will search for. */}
          <h1 className="font-heading text-2xl font-bold text-grey-90 small:text-3xl">{title}</h1>

          <p className="mt-3 text-grey-60">{describe(design)}</p>

          {/* Most visitors here arrived from somebody else's share, which makes them the readiest
              person on the site to send it on — and until now this page gave them no way to. */}
          <div className="mt-5">
            <DesignShareButton
              design={{
                id: design.id,
                title,
                prompt: design.prompt,
                imageUrl: design.imageUrl,
              }}
              canonicalUrl={absoluteUrl(path)}
              occasion={design.occasion}
              style={design.style}
            />
          </div>

          {/* Visible spec, not just markup. An answer engine quotes rendered text; a table that
              exists only in JSON-LD gives a reader nothing. */}
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {design.occasion ? (
              <>
                <dt className="text-grey-50">Occasion</dt>
                <dd className="text-grey-90">{design.occasion}</dd>
              </>
            ) : null}
            {design.style ? (
              <>
                <dt className="text-grey-50">Style</dt>
                <dd className="text-grey-90">{design.style}</dd>
              </>
            ) : null}
            {design.flavor ? (
              <>
                <dt className="text-grey-50">Flavour</dt>
                <dd className="text-grey-90">{design.flavor}</dd>
              </>
            ) : null}
            {design.weight ? (
              <>
                <dt className="text-grey-50">Weight</dt>
                <dd className="text-grey-90">{design.weight} kg</dd>
              </>
            ) : null}
            {design.tiers ? (
              <>
                <dt className="text-grey-50">Tiers</dt>
                <dd className="text-grey-90">{design.tiers}</dd>
              </>
            ) : null}
            {design.shape ? (
              <>
                <dt className="text-grey-50">Shape</dt>
                <dd className="text-grey-90">{design.shape}</dd>
              </>
            ) : null}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/ai-cake-studio?prompt=${encodeURIComponent(design.prompt)}`}
              className="rounded-lg bg-cf-orange px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cf-orange-dark"
            >
              Design a cake like this
            </Link>
            <Link
              href="/cake-size-calculator"
              className="rounded-lg border border-ui-border-base px-5 py-3 text-sm font-medium text-grey-80 transition-colors hover:border-grey-40"
            >
              What size do I need?
            </Link>
          </div>

          <p className="mt-6 text-xs text-grey-50">
            Designs are made with the CrossFriend AI Cake Studio and shared publicly by the customer
            who created them. A local baker makes the finished cake — the design is a starting point,
            not a photograph of a delivered order.
          </p>
        </div>
      </div>

      {siblings.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-heading text-lg font-semibold text-grey-90">
            {design.occasion ? `More ${design.occasion.toLowerCase()} designs` : "More designs"}
          </h2>
          {/* Real internal links between design pages. Without these every design hangs off the
              gallery index alone, which is a poor crawl path and gives a reader nowhere to go. */}
          <div className="mt-4 grid grid-cols-2 gap-4 small:grid-cols-3 medium:grid-cols-6">
            {siblings.map((sibling) => (
              <Link
                key={sibling.id}
                href={`/ai-cake-studio/gallery/${designSlug(sibling)}`}
                className="group"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-grey-5">
                  <Image
                    src={sibling.imageUrl}
                    alt={asTitle(sibling.prompt)}
                    fill
                    sizes="(max-width: 640px) 50vw, 16vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-grey-60">{asTitle(sibling.prompt)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
