import { sanityClient } from "./client"

/**
 * Everything the knowledge pages read, in one place.
 *
 * ── Why publishedAt is compared to now() ───────────────────────────────────────────────────────
 * `publishedAt <= now()` is what makes scheduling work: an editor can set a date in the future,
 * publish the document, and the article stays off the site until that moment arrives. Without the
 * comparison, "published" and "live" would be the same thing and the date field would be decoration.
 *
 * ── Why noIndex articles are still fetched ─────────────────────────────────────────────────────
 * noIndex means "do not list this in search results", not "do not serve it". The page renders
 * normally and stays linkable — it is simply left out of the sitemap and asks robots not to index
 * it. Filtering it out here would turn a search preference into a broken link for anyone who has
 * the URL.
 */

const ARTICLE_CARD = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  featured,
  coverImage,
  "category": category->{title, "slug": slug.current},
  "author": author->{name, role, isOrganization}
`

export interface ArticleCard {
  _id: string
  title: string
  slug: string
  excerpt: string
  publishedAt: string
  featured?: boolean
  coverImage?: unknown
  category?: { title: string; slug: string } | null
  author?: { name: string; role?: string; isOrganization?: boolean } | null
}

export interface ArticleAuthor {
  name: string
  role?: string
  credentials?: string
  bio?: string
  photo?: unknown
  sameAs?: string[] | null
  isOrganization?: boolean
  slug?: string
}

export interface Article extends Omit<ArticleCard, "author"> {
  body?: unknown[]
  updatedAt?: string
  seoTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  noIndex?: boolean
  tags?: string[]
  author?: ArticleAuthor | null
  reviewedBy?: ArticleAuthor | null
}

const AUTHOR_FULL = /* groq */ `
  name, role, credentials, bio, photo, sameAs, isOrganization, "slug": slug.current
`

/** Published, in-window articles, newest first. */
export async function getArticles(limit = 50): Promise<ArticleCard[]> {
  try {
    return await sanityClient.fetch(
      /* groq */ `*[_type == "article" && defined(slug.current) && publishedAt <= now()]
        | order(featured desc, publishedAt desc)[0...$limit]{ ${ARTICLE_CARD} }`,
      { limit },
      // Cached at the Data Cache layer; the page's own revalidate governs how often this re-runs.
      { next: { revalidate: 300, tags: ["knowledge"] } }
    )
  } catch (error) {
    console.error("[knowledge] failed to list articles", error)
    return []
  }
}

export async function getArticle(slug: string): Promise<Article | null> {
  try {
    return await sanityClient.fetch(
      /* groq */ `*[_type == "article" && slug.current == $slug && publishedAt <= now()][0]{
        ${ARTICLE_CARD},
        body, updatedAt, seoTitle, metaDescription, canonicalUrl, noIndex, tags,
        "author": author->{ ${AUTHOR_FULL} },
        "reviewedBy": reviewedBy->{ ${AUTHOR_FULL} }
      }`,
      { slug },
      { next: { revalidate: 300, tags: ["knowledge"] } }
    )
  } catch (error) {
    console.error("[knowledge] failed to load article", slug, error)
    return null
  }
}

/** Slugs for the sitemap — indexable articles only. */
export async function getIndexableSlugs(): Promise<{ slug: string; updated: string }[]> {
  try {
    return await sanityClient.fetch(
      /* groq */ `*[_type == "article" && defined(slug.current) && publishedAt <= now()
          && noIndex != true]{
        "slug": slug.current,
        "updated": coalesce(updatedAt, publishedAt)
      }`,
      {},
      { next: { revalidate: 300, tags: ["knowledge"] } }
    )
  } catch (error) {
    console.error("[knowledge] failed to list slugs for sitemap", error)
    return []
  }
}

/** Other articles to read next — same category first, never the one being read. */
export async function getRelated(slug: string, categorySlug?: string): Promise<ArticleCard[]> {
  try {
    return await sanityClient.fetch(
      /* groq */ `*[_type == "article" && slug.current != $slug && publishedAt <= now()]
        | order(select(category->slug.current == $categorySlug => 0, 1) asc, publishedAt desc)[0...3]{
          ${ARTICLE_CARD}
        }`,
      { slug, categorySlug: categorySlug ?? "" },
      { next: { revalidate: 300, tags: ["knowledge"] } }
    )
  } catch {
    return []
  }
}
