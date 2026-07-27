import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { postContent } from "@/data/posts-content";
import { ArrowLeft, Newspaper } from "lucide-react";

const seoCards = [
  { title: "Read the manual", desc: "Step-by-step instructions", href: "/manuals" },
  { title: "Updates feed", desc: "Stay tuned for new features", href: "/upd" },
  { title: "Questions — Answers", desc: "Answers to frequently asked questions", href: "/questions" },
  { title: "Reviews", desc: "Reviews and opinions of real users", href: "/reviews" },
  { title: "Our partners", desc: "Great terms for agencies", href: "/refferal" },
];

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postContent[slug];
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="pt-28 pb-8 lg:pt-36 lg:pb-10 relative">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Newspaper className="w-6 h-6 text-primary" />
              </div>
              <div>
                <Link href="/posts" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-2">
                  <ArrowLeft className="w-3 h-3" />
                  Back to articles
                </Link>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-2">{post.title}</h1>
                <p className="text-xs text-muted-foreground">{post.date}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 lg:pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <article
              className="prose prose-invert prose-a:text-primary prose-strong:text-foreground prose-headings:text-foreground prose-headings:tracking-tight max-w-none
                prose-h2:text-xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-base prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-foreground/70 prose-p:leading-relaxed prose-p:mb-4
                prose-ul:space-y-2 prose-ul:my-4
                prose-li:text-foreground/70
                prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                [&_li_p]:mb-0"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          </div>
        </section>

        <section className="py-16 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">Discover more features of the website</h2>
              <p className="text-muted-foreground text-sm">Explore our documentation, articles, and community resources</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {seoCards.map((card) => (
                <Link key={card.title} href={card.href} className="group rounded-xl border border-border bg-muted p-5 hover:border-primary/20 hover:bg-primary/5 transition-all">
                  <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors mb-1">{card.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{card.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
