import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";

const updates = [
  { date: "2025-03-15", title: "Improved account manager", desc: "Added bulk export and improved filtering options" },
  { date: "2025-03-01", title: "New proxy checker", desc: "Updated proxy validation with better speed testing" },
  { date: "2025-02-15", title: "Invite V2 enhancements", desc: "Added smart delay and improved flood handling" },
  { date: "2025-02-01", title: "SMS sender update", desc: "Added text randomizer and auto-repost features" },
  { date: "2025-01-15", title: "Performance improvements", desc: "Optimized multi-threaded processing for all modules" },
  { date: "2025-01-01", title: "New parameter generator", desc: "Added device fingerprint customization options" },
];

export default function UpdatesPage() {
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
                <RefreshCw className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">Updates feed</h1>
                <p className="text-muted-foreground max-w-2xl">Stay tuned for new features and improvements</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 lg:pb-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            {updates.map((u) => (
              <div key={u.title} className="rounded-xl border border-border bg-muted p-5 hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs text-primary/60 font-mono">{u.date}</span>
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-0.5">{u.title}</h3>
                <p className="text-sm text-muted-foreground">{u.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">Discover more features of the website</h2>
              <p className="text-muted-foreground text-sm mb-8">Explore our documentation, articles, and community resources</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[
                { title: "Read the manual", desc: "Step-by-step instructions", href: "/manuals" },
                { title: "View articles", desc: "Relevant articles about Telegram promotion", href: "/posts" },
                { title: "Questions — Answers", desc: "Answers to frequently asked questions", href: "/questions" },
                { title: "Reviews", desc: "Reviews and opinions of real users", href: "/reviews" },
                { title: "Benefits", desc: "Why choose us?", href: "/telegram-promotion" },
                { title: "Our partners", desc: "Great terms for agencies", href: "/refferal" },
              ].map((card) => (
                <Link key={card.title} href={card.href} className="group rounded-xl border border-border bg-muted p-5 hover:border-primary/20 hover:bg-primary/5 transition-all">
                  <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors mb-1">{card.title}</div>
                  <div className="text-xs text-muted-foreground">{card.desc}</div>
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
