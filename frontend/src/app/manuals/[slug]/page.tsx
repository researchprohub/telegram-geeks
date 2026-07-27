import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { manualContent } from "@/data/manuals-content";
import { ManualReader } from "@/components/manuals/ManualReader";
import { ArrowLeft, BookOpen } from "lucide-react";

function addHeadingIds(html: string): string {
  return html.replace(
    /<h([23])(?:\s[^>]*)?>(.+?)<\/h\1>/gi,
    (full, level, content) => {
      const text = content.replace(/<[^>]*>/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return `<h${level} id="${id}">${content}</h${level}>`;
    }
  );
}

const seoCards = [
  { title: "Read the manual", desc: "Step-by-step instructions for a confident start with Telegram Geeks", href: "/manuals" },
  { title: "View articles", desc: "Relevant articles and fresh materials about Telegram promotion", href: "/posts" },
  { title: "Updates feed", desc: "Stay tuned for new features and improvements", href: "/upd" },
  { title: "Questions — Answers", desc: "Answers to frequently asked questions", href: "/questions" },
  { title: "Reviews", desc: "Reviews and opinions of real users", href: "/reviews" },
  { title: "Benefits", desc: "Why choose us? A short list of our advantages", href: "/telegram-promotion" },
  { title: "Our partners", desc: "Great terms for agencies and large clients", href: "/refferal" },
];

export default async function ManualPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = manualContent[slug];
  if (!content) redirect("/manuals");

  const img = (path: string) => path;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {/* ── Header ── */}
        <section className="pt-28 pb-8 lg:pt-36 lg:pb-10 relative">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <Link href="/manuals" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-2">
                  <ArrowLeft className="w-3 h-3" />
                  Back to manuals
                </Link>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                  {content.title}
                </h1>
              </div>
            </div>
          </div>
        </section>



        {/* ── Article ── */}
        <section className="pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ManualReader bodyHtml={addHeadingIds(content.body)} />
          </div>
        </section>

        {/* ── SEO Cross-links ── */}
        <section className="py-16 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
                Discover more features of the website
              </h2>
              <p className="text-muted-foreground text-sm">
                Explore our documentation, articles, and community resources
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {seoCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-xl border border-border bg-muted p-5 hover:border-primary/20 hover:bg-primary/5 transition-all"
                >
                  <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors mb-1">
                    {card.title}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {card.desc}
                  </div>
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
