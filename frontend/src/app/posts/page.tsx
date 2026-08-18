import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Newspaper, ChevronRight } from "lucide-react";

interface Article {
  title: string;
  description: string;
  date: string;
  href: string;
}

const articles: Article[] = [
  {
    title: "Risk-Controlled Telegram Automation: How to Simulate Real User Behavior",
    description:
      "Introduction: Why Automation That Worked Yesterday Gets Accounts Restricted Today. Telegram automation is no longer limited to running a script that sends messages, joins ...",
    date: "JULY 20, 2026",
    href: "/posts/risk-controlled-telegram-automation",
  },
  {
    title: "IP, Device, or Behavior: Which Factor Affects Telegram Account Stability Most?",
    description:
      "IP, Device, or Behavior: Which Factor Affects Telegram Account Stability Most? A Telegram account may work normally for weeks and then suddenly encounter addit...",
    date: "JULY 16, 2026",
    href: "/posts/ip-device-or-behavior",
  },
  {
    title: "Telegram Promotion: Software for Channel and Business Growth",
    description:
      "Telegram Promotion: Software for Channel and Business Growth. Telegram as the Main Promotion Tool Today, Telegram has become one of the most p...",
    date: "SEPTEMBER 04, 2025",
    href: "/posts/telegram-promotion-software",
  },
  {
    title: "Dolphin Anty: An Antidetect Browser for Telegram Multiaccounting",
    description:
      "Dolphin Anty: An Antidetect Browser for Telegram Multiaccounting. Managing multiple Telegram accounts has become standard practice. Some users pro...",
    date: "JULY 14, 2026",
    href: "/posts/dolphin-anty-antidetect-browser",
  },
];

const seoCards = [
  { title: "Read the manual", desc: "Step-by-step instructions for a confident start with TelegramGeeks Pro", href: "/manuals" },
  { title: "View articles", desc: "Relevant articles and fresh materials about Telegram promotion", href: "/posts" },
  { title: "Updates feed", desc: "Stay tuned for new features and improvements", href: "/upd" },
  { title: "Questions — Answers", desc: "Answers to frequently asked questions", href: "/questions" },
  { title: "Reviews", desc: "Reviews and opinions of real users", href: "/reviews" },
  { title: "Benefits", desc: "Why choose us? A short list of our advantages", href: "/telegram-promotion" },
  { title: "Our partners", desc: "Great terms for agencies and large clients", href: "/refferal" },
];

export default function PostsPage() {
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
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                  Articles
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  Latest news and articles about Telegram automation, promotion, and multi-accounting
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              {articles.map((article) => (
                <Link
                  key={article.href}
                  href={article.href}
                  className="group block rounded-xl border border-border bg-muted p-6 hover:border-primary/20 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground font-medium mb-2">
                        {article.date}
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                        {article.title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 mt-10">
              <span className="w-8 h-8 rounded-lg bg-primary text-black text-sm font-bold flex items-center justify-center">
                1
              </span>
              <Link
                href="/posts/page/2"
                className="w-8 h-8 rounded-lg border border-border text-muted-foreground text-sm flex items-center justify-center hover:border-primary/20 hover:text-foreground transition-all"
              >
                2
              </Link>
              <Link
                href="/posts/page/2"
                className="w-8 h-8 rounded-lg border border-border text-muted-foreground text-sm flex items-center justify-center hover:border-primary/20 hover:text-foreground transition-all"
              >
                3
              </Link>
            </div>
          </div>
        </section>

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
