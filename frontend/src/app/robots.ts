import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://telegramgeekspro.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/contacts",
          "/download",
          "/manuals",
          "/manuals/*",
          "/questions",
          "/reviews",
          "/partner",
          "/blog",
          "/blog/*",
          "/terms",
          "/privacy",
          "/cn",
          "/cn/*",
        ],
        disallow: [
          "/api/*",
          "/dashboard/*",
          "/admin/*",
          "/login",
          "/register",
          "/cart",
        ],
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Applebot-Extended", "Google-Extended", "CCBot", "Bytespider"],
        allow: [
          "/",
          "/about",
          "/manuals",
          "/manuals/*",
          "/blog",
          "/blog/*",
          "/llms.txt",
          "/llms-full.txt",
          "/cn",
          "/cn/*",
        ],
        disallow: [
          "/api/*",
          "/dashboard/*",
          "/admin/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
