const excludedPaths = ["/checkout", "/account/*"]

module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_VERCEL_URL,
  generateRobotsTxt: true,
  changefreq: "daily",
  priority: 0.7,
  exclude: excludedPaths.concat(["/[sitemap]"]),
  additionalPaths: async (config) => {
    // Add explicit priority for key pages
    return [
      { loc: "/", changefreq: "daily", priority: 1.0 },
      { loc: "/store", changefreq: "daily", priority: 0.9 },
      { loc: "/collections", changefreq: "daily", priority: 0.8 },
      { loc: "/categories", changefreq: "daily", priority: 0.8 },
      { loc: "/occasions", changefreq: "weekly", priority: 0.8 },
      { loc: "/occasions/birthday", changefreq: "weekly", priority: 0.7 },
      { loc: "/occasions/anniversary", changefreq: "weekly", priority: 0.7 },
      { loc: "/occasions/festival", changefreq: "weekly", priority: 0.7 },
      { loc: "/occasions/kids", changefreq: "weekly", priority: 0.7 },
      { loc: "/occasions/special", changefreq: "weekly", priority: 0.7 },
    ]
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: "*",
        disallow: excludedPaths,
      },
    ],
    additionalSitemaps: [],
  },
}
