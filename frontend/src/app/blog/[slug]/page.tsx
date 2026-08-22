import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { blogApi } from "@/lib/api";
import { markdownToHtml } from "@/lib/markdown";
import {
  ArrowLeft, ArrowRight, Calendar, PenLine, Tag, Clock,
  Share2, Check, Download, ShieldCheck, Zap,
  ChevronRight, Bookmark, Sparkles, BookOpen, Layers
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { STATIC_ARTICLES } from "@/data/static-articles";

async function fetchPost(slug: string) {
  try {
    const res = await blogApi.getPost(slug);
    if (res.data) return res.data;
  } catch {}
  return STATIC_ARTICLES.find((a) => a.slug === slug) || null;
}

async function fetchPosts() {
  try {
    const res = await blogApi.listPosts({ page_size: 100 });
    const items = res.data?.items;
    if (items && items.length >= STATIC_ARTICLES.length) return items;
  } catch {}
  return STATIC_ARTICLES;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Post not found — TelegramGeeks Pro" };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://telegramgeekspro.com";
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;
  const imageUrl = post.cover_image ? `${siteUrl}${post.cover_image}` : `${siteUrl}/assets/hero/screenshot.png`;

  return {
    title: `${post.seo_title || post.title} — TelegramGeeks Pro`,
    description: post.seo_description || post.excerpt || "",
    keywords: post.seo_keywords || "telegram automation, mtproto, telegram marketing",
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || "",
      url: canonicalUrl,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: post.title }],
      type: "article",
      publishedTime: post.published_at,
      authors: [post.author_name || "Telegram Geeks Research Team"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || "",
      images: [imageUrl],
    },
  };
}

function extractHeadings(md: string): { id: string; text: string; level: number }[] {
  const lines = md.split("\n");
  const headings: { id: string; text: string; level: number }[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.*)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      headings.push({ id, text, level });
    }
  }
  return headings;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  const html = markdownToHtml(post.content);
  const headings = extractHeadings(post.content);

  const all = await fetchPosts();
  const related = all.filter((p: any) => p.id !== post.id && (p.category_name === post.category_name || true)).slice(0, 3);
  
  const curIndex = all.findIndex((p: any) => p.slug === post.slug);
  const prevPost = curIndex > 0 ? all[curIndex - 1] : null;
  const nextPost = curIndex >= 0 && curIndex < all.length - 1 ? all[curIndex + 1] : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://telegramgeekspro.com";
  const articleUrl = `${siteUrl}/blog/${post.slug}`;
  const shareText = encodeURIComponent(`${post.title} — TelegramGeeks Pro`);
  const shareUrl = encodeURIComponent(articleUrl);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description || post.excerpt || "",
    image: post.cover_image ? [`${siteUrl}${post.cover_image}`] : undefined,
    datePublished: post.published_at || new Date().toISOString(),
    dateModified: post.published_at || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: post.author_name || "Telegram Geeks Research Team",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "TelegramGeeks Pro",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/assets/brand/logo-icon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Navbar />

      <main className="pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* ── Breadcrumb Navigation ── */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
            <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
            <span className="text-primary font-medium">{post.category_name || "Guide"}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
            <span className="text-foreground/80 truncate max-w-[280px] sm:max-w-md">{post.title}</span>
          </nav>

          {/* ── Article Header ── */}
          <header className="max-w-4xl mb-10">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/25">
                {post.category_name || "Technical Guide"}
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-secondary/80 text-muted-foreground border border-border/80">
                Verified 2026
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-[1.25] mb-5">
              {post.title}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 font-normal">
              {post.excerpt}
            </p>

            {/* Author & Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border/70 text-xs text-muted-foreground bg-card/40 rounded-xl px-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-black font-bold text-xs shadow-sm">
                  TG
                </div>
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>{post.author_name || "Telegram Geeks Research Team"}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-[11px] text-muted-foreground">Protocol & Anti-Detection Lab</div>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                {post.published_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                )}
                {post.reading_time_minutes && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{post.reading_time_minutes} min read</span>
                  </div>
                )}
                {post.view_count && (
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>{post.view_count.toLocaleString()} views</span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ── Main Layout: Article Body (8 cols) + Sticky Sidebar (4 cols) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            
            {/* ── Left Column: Article Body ── */}
            <article className="lg:col-span-8 min-w-0">
              
              {/* Featured Cover Art */}
              {post.cover_image && (
                <div className="mb-10 rounded-2xl overflow-hidden border border-border bg-[#05080f] shadow-2xl relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full aspect-[16/9] object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              )}

              {/* Key Takeaways Box */}
              <div className="mb-10 p-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] via-card to-card shadow-lg">
                <div className="flex items-center gap-2 font-bold text-sm text-primary mb-3">
                  <BookOpen className="w-4 h-4" />
                  <span>Executive Takeaways & Key Insights</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Complete architectural breakdown of MTProto protocol parameters and anti-detection thresholds.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Actionable step-by-step procedures to scale multi-account operations with zero correlation flags.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Automated workflows compatible with both Web Cloud and Windows Desktop Workstation clients.</span>
                  </li>
                </ul>
              </div>

              {/* Parsed Markdown Body */}
              <div
                className="blog-content prose-invert max-w-none text-foreground/90"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {/* Share & Feedback Footer */}
              <div className="mt-12 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">Share Guide:</span>
                  <a
                    href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 text-xs font-medium transition"
                  >
                    <span>Telegram</span>
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground hover:text-primary text-xs font-medium transition"
                  >
                    <span>X (Twitter)</span>
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground hover:text-primary text-xs font-medium transition"
                  >
                    <span>LinkedIn</span>
                  </a>
                </div>

                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to all articles
                </Link>
              </div>

              {/* Prev / Next Pagination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-border">
                {prevPost ? (
                  <Link
                    href={`/blog/${prevPost.slug}`}
                    className="p-4 rounded-xl border border-border bg-card/60 hover:border-primary/40 hover:bg-card transition flex flex-col group"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Previous Guide
                    </span>
                    <span className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {prevPost.title}
                    </span>
                  </Link>
                ) : <div />}

                {nextPost ? (
                  <Link
                    href={`/blog/${nextPost.slug}`}
                    className="p-4 rounded-xl border border-border bg-card/60 hover:border-primary/40 hover:bg-card transition flex flex-col sm:items-end text-left sm:text-right group"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      Next Guide <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {nextPost.title}
                    </span>
                  </Link>
                ) : <div />}
              </div>

            </article>

            {/* ── Right Column: Sticky Sidebar (4 cols) ── */}
            <aside className="lg:col-span-4 space-y-6">
              
              {/* Table of Contents */}
              {headings.length > 0 && (
                <div className="p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-xl sticky top-28">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-foreground mb-4 pb-3 border-b border-border">
                    <Bookmark className="w-4 h-4 text-primary" />
                    <span>Table of Contents</span>
                  </div>
                  <nav className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
                    {headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className={`block text-xs leading-snug transition-colors hover:text-primary ${
                          h.level === 3 ? "pl-4 text-muted-foreground text-[11px]" : "font-medium text-foreground/80"
                        }`}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>

                  {/* Software CTA in Sidebar */}
                  <div className="mt-6 pt-5 border-t border-border bg-primary/5 -mx-5 -mb-5 p-5 rounded-b-2xl">
                    <div className="flex items-center gap-2 font-bold text-xs text-foreground mb-1">
                      <Zap className="w-4 h-4 text-primary" />
                      <span>Ready to Automate Telegram?</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                      Deploy 77+ MTProto modules with AI personas on Web & Windows Desktop.
                    </p>
                    <Link
                      href="/download"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-black font-bold text-xs hover:bg-cyan-300 transition shadow-md shadow-primary/20"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Windows App
                    </Link>
                  </div>
                </div>
              )}

              {/* Author & Lab Bio */}
              <div className="p-5 rounded-2xl border border-border bg-card/60 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-black font-extrabold text-sm shadow-md">
                    TG
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Telegram Geeks Lab</h4>
                    <span className="text-[11px] text-primary font-medium">Research & Security Core</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Engineering high-concurrency MTProto automation architectures, zero-ban mobile proxy rotation, and autonomous AI personas for enterprise growth.
                </p>
              </div>

            </aside>
          </div>

          {/* ── Related Articles Section ── */}
          {related.length > 0 && (
            <section className="mt-20 pt-12 border-t border-border">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Related Technical Guides</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Deepen your Telegram automation and growth expertise</p>
                </div>
                <Link href="/blog" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                  View all 30 guides <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((rel: any) => (
                  <Card key={rel.slug} className="group overflow-hidden border border-border bg-card/60 hover:border-primary/40 hover:shadow-2xl transition-all duration-300 flex flex-col">
                    <Link href={`/blog/${rel.slug}`} className="block relative aspect-[16/9] overflow-hidden bg-[#05080f]">
                      {rel.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rel.cover_image}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary/30">
                          <Layers className="w-10 h-10" />
                        </div>
                      )}
                    </Link>
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 block">
                          {rel.category_name}
                        </span>
                        <Link href={`/blog/${rel.slug}`}>
                          <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
                            {rel.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {rel.excerpt}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{rel.reading_time_minutes || 8} min read</span>
                        <span className="font-semibold text-primary group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                          Read <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}