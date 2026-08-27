import type { MetadataRoute } from "next"

/**
 * Web app manifest.
 *
 * Not an attempt to make CrossFriend a PWA — nobody is going to install a cake shop, and pretending
 * otherwise would mean shipping a service worker with an offline story nobody maintains. What it
 * actually buys is smaller and real:
 *
 *   - `theme_color` tints the Android Chrome toolbar to the brand instead of leaving it grey.
 *   - `name` / `short_name` are what a home-screen shortcut is labelled, rather than the page title
 *     truncated at whatever character it lands on.
 *   - It stops the "no manifest" warning in Lighthouse from sitting next to findings that matter.
 *
 * The icons point at the generated routes rather than static files, so there is exactly one
 * definition of the mark and the manifest cannot go stale against it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CrossFriend — Make Every Celebration Unforgettable",
    short_name: "CrossFriend",
    description:
      "Plan your perfect celebration. Shop cakes, decorations, gifts, costumes and more — all in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#7B2FF7",
    lang: "en-IN",
    /**
     * Points at the static files Next serves from src/app/icon.png and apple-icon.png, so there is
     * one definition of the mark and the manifest cannot go stale against it. Regenerate both with
     * `npm run og`.
     */
    icons: [
      { src: "/icon.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }
}
