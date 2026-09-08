/**
 * Renders the favicon, the Apple touch icon and every route's Open Graph card to PNG.
 *
 * ── Why this is a script and not `opengraph-image.tsx` route files ──────────────────────────────
 * Next's ImageResponse would be the idiomatic answer, and it was tried first. It cannot be used
 * here: @vercel/og reads its bundled font and wasm at module scope via
 * `fileURLToPath(join(import.meta.url, "..."))`, which mangles a file:// URL into "file:/app/...".
 * Node 20 still accepts that form; Node 22+ rejects it, so importing the module throws
 * "TypeError: Invalid URL". Next treats metadata image routes as static assets and prerenders them
 * regardless of `export const dynamic`, so a single unusable import failed the entire build on any
 * machine running current Node.
 *
 * Rather than pin every developer to Node 20, the images are rendered once, here, inside a Node 20
 * container and committed as ordinary static files. The build then has no @vercel/og dependency at
 * all, `npm run build` works on any Node version, and the images are served as plain files instead
 * of being generated per request.
 *
 * The trade: a card cannot vary by route parameter, so /occasions/birthday and /occasions/diwali
 * share the "Occasion" card. That is still far better than the status quo it replaces, where nine
 * routes shared one generic site image.
 *
 * ── Running it ─────────────────────────────────────────────────────────────────────────────────
 *   npm run og
 *
 * Re-run after changing the palette or adding a route; commit the PNGs it writes.
 */

import fs from "node:fs"
import path from "node:path"

import React from "react"

import { ImageResponse } from "../node_modules/next/dist/compiled/@vercel/og/index.node.js"

const ROOT = path.resolve(import.meta.dirname, "..")
const APP = path.join(ROOT, "src", "app", "(main)")

const FONT = fs.readFileSync(path.join(ROOT, "public", "fonts", "noto-sans-regular.ttf"))

/**
 * One weight registered under both 400 and 700.
 *
 * Only the regular face is available and satori does not synthesise bold, so an unmatched 700 would
 * silently fall back to whatever the renderer has. Registering the same file for both keeps output
 * deterministic; hierarchy comes from size and colour instead.
 */
const FONTS = [
  { name: "Noto Sans", data: FONT, weight: 400, style: "normal" },
  { name: "Noto Sans", data: FONT, weight: 700, style: "normal" },
]

const PURPLE = "#7B2FF7"

/**
 * The hero cake, inlined as a data URI.
 *
 * satori has no network access and no filesystem resolution for <img src>, so a path or URL renders
 * as nothing — silently, with the layout still succeeding. Embedding the bytes is the only reliable
 * way to get a photograph into these cards.
 *
 * A photo rather than another gradient because a share card competes in a feed against real
 * photographs. The abstract gradient version this replaces was legible but anonymous: nothing in it
 * said "cake", which is the one thing a stranger seeing the link needs to understand in the half
 * second before they scroll past.
 */
const HERO_CAKE = fs.readFileSync(
  path.join(ROOT, "public", "ai-cake-studio", "hero", "hero-cake.jpg")
)
const HERO_CAKE_URI = `data:image/jpeg;base64,${HERO_CAKE.toString("base64")}`
const el = (type, style, ...children) => React.createElement(type, { style }, ...children)

/** Facebook and WhatsApp both crop toward 1.91:1; 1200×630 is the size everything agrees on. */
const OG_SIZE = { width: 1200, height: 630 }

function ogCard({ eyebrow, title, subtitle, photo }) {
  // Long titles shrink rather than wrap indefinitely — otherwise the text pushes the wordmark off
  // the bottom of the card, which reads as a broken image rather than a long title.
  // The text column is narrower when a photo shares the card, so the thresholds tighten with it.
  const titleSize = photo
    ? title.length > 34 ? 54 : title.length > 22 ? 64 : 74
    : title.length > 46 ? 62 : title.length > 28 ? 76 : 92

  const textPanel = el(
    "div",
    {
      width: photo ? 700 : "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: 72,
      background: `linear-gradient(135deg, ${PURPLE} 0%, #8B47FF 45%, #FF2D87 100%)`,
      color: "#FFFFFF",
      fontFamily: "Noto Sans",
    },
    eyebrow
      ? el(
          "div",
          {
            display: "flex",
            alignSelf: "flex-start",
            padding: "10px 22px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.18)",
            fontSize: 26,
            letterSpacing: 2,
          },
          eyebrow.toUpperCase()
        )
      : el("div", { display: "flex" }),
    el(
      "div",
      { display: "flex", flexDirection: "column" },
      el("div", { display: "flex", fontSize: titleSize, lineHeight: 1.05, letterSpacing: -2 }, title),
      subtitle
        ? el(
            "div",
            { display: "flex", fontSize: 32, marginTop: 18, color: "rgba(255,255,255,0.86)" },
            subtitle
          )
        : el("div", { display: "flex" })
    ),
    el(
      "div",
      { display: "flex", alignItems: "center" },
      el(
        "div",
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 52,
          height: 52,
          borderRadius: 13,
          background: "#FFFFFF",
          color: PURPLE,
          fontSize: 34,
        },
        "C"
      ),
      el("div", { display: "flex", fontSize: 34, marginLeft: 16 }, "crossfriend.in")
    )
  )

  if (!photo) return textPanel

  /**
   * A clean vertical split rather than a photo bleeding under the text.
   *
   * satori supports absolute positioning but not the blend modes or blurred masks that would make
   * an overlap look deliberate, and a half-faded photo behind white text is the exact effect that
   * reads as a rendering bug. A hard edge at least looks chosen — and it keeps the text on flat
   * colour, which is what survives WhatsApp's aggressive recompression.
   */
  return el(
    "div",
    { width: "100%", height: "100%", display: "flex", fontFamily: "Noto Sans" },
    textPanel,
    el(
      "div",
      { display: "flex", width: 500, height: "100%", overflow: "hidden" },
      /**
       * Built with React.createElement directly, not the el() helper.
       *
       * el() forwards its second argument as `style` only — fine for divs, but an <img> needs src,
       * width and height as real props. Passing them through el() puts them in the style object,
       * where satori silently ignores them and then throws "Image source is not provided" from deep
       * inside the renderer, naming nothing that points back to the call site.
       */
      React.createElement("img", {
        src: photo,
        width: 500,
        height: 630,
        style: { objectFit: "cover" },
      })
    )
  )
}

function markCard({ size, background, radius, fontSize }) {
  return el(
    "div",
    {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background,
      borderRadius: radius,
      color: "#FFFFFF",
      fontFamily: "Noto Sans",
      fontSize,
      letterSpacing: -Math.round(size / 30),
    },
    "C"
  )
}

async function write(target, element, size) {
  const response = new ImageResponse(element, { ...size, fonts: FONTS })
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, buffer)
  console.log(`  ${path.relative(ROOT, target).replace(/\\/g, "/")}  ${buffer.length} bytes`)
}

/** Every route that gets its own card, and what it says. */
const ROUTES = [
  // The route group root. Covers "/" and becomes the fallback card for every page in (main)
  // that does not define its own, which is how the homepage came to have no og:image at all: the
  // per-route cards were added one by one and the most-shared URL on the site was never one of them.
  ["", "", "Make every celebration unforgettable", "Cakes, decorations, gifts and more", HERO_CAKE_URI],
  ["occasions", "Browse", "Shop by occasion", "Birthdays, anniversaries, festivals and more"],
  ["occasions/[occasion]", "Occasion", "Cakes for the occasion", "From bakers near you"],
  ["collections", "Browse", "Collections", "Curated picks for every celebration"],
  ["collections/[handle]", "Collection", "Shop the collection", "Curated picks on CrossFriend"],
  ["categories", "Browse", "Categories", "Cakes, decorations, gifts and costumes"],
  ["bakers", "Network", "Local bakers", "Verified home bakers and bakeries near you"],
  ["ready-to-order", "Marketplace", "Ready to order", "Same-day cakes from bakers near you"],
  ["ready-to-order/[category]", "Ready to order", "Order today", "Delivered by bakers near you"],
  ["store", "Shop", "Shop all", "Everything for your celebration, in one place"],
  ["cake-size-calculator", "Tool", "Cake size calculator", "How much cake do you actually need?"],
]

console.log("Icons:")
await write(
  path.join(ROOT, "src", "app", "icon.png"),
  // Flat purple, not a gradient: at 32px a gradient reads as mud, and the icon has to survive being
  // rendered next to twenty other tabs.
  markCard({ size: 32, background: PURPLE, radius: 7, fontSize: 22 }),
  { width: 32, height: 32 }
)
await write(
  path.join(ROOT, "src", "app", "apple-icon.png"),
  // No radius and fully opaque: iOS applies its own mask, and composites over black, so a rounded
  // or transparent source gets pale corners inside the system shape.
  markCard({
    size: 180,
    background: `linear-gradient(135deg, ${PURPLE} 0%, #A575FF 55%, #FF2D87 100%)`,
    radius: 0,
    fontSize: 118,
  }),
  { width: 180, height: 180 }
)

console.log("Open Graph cards:")
for (const [route, eyebrow, title, subtitle, photo] of ROUTES) {
  await write(
    path.join(APP, route, "opengraph-image.png"),
    ogCard({ eyebrow, title, subtitle, photo }),
    OG_SIZE
  )
}

/**
 * Site-wide fallbacks at src/app root, covering two gaps the per-route cards do not.
 *
 * The repo shipped with the Medusa starter's own artwork here — a "Next.js Starter Template" card
 * showing the Next.js and Medusa logos and a demo store screenshot. opengraph-image.jpg was masked
 * for most pages by the (main) group's card, but twitter-image.jpg had no override anywhere, so
 * every page on the site offered that image to any platform preferring twitter:image over og:image.
 * Anyone sharing crossfriend.in on X or LinkedIn was advertising the framework.
 *
 * Both are regenerated here so the fallback is a CrossFriend card rather than absent — a route
 * outside (main) with no card of its own should still preview as this brand.
 */
console.log("Site-wide fallbacks:")
const fallback = ogCard({
  eyebrow: "",
  title: "Make every celebration unforgettable",
  subtitle: "Cakes, decorations, gifts and more",
  photo: HERO_CAKE_URI,
})
await write(path.join(ROOT, "src", "app", "opengraph-image.png"), fallback, OG_SIZE)
await write(path.join(ROOT, "src", "app", "twitter-image.png"), fallback, OG_SIZE)

console.log(`\nDone — ${ROUTES.length + 2} images.`)
