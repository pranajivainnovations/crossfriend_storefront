import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { imageUrl } from "@lib/sanity/client"
import { getArticles, type ArticleCard } from "@lib/sanity/queries"
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScriptProps,
} from "@lib/util/seo"

/**
 * The knowledge index.
 *
 * ── Why this is not force-dynamic ──────────────────────────────────────────────────────────────
 * Unlike every catalogue page on this site, nothing here comes from Medusa — it is all Sanity, read
 * from a globally distributed CDN, with no cookies involved. So it can be genuinely cached rather
 * than rendered from scratch per request, which is also why it is the fastest page on the site.
 */
export const revalidate = 300

const TITLE = "Knowledge — Cake Guides & Celebration Ideas"
const DESCRIPTION =
  "Practical guides to planning a celebration — how much cake to order, what a baker needs from a design, and ideas worth stealing."

export const metadata: Metadata = {
  alternates: { canonical: "/knowledge" },
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/knowledge"),
    type: "website",
    locale: "en_IN",
  },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  })
}

function Card({ article, featured = false }: { article: ArticleCard; featured?: boolean }) {
  const cover = imageUrl(article.coverImage, { width: featured ? 1200 : 600, height: featured ? 630 : 340 })
  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-cf-purple-200 hover:shadow-md ${
        featured ? "small:col-span-2" : ""
      }`}
    >
      <Link href={`/knowledge/${article.slug}`} className="block">
        {cover && (
          <div className={`relative w-full ${featured ? "aspect-[1200/630]" : "aspect-[600/340]"}`}>
            <Image
              src={cover}
              alt=""
              fill
              unoptimized
              sizes={featured ? "(min-width: 1024px) 800px, 100vw" : "(min-width: 1024px) 400px, 100vw"}
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          </div>
        )}
        <div className="p-5">
          {article.category && (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-cf-purple-600">
              {article.category.title}
            </p>
          )}
          <h2
            className={`mt-1.5 font-heading font-semibold text-slate-900 ${
              featured ? "text-2xl" : "text-lg"
            }`}
          >
            {article.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
            {article.excerpt}
          </p>
          <p className="mt-3 text-xs text-slate-400">
            {[article.author?.name, formatDate(article.publishedAt)].filter(Boolean).join("  ·  ")}
          </p>
        </div>
      </Link>
    </article>
  )
}

export default async function KnowledgeIndexPage() {
  const articles = await getArticles()
  const [first, ...rest] = articles

  return (
    <div className="bg-cf-warm min-h-screen">
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Knowledge", path: "/knowledge" },
          ])
        )}
      />

      <div className="content-container py-12 small:py-16">
        <header className="max-w-2xl">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900 small:text-4xl">
            Knowledge
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">{DESCRIPTION}</p>
        </header>

        {articles.length === 0 ? (
          /* A real empty state rather than a blank page. This is what shows before the first
             article is published, and it still gives a reader somewhere useful to go. */
          <div className="mt-10 rounded-2xl border border-dashed border-cf-purple-200 bg-white px-6 py-12 text-center">
            <p className="text-2xl">📝</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              The first articles are being written.
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              In the meantime, the{" "}
              <Link href="/cake-size-calculator" className="font-semibold text-cf-purple-700 underline underline-offset-2">
                cake size calculator
              </Link>{" "}
              answers the question we get asked most, and the{" "}
              <Link href="/ai-cake-studio" className="font-semibold text-cf-purple-700 underline underline-offset-2">
                design studio
              </Link>{" "}
              is free to use anywhere in India.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 small:grid-cols-2">
            {first && <Card article={first} featured={articles.length > 1} />}
            {rest.map((article) => (
              <Card key={article._id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
