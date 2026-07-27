import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PartnerLogos } from "@/components/marketing/PartnerLogos";
import { ReviewsSection } from "@/components/marketing/ReviewsSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import ModuleExplorer from "@/components/marketing/ModuleExplorer";
import AnimatedSection from "@/components/marketing/AnimatedSection";
import {
  ArrowRight, Gift, Users, Globe, MessageCircle,
  Search, Hash, FileJson, UserPlus, Plus, FileText,
  Send, ChevronRight, Sparkles, Target, Shield,
  Zap, BookOpen, Settings
} from "lucide-react";

const topFeatures = [
  { icon: Gift, title: "More than 6 years", desc: "on the market" },
  { icon: MessageCircle, title: "Messenger", desc: "private community" },
  { icon: Globe, title: "More than 10k clients", desc: "worldwide" },
  { icon: MessageCircle, title: "Support", desc: "24/7" },
];

type FeatureItem = { icon: any; label: string; desc: string };

const featureGroups: FeatureItem[][] = [
  [
    { icon: Search, label: "Search Chats and Channels", desc: "Find any Telegram chat or channel by keyword" },
    { icon: Globe, label: "Open Web Accounts", desc: "Access accounts directly from your browser" },
    { icon: FileJson, label: "JSON Generator", desc: "Generate device params for registration" },
    { icon: UserPlus, label: "Mass Subscribe and Unsubscribe", desc: "Bulk manage channel subscriptions" },
    { icon: Hash, label: "Creating chats and channels", desc: "Create groups, supergroups and channels at scale" },
  ],
  [
    { icon: Zap, label: "Creating bots", desc: "Register and configure Telegram bots" },
    { icon: FileText, label: "Creating posts (PostBot)", desc: "Design posts with buttons and media" },
    { icon: Users, label: "Audience collection", desc: "Scrape members from groups and channels" },
    { icon: MessageCircle, label: "Collecting chat participants", desc: "Extract participant lists from any chat" },
    { icon: FileText, label: "Collecting from an account", desc: "Gather contacts and dialogs from accounts" },
    { icon: Search, label: "Link checking", desc: "Verify link validity at scale" },
  ],
  [
    { icon: MessageCircle, label: "Collecting from comments", desc: "Extract commenters from channel posts" },
    { icon: Globe, label: "Global search", desc: "Search Telegram's entire user and channel database" },
    { icon: FileJson, label: "Merging databases", desc: "Combine multiple user databases into one" },
    { icon: FileJson, label: "Excluding databases", desc: "Remove duplicates and filter audiences" },
    { icon: Users, label: "Gender detection", desc: "Identify gender from Telegram profile data" },
    { icon: UserPlus, label: "Inviting audience", desc: "Invite collected users to your groups" },
  ],
  [
    { icon: UserPlus, label: "Inviting by ID", desc: "Add users by their Telegram ID" },
    { icon: UserPlus, label: "Inviting by phone numbers", desc: "Invite users by phone number" },
    { icon: UserPlus, label: "Inviting by contacts", desc: "Invite from phone contacts" },
    { icon: Send, label: "Sending SMS (GPT)", desc: "Send SMS with AI-generated content" },
    { icon: MessageCircle, label: "Comments in channel", desc: "Post comments from multiple accounts" },
    { icon: Send, label: "Sending by ID", desc: "Send direct messages by Telegram ID" },
  ],
];

const plans = [
  { name: "Demo license", price: "Free", period: "", popular: false, features: ["24-hour access", "Basic features", "Limited accounts", "Educational materials"] },
  { name: "1 month", price: "$120", period: "/month", popular: false, features: ["30-day access", "All base modules", "Account store", "Customer chat", "Online support", "Free updates"] },
  { name: "1 year", price: "$550", period: "/year", popular: true, features: ["365-day access", "All base modules", "Account store", "Customer chat (3000+)", "Priority support", "Free updates", "Best value"] },
  { name: "2 years", price: "$1,050", period: "/2 years", popular: false, features: ["730-day access", "All base modules", "Account store", "Customer chat (3000+)", "Priority support", "Free updates", "Save 20%"] },
  { name: "3 years", price: "$1,350", period: "/3 years", popular: false, features: ["1095-day access", "All base modules", "Account store", "Dedicated support", "Free updates", "Pro modules discount", "Save 38%"] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="en" />

      <main>
        {/* ── Hero ── */}
        <section className="relative min-h-[100dvh] flex items-center overflow-hidden pt-20">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-30" />
          </div>
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <a
                  href="https://www.youtube.com/watch?v=9Vf4twPRhUI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white/5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors mb-6"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  Video review
                </a>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-6 text-foreground">
                  Telegram Geeks
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
                  A comprehensive tool for promotion in Telegram: from registration, messaging, and inviting to account warming, chat management, and precise session work
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/#price"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Buy <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/demo"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-sm"
                  >
                    Demo access
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 via-transparent to-transparent rounded-2xl blur-xl" />
                  <div className="relative rounded-2xl border border-border bg-gradient-to-br from-card to-transparent overflow-hidden">
                    <img
                      src="/assets/hero/screenshot.png"
                      alt="Telegram Geeks Dashboard Interface"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Partner Logos ── */}
        <PartnerLogos />

        {/* ── Top Features Strip ── */}
        <section className="py-10 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {topFeatures.map((feat) => (
                <div key={feat.title} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <feat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{feat.title}</div>
                    <div className="text-xs text-muted-foreground">{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Welcome + Team ── */}
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border bg-muted p-8 lg:p-10">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Welcome!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Today, almost everyone who promotes projects or services in <strong className="text-foreground/80">Telegram</strong> has heard about us, and many are already members of our community.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Mass messaging, boosting, group invitations, and other ways of getting traffic are done with <strong className="text-foreground/80">Telegram Geeks!</strong>
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Brand</div>
                    <div className="text-sm font-semibold text-foreground">Sphere.Chat</div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">For Every Marketer</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  We provide not just software, but access to a private community of professionals, a knowledge base, and real-life Telegram automation cases.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  Every marketer needs the encrypted messenger <strong className="text-foreground/80">Sphere.chat</strong> with an audience of 5000+ people, each of whom uses <strong className="text-foreground/80">Telegram Geeks!</strong>
                </p>
                <a
                  href="https://sphere.chat/"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Register <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            </AnimatedSection>
          </div>
        </section>

        <ModuleExplorer locale="en" />

        {/* ── Modules Showcase ── */}
        <section className="border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/5 via-primary/[0.02] to-transparent rounded-3xl blur-2xl pointer-events-none" />
              <img
                src="/assets/landing/modules-showcase.jpg"
                alt="Telegram Geeks modules dashboard"
                className="relative w-full h-auto rounded-2xl border border-border shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="price" className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                Buy a license
              </h2>
            </div>
            </AnimatedSection>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {plans.map((plan, i) => (
                <div
                  key={plan.name}
                  className={`relative rounded-xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                     plan.popular
                      ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5"
                      : "border-border bg-muted"
                  }`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-xs font-semibold text-primary-foreground whitespace-nowrap">
                      Best value
                    </div>
                  )}
                  <div className="mb-5">
                    <h3 className="font-semibold text-base text-foreground mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <svg className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.price === "Free" ? "/demo" : "/register"}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {plan.price === "Free" ? "Get Demo" : "Buy"} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Reviews ── */}
        <ReviewsSection locale="en" />

        {/* ── Demo CTA ── */}
        <AnimatedSection>
        <section className="py-16 lg:py-20 border-t border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Try the demo version &mdash; make sure the program is right for you!
              </h2>
              <p className="text-muted-foreground mb-8">
                Start using it today and see the results for yourself
              </p>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Submit request <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
        </AnimatedSection>

        {/* ── FAQ ── */}
        <FaqSection locale="en" />
      </main>

      <Footer locale="en" />
    </div>
  );
}
