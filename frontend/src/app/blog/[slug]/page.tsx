import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { blogApi } from "@/lib/api";
import { markdownToHtml } from "@/lib/markdown";
import { DEFAULT_TEMPLATE } from "@/lib/template";
import {
  ArrowLeft, ArrowRight, Calendar, PenLine, Tag,
  Facebook, Twitter, Linkedin, MessagesSquare, ThumbsUp,
} from "lucide-react";

async function fetchPost(slug: string) {
  try {
    const res = await blogApi.getPost(slug);
    return res.data;
  } catch {
    return null;
  }
}

async function fetchPosts() {
  try {
    const res = await blogApi.listPosts({ page_size: 20 });
    return res.data.items || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || "",
    keywords: post.seo_keywords || "",
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || "",
      images: post.cover_image ? [post.cover_image] : undefined,
      type: "article",
    },
  };
}

function Avatar({ name, large }: { name?: string; large?: boolean }) {
  const initial = (name || "W").charAt(0).toUpperCase();
  const size = large ? "w-12 h-12 text-lg" : "w-7 h-7 text-xs";
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-primary/15 text-primary font-bold shrink-0 ${size}`}>
      {initial}
    </span>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

const shareCls =
  "inline-flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  const html = markdownToHtml(post.content);
  const template = Array.isArray(post.template) && post.template.length ? post.template : DEFAULT_TEMPLATE;
  const sections = new Set(template.filter(Boolean));

  const all = await fetchPosts();
  const related = all.filter((p: any) => p.id !== post.id).slice(0, 3);
  const sorted = all.slice().reverse();
  const cur = sorted.findIndex((p: any) => p.slug === post.slug);
  const prevPost = cur > 0 ? sorted[cur - 1] : null;
  const nextPost = cur >= 0 && cur < sorted.length - 1 ? sorted[cur + 1] : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {sections.has("featured") && post.cover_image && (
          <div className="w-full border-b border-border overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image} alt={post.title} className="w-full h-[300px] md:h-[430px] object-cover" />
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <Link href="/blog" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition mb-5">
            <ArrowLeft className="w-3 h-3" /> All articles
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <article className="lg:col-span-2">
              <header className="mb-8">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight mb-5">
                  {post.title}
                </h1>

                {sections.has("meta") && (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground border-y border-border py-4">
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={post.author_name} />
                      <span className="font-medium text-foreground">{post.author_name || "Writer"}</span>
                    </span>
                    {post.published_at && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                    )}
                    {post.category_name && (
                      <Link href="/blog" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                        <Tag className="w-4 h-4" /> {post.category_name}
                      </Link>
                    )}
                  </div>
                )}
              </header>

              {sections.has("content") && (
                <div
                  className="prose prose-invert max-w-none
                    prose-headings:text-foreground prose-headings:tracking-tight
                    prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4
                    prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
                    prose-p:text-foreground/75 prose-p:leading-relaxed prose-p:mb-5 prose-p:text-[17px]
                    prose-ul:space-y-2 prose-ul:my-4 prose-ol:space-y-2 prose-ol:my-4 prose-li:text-foreground/75
                    prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                    prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:font-normal
                    prose-pre:bg-secondary/60 prose-pre:rounded-xl prose-pre:p-4 prose-pre:text-foreground/80
                    prose-a:text-primary prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}

              {sections.has("share") && (
                <div className="mt-10 flex items-center gap-3 border-t border-border pt-6">
                  <span className="text-sm font-medium text-foreground">Share article:</span>
                  <a aria-label="Share on Facebook" className={shareCls} href="#"><Facebook className="w-4 h-4" /></a>
                  <a aria-label="Share on Twitter" className={shareCls} href="#"><Twitter className="w-4 h-4" /></a>
                  <a aria-label="Share on LinkedIn" className={shareCls} href="#"><Linkedin className="w-4 h-4" /></a>
                </div>
              )}

              {sections.has("tags") && post.tags && post.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((t: string) => (
                      <Link key={t} href="/blog"
                        className="inline-flex items-center gap-1 rounded-md bg-secondary/50 border border-border px-3 py-1 text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition">
                        #{t}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {sections.has("author") && (
                <div className="mt-10 rounded-xl border border-border bg-card p-6 flex items-start gap-4">
                  <Avatar name={post.author_name} large />
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide mb-0.5">Written by</p>
                    <p className="text-lg font-bold text-foreground">{post.author_name || "TelegramGeeks Pro Team"}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Expert insights on Telegram growth, automation and community building from the TelegramGeeks Pro team.
                    </p>
                  </div>
                </div>
              )}
            </article>

            <aside className="lg:col-span-1 space-y-8">
              <SidebarCard title="Recent posts">
                {all.slice(0, 5).map((p: any) => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="group flex items-start gap-3 py-2">
                    {p.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover_image} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <span className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary shrink-0">
                        <PenLine className="w-5 h-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition leading-snug line-clamp-2">{p.title}</p>
                      {p.published_at && <p className="text-xs text-muted-foreground mt-0.5">{new Date(p.published_at).toLocaleDateString()}</p>}
                    </div>
                  </Link>
                ))}
              </SidebarCard>
            </aside>
          </div>

          {sections.has("nav") && (prevPost || nextPost) && (
            <nav className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-8">
              {prevPost ? (
                <Link href={`/blog/${prevPost.slug}`} className="group rounded-xl border border-border p-5 hover:border-primary/30 transition">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2"><ArrowLeft className="w-3 h-3" /> Previous</p>
                  <p className="font-semibold text-foreground group-hover:text-primary transition line-clamp-2">{prevPost.title}</p>
                </Link>
              ) : <div />}
              {nextPost ? (
                <Link href={`/blog/${nextPost.slug}`} className="group rounded-xl border border-border p-5 text-right hover:border-primary/30 transition">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center justify-end gap-1.5 mb-2">Next <ArrowRight className="w-3 h-3" /></p>
                  <p className="font-semibold text-foreground group-hover:text-primary transition line-clamp-2">{nextPost.title}</p>
                </Link>
              ) : <div />}
            </nav>
          )}

          {sections.has("related") && related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xl font-bold text-foreground mb-5">Related articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {related.map((p: any) => (
                  <Link key={p.id} href={`/blog/${p.slug}`}
                    className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:bg-primary/5 transition-all">
                    {p.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover_image} alt="" className="h-40 w-full object-cover" />
                    ) : (
                      <div className="h-40 w-full bg-primary/10 flex items-center justify-center"><PenLine className="h-8 w-8 text-primary" /></div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition leading-snug line-clamp-2">{p.title}</h3>
                      {p.category_name && <span className="text-xs text-primary mt-2 block">{p.category_name}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {sections.has("comments") && (
            <section className="mt-16 rounded-xl border border-border bg-card p-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-1">
                <MessagesSquare className="h-5 w-5 text-primary" /> 0 Comments
              </h2>
              <p className="text-sm text-muted-foreground mb-5">Comments are closed for this article.</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <ThumbsUp className="h-4 w-4" /> Be the first to react
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}