import type { MetadataRoute } from "next"

import { BASE_URL } from "@lib/util/seo"

/**
 * Replaces the never-installed next-sitemap package. `next-sitemap.js` sat in the repo as a config
 * file for a dependency that was not in package.json and not in node_modules, so no robots.txt or
 * sitemap.xml had ever been generated — both were 404 in production.
 *
 * Native App Router routes need no dependency and, unlike a build-time generator, reflect the
 * catalogue as it is now rather than as it was at the last deploy. That matters here: bakers add
 * products between deploys, and a stale sitemap would hide them until someone happened to ship.
 */
const PRIVATE_PATHS = [
  "/checkout",
  "/account",
  "/account/",
  "/cart",
  "/order/confirmed/",
  // Switched off in store.config.json — it answers every query with nothing, so there is no reason
  // to spend crawl budget on it.
  "/search",
]

/**
 * AI crawlers, named explicitly.
 *
 * `userAgent: "*"` already permits every one of these, so this block changes nothing today. It is
 * here as a decision written down: CrossFriend WANTS to appear in AI answers, because "can I
 * design a cake with AI?" is a question we can actually win, and being absent from the models that
 * answer it is the same as not existing. Naming the bots means a future blanket restriction has to
 * be a deliberate act rather than a side effect.
 *
 * OAI-SearchBot / PerplexityBot / ClaudeBot serve live answers with citations. GPTBot, CCBot and
 * Google-Extended feed training and grounding corpora — slower, but that is how a model comes to
 * know a brand exists at all, which is the thing we currently lack.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
  "Amazonbot",
  "Bytespider",
  "cohere-ai",
  "Diffbot",
  "omgili",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      // Same permissions, stated for each named agent.
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
