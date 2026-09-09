const { withStoreConfig } = require("./store-config")
const store = require("./store.config.json")

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = withStoreConfig({
  features: store.features,
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'medusa-public-images.s3.eu-west-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pranajiva-innovations.s3.eu-north-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    // Optimize image delivery
    formats: ['image/avif', 'image/webp'],
    // Optimized derivatives are expensive to produce and these images effectively never change, so
    // there's no reason to re-encode them daily. Replacing an image in place now needs a new
    // filename (or a ?v= query) to be picked up promptly — that's the trade for not paying the
    // optimizer over and over for identical output.
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Default includes 3840px (4K). Nothing on this storefront renders an image anywhere near that
    // wide, so every entry is a srcset candidate that costs an encode and buys nothing.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
  // Compression
  compress: true,
  // Powered-by header removal for security & slightly smaller response
  poweredByHeader: false,
  // Enable scroll restoration
  experimental: {
    scrollRestoration: true,
    /**
     * Packages the bundler must leave alone and let Node require at runtime.
     *
     * satori shapes text with a harfbuzz WebAssembly module and lays it out with yoga, and it loads
     * both by resolving a path relative to its own file. Bundled into a route, that path becomes the
     * route's own output directory — which does not contain hb.wasm, so the first request aborts
     * with an ENOENT from inside the wasm loader. It builds cleanly and fails only when called,
     * which is the worst shape a failure can take.
     *
     * sharp is here for the ordinary reason: it is a native binding and cannot be bundled at all.
     *
     * This is the same family of problem that scripts/generate-og-images.mjs documents for
     * @vercel/og — a library resolving its own wasm through a path that does not survive the trip.
     * Externalising is the fix that keeps working, because the package is then loaded from
     * node_modules where its own layout is intact.
     */
    serverComponentsExternalPackages: ["satori", "sharp"],
    /**
     * Files the standalone build must carry that nothing imports by name.
     *
     * Externalising satori fixes the path it resolves the wasm *through*; it does not make the wasm
     * exist. Next builds `output: "standalone"` by tracing `require`/`import` statements, and both of
     * satori's WebAssembly modules are loaded from a computed path — so the tracer never sees them,
     * `harfbuzzjs` is left out of the standalone tree entirely, and `satori/yoga.wasm` is dropped
     * while `satori/dist` is copied.
     *
     * The result builds clean and then throws ENOENT on the first request in production. It was
     * caught here only by listing the standalone output; nothing about the build says a word.
     *
     * The font is included for the same reason — render.ts reads it off disk from `public/`, which
     * the Dockerfile does copy, but naming it here means the route stops depending on that staying
     * true.
     */
    outputFileTracingIncludes: {
      "/api/ai-studio/designs/[id]/share-card": [
        "./node_modules/satori/*.wasm",
        "./node_modules/harfbuzzjs/*.wasm",
        "./node_modules/harfbuzzjs/*.js",
        "./node_modules/harfbuzzjs/package.json",
        "./public/fonts/noto-sans-regular.ttf",
      ],
    },
  },
  // Redirect trailing slashes for cleaner SEO URLs
  trailingSlash: false,
  /**
   * /store previously 308'd to /ready-to-order. That was wrong and is removed.
   *
   * The reasoning at the time — "two URLs for one catalogue splits search ranking" — assumed they
   * were the same catalogue. They are not: /store is the whole CrossFriend catalogue sliced by
   * occasion × product type, /ready-to-order is the baker marketplace sliced by the Ready-to-Order
   * category tree. Collapsing them also silently destroyed type navigation, because ~30 links point
   * at /store?type=… and the marketplace page never read that parameter.
   *
   * /design-your-cake → /ai-cake-studio stays a real redirect (that one genuinely is one page under
   * two names) and lives in its own page component.
   */
  async redirects() {
    return []
  },
  // Headers for caching static assets
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ]
  },
})

module.exports = nextConfig
