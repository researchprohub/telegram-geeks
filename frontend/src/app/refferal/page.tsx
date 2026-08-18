import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import {
  ArrowRight, Gift, Target, Shield, TrendingUp,
  Users, Globe, Megaphone, Share2, Video, MessageCircle,
  Check, Star, Award, BookOpen, ExternalLink, BarChart3,
  Zap
} from "lucide-react";

const whereToSell = [
  { icon: Globe, label: "Publish software sales topics on various forums" },
  { icon: Megaphone, label: "Place banners on websites" },
  { icon: Share2, label: "Run mailing campaigns" },
  { icon: MessageCircle, label: "Publish posts in groups" },
  { icon: Users, label: "Post on social networks" },
  { icon: Video, label: "Drive traffic through videos and news" },
];

const bonusTiers = [
  { keys: 5, reward: "License key or any module*", note: "*except «Universal Registrar»" },
  { keys: 15, reward: "Any module** of your choice for 1 year", note: "**except «Universal Registrar»" },
  { keys: 25, reward: "Any module** of your choice for 2 years", note: "" },
  { keys: 35, reward: "TelegramGeeks Pro for 3 years with all modules", note: "" },
];

const levels = [
  {
    level: 1, percent: 5, title: "Level One",
    desc: "You need to sell just 5 license keys for 1 year to move to the next level. If you do not have a TelegramGeeks Pro license key yet, this is a great opportunity to get one. At the next level you will receive a bonus key valid for one year!",
    bonus: "A TelegramGeeks Pro license key or any module of your choice for 1 year",
    exception: "except «Universal Registrar»",
  },
  {
    level: 2, percent: 10, title: "Level Two",
    desc: "The level is assigned automatically after reaching 5 sales of one-year license keys or the equivalent amount.",
    bonus: "A TelegramGeeks Pro license key or any module of your choice for 1 year",
    exception: "except «Universal Registrar»",
  },
  {
    level: 3, percent: 15, title: "Level Three",
    desc: "The level is assigned automatically after reaching 15 sales of one-year license keys or the equivalent amount.",
    bonus: "Any module of your choice for 1 year",
    exception: "except «Universal Registrar»",
  },
  {
    level: 4, percent: 20, title: "Level Four",
    desc: "The level is assigned automatically after reaching 25 sales of one-year license keys or the equivalent amount.",
    bonus: "Any module of your choice for 2 years or a license key valid for 2 years",
    exception: "",
  },
  {
    level: 5, percent: 25, title: "Level Five",
    desc: "The level is assigned automatically after reaching 35 sales of one-year license keys or the equivalent amount.",
    bonus: "A TelegramGeeks Pro license for 3 years with all modules",
    exception: "",
  },
];

export default function RefferalPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {/* ── Header ── */}
        <section className="pt-28 pb-8 lg:pt-36 lg:pb-10 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                  Referral
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  Earn up to 25% for every license sale with our referral program
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How to earn ── */}
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                How to earn with TelegramGeeks Pro?
              </h2>
              <p className="text-muted-foreground">
                Where to sell? Choose the channels that work best for you
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {whereToSell.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-xl border border-border bg-muted p-5 hover:border-primary/20 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground leading-relaxed">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bonus Tiers ── */}
        <section className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-4">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Bonuses
              </h2>
              <p className="text-muted-foreground">
                Earn bonuses as you sell more licenses
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              {bonusTiers.map((tier) => (
                <div
                  key={tier.keys}
                  className="rounded-xl border border-border bg-muted p-6 hover:border-primary/20 transition-all text-center"
                >
                  <div className="text-3xl font-bold text-primary mb-1">{tier.keys}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">keys</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{tier.reward}</div>
                  {tier.note && (
                    <div className="text-xs text-foreground/30 mt-2">{tier.note}</div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-foreground/30 text-center">
              *except «Universal Registrar»
            </p>
          </div>
        </section>

        {/* ── Levels ── */}
        <section className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Affiliate Levels
              </h2>
              <p className="text-muted-foreground">
                Progress through levels and earn up to 25% commission
              </p>
            </div>
            <div className="max-w-4xl mx-auto space-y-6">
              {levels.map((lvl) => (
                <div
                  key={lvl.level}
                  className="rounded-xl border border-border bg-muted p-6 lg:p-8 hover:border-primary/20 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                        lvl.level === 5
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}>
                        {lvl.level}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{lvl.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-primary">{lvl.percent}%</span>
                          <span className="text-xs text-muted-foreground">commission</span>
                        </div>
                      </div>
                    </div>
                    <div className="lg:ml-auto">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
                        <Award className="w-3 h-3" />
                        {lvl.bonus}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{lvl.desc}</p>
                  {lvl.exception && (
                    <p className="text-xs text-foreground/30">{lvl.exception}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Info section ── */}
        <section className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="rounded-xl border border-border bg-muted p-8 lg:p-10">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Star className="w-5 h-5 text-primary" />
                  Bonuses are more than gifts
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bonuses in TelegramGeeks Pro are not just gifts, but a reward for activity. The more you work, the more often you get paid modules for free. We are interested in every partner earning well and regularly.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted p-8 lg:p-10">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-primary" />
                  Where can I find the referral link?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Go to your personal account on the website — the referral link is located in the left sidebar menu. It is always at hand so you can use it quickly.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  The «Performance» tab also helps track clicks on your referral links. By analyzing this data, you can choose the best approach to monetization with TelegramGeeks Pro.
                </p>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <BarChart3 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Every 10 yearly key sales or the equivalent amount will increase your level. At the fifth level, you already have Partner status and receive 25% from all sales made through your partner link. In addition, all purchases through the website, regardless of your current level, will also automatically earn you a percentage, ensuring stable income in the future.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 lg:p-10 text-center">
                <Zap className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-3">
                  Start earning today
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
                  This is the most profitable partner program for those who want to enter the Telegram market with minimal investment!
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  Become a partner <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
