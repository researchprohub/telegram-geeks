import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { modules, categories } from "@/data/modules";
import { moduleManualMap } from "@/data/module-manual-mapping";
import { manualContent } from "@/data/manuals-content";
import { createElement } from "react";
import { ChevronRight, BookOpen as BookIcon } from "lucide-react";

function IconOf(icon: any, className: string) {
  return icon ? createElement(icon, { className }) : null;
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

function getGuideHref(moduleId: string): string {
  const slug = moduleManualMap[moduleId];
  if (slug && (slug in manualContent)) return `/manuals/${slug}`;
  return `/dashboard/modules/${moduleId}`;
}

export default function ManualsPage() {
  const grouped = categories
    .filter(c => c.id !== "all")
    .map(cat => ({
      ...cat,
      items: modules.filter(m => m.category === cat.id).map(m => ({
        ...m,
        href: getGuideHref(m.id),
      })),
    }))
    .filter(g => g.items.length > 0);

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
                <BookIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                  Manual
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  To make using TelegramGeeks easier, read our manual, which will help you quickly and effectively solve the necessary tasks
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Layout: Sidebar + Content ── */}
        <section className="pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <aside className="lg:w-72 shrink-0">
                <div className="lg:sticky lg:top-24 space-y-0.5">
                  {grouped.map((cat) => (
                    <a
                      key={cat.id}
                      href={`#manual_cat_${cat.id}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      {IconOf(cat.items[0]?.icon, "w-4 h-4 text-primary shrink-0")}
                      <span>{cat.label}</span>
                    </a>
                  ))}
                </div>
              </aside>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="space-y-10">
                  {grouped.map((cat) => (
                    <div key={cat.id} id={`manual_cat_${cat.id}`}>
                      <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-3">
                        {IconOf(cat.items[0]?.icon, "w-5 h-5 text-primary")}
                        {cat.label}
                      </h2>
                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {cat.items.map((mod) => (
                          <Link
                            key={mod.id}
                            href={mod.href}
                            className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border bg-muted hover:border-primary/20 hover:bg-primary/5 transition-all group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {IconOf(mod.icon, "w-4 h-4 text-primary shrink-0")}
                              <span className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors truncate">
                                {mod.name}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
