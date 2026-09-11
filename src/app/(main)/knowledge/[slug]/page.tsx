import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { imageUrl } from "@lib/sanity/client"
import { getArticle, getRelated, type ArticleAuthor } from "@lib/sanity/queries"
import {
  ORGANIZATION_ID,
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScriptProps,
} from "@lib/util/seo"
import ArticleBody from "@modules/knowledge/components/article-body"

export const revalidate = 300

type Props = { params: { slug: string } }

/**
 * ── Why empty metadata rather than a "not found" title ─────────────────────────────────────────
 * Returning a populated object here commits the response, and the notFound() below then renders the
 * not-found UI under an HTTP 200 — a soft 404, which Google indexes as a real page. Returning {}
 * leaves the status uncommitted so the component produces a genuine 404. This is the same trap that
 * the gallery route fell into; see /products/[handle], which does exactly this and answers correctly.
 *
 * There must also be no loading.tsx above this route. A loading file creates a Suspense boundary for
 * its whole subtree, Next then streams, and a streamed response has already sent its 200 before the
 * page can change it.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle(params.slug)
  if (!article) return {}

  const path = `/knowledge/${article.slug}`
  const title = article.seoTitle || article.title
  const description = article.metaDescription || article.excerpt
  const cover = imageUrl(article.coverImage, { width: 1200, height: 630 })

  return {
    title,
    description,
    /* A self-referencing canonical unless the piece was genuinely first published elsewhere. */
    alternates: { canonical: article.canonicalUrl || path },
    robots: article.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      type: "article",
      locale: "en_IN",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      ...(cover ? { images: [{ url: cover, width: 1200, height: 630, alt: article.title }] } : {}),
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title,
      description,
      ...(cover ? { images: [cover] } : {}),
    },
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  })
}

/**
 * An author as structured data.
 *
 * Person or Organization is not cosmetic: describing "CrossFriend — Editorial team" as a Person is
 * a false statement about a real entity, and a search engine that already resolves that name to a
 * company reads the mismatch as a reason to trust the page less. The editor decides, via the
 * "This is a brand, not a person" switch on the author record.
 */
function authorJsonLd(author: ArticleAuthor) {
  const sameAs = (author.sameAs ?? []).filter(Boolean)
  return {
    "@type": author.isOrganization ? "Organization" : "Person",
    name: author.name,
    ...(author.role ? { jobTitle: author.role } : {}),
    ...(author.credentials ? { hasCredential: author.credentials } : {}),
    ...(author.bio ? { description: author.bio } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
}

function Byline({ author, label }: { author: ArticleAuthor; label: string }) {
  const photo = imageUrl(author.photo, { width: 80, height: 80 })
  return (
    <div className="flex items-center gap-3">
      {photo && (
        <Image
          src={photo}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="h-10 w-10 rounded-full object-cover"
        />
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">
          <span className="font-normal text-slate-500">{label} </span>
          {author.name}
        </p>
        {(author.role || author.credentials) && (
          <p className="truncate text-xs text-slate-500">
            {[author.role, author.credentials].filter(Boolean).join("  ·  ")}
          </p>
        )}
      </div>
    </div>
  )
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle(params.slug)
  if (!article) notFound()

  const path = `/knowledge/${article.slug}`
  const cover = imageUrl(article.coverImage, { width: 1400, height: 700 })
  const related = await getRelated(article.slug, article.category?.slug)

  /**
   * The Article node.
   *
   * datePublished and dateModified are the two properties an answer engine leans on to decide
   * whether a source is current enough to quote — which is why the schema keeps them as editorial
   * fields rather than reusing Sanity's internal timestamps.
   */
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${absoluteUrl(path)}#article`,
    headline: article.title,
    description: article.metaDescription || article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    publisher: { "@id": ORGANIZATION_ID },
    ...(article.author ? { author: authorJsonLd(article.author) } : {}),
    ...(article.reviewedBy ? { reviewedBy: authorJsonLd(article.reviewedBy) } : {}),
    ...(cover ? { image: cover } : {}),
    ...(article.tags?.length ? { keywords: article.tags.join(", ") } : {}),
    inLanguage: "en-IN",
  }

  return (
    <div className="bg-cf-warm min-h-screen">
      <script {...jsonLdScriptProps(articleJsonLd)} />
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Knowledge", path: "/knowledge" },
            { name: article.title, path },
          ])
        )}
      />

      <article className="content-container py-10 small:py-14">
        <div className="mx-auto max-w-2xl">
          <nav className="text-xs text-slate-500">
            <Link href="/knowledge" className="underline underline-offset-2 hover:text-slate-700">
              Knowledge
            </Link>
            {article.category && <span>  ·  {article.category.title}</span>}
          </nav>

          <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight tracking-tight text-slate-900 small:text-4xl">
            {article.title}
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-slate-600">{article.excerpt}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-slate-200 py-4">
            {article.author && <Byline author={article.author} label="By" />}
            {article.reviewedBy && <Byline author={article.reviewedBy} label="Reviewed by" />}
            <p className="text-xs text-slate-500">
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
              {/* Shown only when a real revision happened — see the schema note on updatedAt. */}
              {article.updatedAt && article.updatedAt !== article.publishedAt && (
                <>
                  {"  ·  Updated "}
                  <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time>
                </>
              )}
            </p>
          </div>
        </div>

        {cover && (
          <div className="relative mx-auto mt-8 aspect-[2/1] w-full max-w-4xl overflow-hidden rounded-2xl">
            <Image
              src={cover}
              alt={(article.coverImage as { alt?: string })?.alt ?? ""}
              fill
              unoptimized
              priority
              sizes="(min-width: 1024px) 900px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="mx-auto mt-8 max-w-2xl">
          {article.body ? (
            <ArticleBody value={article.body} />
          ) : (
            <p className="text-slate-500">This article has no body yet.</p>
          )}

          {article.tags?.length ? (
            <ul className="mt-10 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {related.length > 0 && (
          <aside className="mx-auto mt-14 max-w-4xl border-t border-slate-200 pt-8">
            <h2 className="font-heading text-xl font-semibold text-slate-900">Read next</h2>
            <ul className="mt-4 grid gap-4 small:grid-cols-3">
              {related.map((r) => (
                <li key={r._id}>
                  <Link
                    href={`/knowledge/${r.slug}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-cf-purple-200 hover:shadow-sm"
                  >
                    <p className="font-heading text-sm font-semibold leading-snug text-slate-900">
                      {r.title}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{r.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </article>
    </div>
  )
}
