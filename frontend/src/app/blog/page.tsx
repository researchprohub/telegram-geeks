import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { blogApi } from "@/lib/api";
import { Newspaper, Calendar, Clock, PenLine, ArrowRight, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Blog — TelegramGeeks Pro",
  description: "Articles, guides, and news about Telegram growth, automation and the TelegramGeeks Pro platform.",
  keywords: "telegram blog, telegram automation, telegram growth, guides, tutorials",
};

import { STATIC_ARTICLES } from "@/data/static-articles";

async function fetchPosts() {
  try {
    const res = await blogApi.listPosts({ page_size: 100 });
    const items = res.data?.items;
    if (items && items.length >= STATIC_ARTICLES.length) return res.data;
    return { items: STATIC_ARTICLES, total: STATIC_ARTICLES.length, page: 1, total_pages: 1 };
  } catch {
    return { items: STATIC_ARTICLES, total: STATIC_ARTICLES.length, page: 1, total_pages: 1 };
  }
}

function Cover({ src, alt, category, title, className }: { src?: string | null; alt: string; category?: string | null; title?: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-secondary/40 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full relative flex items-end p-4 bg-gradient-to-br from-primary/15 via-secondary/10 to-secondary/40">
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }} />
          <div className="relative z-10">
            {category && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-1 block">{category}</span>
            )}
            {title && (
              <span className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{title}</span>
            )}
            {!title && <Newspaper className="w-10 h-10 text-primary/40" />}
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ post, large }: { post: any; large?: boolean }) {
  const size = large ? "text-sm gap-4" : "text-xs gap-3";
  return (
    <div className={`flex flex-wrap items-center text-muted-foreground ${size}`}>
      {post.category_name && (
        <span className="inline-flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-primary" />
          {post.category_name}
        </span>
      )}
      {post.author_name && (
        <span className="inline-flex items-center gap-1.5">
          <PenLine className="w-3.5 h-3.5 text-primary" />
          {post.author_name}
        </span>
      )}
      {post.published_at && (
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          {new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
        </span>
      )}
      {post.view_count != null && (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" />
          {post.view_count} views
        </span>
      )}
    </div>
  );
}

export default async function BlogIndexPage() {
  const data = await fetchPosts();
  const posts = data.items || [];
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="pt-28 pb-10 lg:pt-36 lg:pb-12 relative">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Newspaper className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-2">Blog</h1>
                <p className="text-muted-foreground">Articles, tips and news from the TelegramGeeks Pro team</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center">
                  <p className="text-muted-foreground">No published articles yet — check back soon.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-10">
                {/* Featured post */}
                {featured && (
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="group grid lg:grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/30 transition-all"
                  >
                    <Cover className="w-full aspect-[16/9] lg:aspect-auto lg:min-h-[360px]" src={featured.cover_image} alt={featured.title} category={featured.category_name} title={featured.title} />
                    <div className="p-6 md:p-10 flex flex-col justify-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
                        <Newspaper className="w-3.5 h-3.5" /> Featured
                      </span>
                      <h2 className="text-2xl md:text-4xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="text-muted-foreground mt-4 line-clamp-3 md:text-lg">{featured.excerpt}</p>
                      )}
                      <div className="mt-6">
                        <Meta post={featured} large />
                      </div>
                      <span className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-primary">
                        Read article <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                )}

                {/* Card grid */}
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rest.map((post: any) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all"
                      >
                        <Cover src={post.cover_image} alt={post.title} className="w-full aspect-[16/9]" category={post.category_name} title={post.title} />
                        <CardContent className="p-5 flex flex-col flex-1">
                          {post.category_name && (
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                              {post.category_name}
                            </span>
                          )}
                          <h2 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                            {post.title}
                          </h2>
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">{post.excerpt}</p>
                          )}
                          <div className="mt-4 pt-4 border-t border-border">
                            <Meta post={post} />
                          </div>
                        </CardContent>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
