import { PortableText, type PortableTextComponents } from "@portabletext/react"
import Image from "next/image"
import Link from "next/link"

import { imageUrl } from "@lib/sanity/client"

/**
 * Renders an article body from Portable Text.
 *
 * ── Why headings start at h2 ───────────────────────────────────────────────────────────────────
 * The page's own headline is the h1 and the schema offers editors nothing above h2, so the document
 * outline stays correct without anyone having to think about it. Each heading gets an id derived
 * from its text, which is what makes a section directly linkable — and what lets an answer engine
 * cite a specific part of a long article rather than the whole page.
 *
 * ── Why external links are treated differently ─────────────────────────────────────────────────
 * An outbound link opens in a new tab with `rel="noopener"`, because `target="_blank"` without it
 * hands the destination a handle on this window. Internal links stay in the tab and go through
 * next/link so navigation is client-side.
 */

/** Stable, readable anchor for a heading. */
function slugifyHeading(children: React.ReactNode): string {
  const text = Array.isArray(children)
    ? children.map((c) => (typeof c === "string" ? c : "")).join(" ")
    : String(children ?? "")
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
}

/** Pulls the 11-character video id out of any of YouTube's URL shapes. */
function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )
  return m ? m[1] : null
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2
        id={slugifyHeading(children)}
        className="mt-10 scroll-mt-24 font-heading text-2xl font-semibold text-slate-900"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        id={slugifyHeading(children)}
        className="mt-8 scroll-mt-24 font-heading text-xl font-semibold text-slate-900"
      >
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-cf-purple-200 pl-4 text-lg italic text-slate-600">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="mt-4 text-[17px] leading-8 text-slate-700">{children}</p>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 list-disc space-y-2 pl-6 text-[17px] leading-8 text-slate-700">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-[17px] leading-8 text-slate-700">
        {children}
      </ol>
    ),
  },
  marks: {
    link: ({ value, children }) => {
      const href: string = value?.href ?? "#"
      const isInternal = href.startsWith("/")
      if (isInternal) {
        return (
          <Link href={href} className="font-medium text-cf-purple-700 underline underline-offset-2">
            {children}
          </Link>
        )
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-cf-purple-700 underline underline-offset-2"
        >
          {children}
        </a>
      )
    },
  },
  types: {
    image: ({ value }) => {
      const url = imageUrl(value, { width: 1200 })
      if (!url) return null
      return (
        <figure className="my-8">
          {/* Unoptimised on purpose: Sanity's CDN already resized and re-encoded this, and routing
              it through Next's optimiser would fetch the original into the container and redo the
              work. See imageUrl(). */}
          <Image
            src={url}
            alt={value?.alt ?? ""}
            width={1200}
            height={675}
            unoptimized
            className="h-auto w-full rounded-xl"
          />
          {value?.caption && (
            <figcaption className="mt-2 text-center text-sm text-slate-500">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
    youtube: ({ value }) => {
      const id = value?.url ? youtubeId(value.url) : null
      if (!id) return null
      return (
        <figure className="my-8">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100">
            <iframe
              /* youtube-nocookie so a reader who never presses play is not given an advertising
                 cookie. loading="lazy" keeps a video far down the page from competing with the
                 article itself for bandwidth on first paint. */
              src={`https://www.youtube-nocookie.com/embed/${id}`}
              title={value.title ?? "Video"}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
          {value?.caption && (
            <figcaption className="mt-2 text-center text-sm text-slate-500">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
}

export default function ArticleBody({ value }: { value: unknown[] }) {
  return <PortableText value={value as never} components={components} />
}
