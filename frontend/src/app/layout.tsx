import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://telegramgeekspro.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TelegramGeeks Pro — Next-Gen Telegram Automation OS & AI Personas",
    template: "%s — TelegramGeeks Pro",
  },
  description:
    "Enterprise Telegram marketing, scraping, warm-up, and engagement toolkit. 77+ MTProto automation modules, autonomous AI personas, TData 2-way converter, and zero-ban proxy rotation.",
  keywords: [
    "telegram automation",
    "telegram scraper",
    "telegram expert alternative",
    "tdata converter",
    "telegram ai persona",
    "telegram mass dm",
    "telegram account warmup",
    "telegram bot creator",
    "mtproto automation software",
  ],
  authors: [{ name: "TelegramGeeks Research Team", url: siteUrl }],
  creator: "TelegramGeeks Pro",
  publisher: "TelegramGeeks Pro",
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "zh-CN": "/cn",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "TelegramGeeks Pro — Next-Gen Telegram Automation OS & AI Personas",
    description:
      "Enterprise Telegram marketing & automation suite. 77+ modules, autonomous AI warmup state machines, scrapers, and TData session converters.",
    siteName: "TelegramGeeks Pro",
    images: [
      {
        url: "/assets/hero/screenshot.png",
        width: 1200,
        height: 630,
        alt: "TelegramGeeks Pro Automation Platform Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TelegramGeeks Pro — Next-Gen Telegram Automation OS",
    description:
      "Enterprise Telegram automation, AI persona warming, scrapers, and 2-way session converters.",
    creator: "@telegramgeeks",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "TelegramGeeks Pro",
      url: siteUrl,
      logo: `${siteUrl}/assets/hero/screenshot.png`,
      sameAs: [
        "https://t.me/telegramgeeks",
        "https://github.com/researchprohub/telegram-geeks",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "TelegramGeeks Pro",
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/blog?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "TelegramGeeks Pro",
      operatingSystem: "Windows 10/11, macOS, Linux, Web Cloud",
      applicationCategory: "BusinessApplication",
      offers: {
        "@type": "Offer",
        price: "49.00",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "1280",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
