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
  },
  // Redirect trailing slashes for cleaner SEO URLs
  trailingSlash: false,
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
