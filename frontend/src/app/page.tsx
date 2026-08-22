import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PartnerLogos } from "@/components/marketing/PartnerLogos";
import { ReviewsSection } from "@/components/marketing/ReviewsSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { blogApi } from "@/lib/api";
import ModuleExplorer from "@/components/marketing/ModuleExplorer";
import AnimatedSection from "@/components/marketing/AnimatedSection";
import {
  ParticleMeshBackground,
  StatCounter,
  LiveModuleSimulator,
} from "@/components/marketing/TelegramExpertAnimation";
import {
  ArrowRight, Gift, Users, Globe, MessageCircle,
  Search, Hash, FileJson, UserPlus, Plus, FileText,
  Send, ChevronRight, Sparkles, Target, Shield,
  Zap, Settings
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

export default async function LandingPage() {
  let posts: any[] = [];
  try {
    const res = await blogApi.listPosts({ page_size: 3 });
    posts = res.data?.items || [];
  } catch {}

  return (
    <div className="min-h-screen bg-[#020303] text-white">
      <Navbar locale="en" />

      <main>
        {/* ── Hero ── */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-28 pb-16">
          <ParticleMeshBackground />

          {/* Subtle background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#2ffcd4]/[0.06] rounded-full blur-[140px]" />
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-center text-center">
            {/* Video review pill */}
            <a
              href="https://www.youtube.com/watch?v=9Vf4twPRhUI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2ffcd4]/30 bg-[#2ffcd4]/10 text-xs font-medium text-[#2ffcd4] hover:bg-[#2ffcd4]/20 transition-all mb-8 shadow-[0_0_20px_rgba(47,252,212,0.12)] hover:scale-105"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Video review
            </a>

            {/* Title */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-white mb-6 font-['Science_Gothic',sans-serif]">
              Telegram<span className="text-[#2ffcd4]">Geeks</span> Pro
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-white/70 max-w-2xl leading-relaxed mb-10">
              A comprehensive tool for promotion in Telegram: from registration, messaging, and inviting to account warming, chat management, and precise session work
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-row items-center justify-center gap-4 mb-16 w-full">
              <Link
                href="/#price"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md bg-[#2ffcd4] text-[#071412] font-semibold text-sm hover:bg-[#38ecd6] transition-all shadow-[0_0_25px_rgba(47,252,212,0.25)] hover:shadow-[0_0_35px_rgba(47,252,212,0.4)]"
              >
                Buy <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-md border border-white/15 bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.08] hover:border-white/30 transition-all text-sm font-medium"
              >
                Demo access
              </Link>
            </div>

            {/* Dashboard Screenshot */}
            <div className="relative w-full max-w-5xl rounded-lg border border-white/[0.12] bg-[#090b0b] shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(47,252,212,0.08)] overflow-hidden">
              <img
                src="/assets/hero/screenshot.png"
                alt="TelegramGeeks Pro Dashboard Interface"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>

        {/* ── Live Counter Tickers ── */}
        <section className="py-12 border-y border-white/[0.08] bg-[#040607]">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCounter label="Years on Market" value={6} suffix="+" sublabel="Continuous innovation" />
            <StatCounter label="Active Clients" value={10000} suffix="+" sublabel="Worldwide operators" />
            <StatCounter label="Core Modules" value={77} suffix="+" sublabel="Telegram Expert parity" />
            <StatCounter label="Platform Uptime" value={99} suffix=".9%" sublabel="Enterprise reliability" />
          </div>
        </section>

        {/* ── Partner Logos ── */}
        <PartnerLogos />

        {/* ── Feature Pills ── */}
        <section className="py-10 border-b border-white/[0.06] overflow-hidden bg-[#050707]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative">
              <div className="flex gap-3 py-1 px-1 overflow-x-auto scrollbar-hide">
                {[...topFeatures, ...topFeatures].map((feat, i) => (
                  <div
                    key={`${feat.title}-${i}`}
                    className="min-w-[180px] rounded-[5px] border border-white/[0.08] bg-[#090b0b] py-2.5 px-4 text-xs font-medium text-white/70 hover:text-white hover:border-[#2ffcd4]/40 transition-all shrink-0 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 mb-1">
                      <feat.icon className="w-4 h-4 text-[#2ffcd4]" />
                      <span className="uppercase tracking-wider font-semibold text-white/90 text-[11px]">{feat.title}</span>
                    </div>
                    <div className="text-xs text-white/50">{feat.desc}</div>
                  </div>
                ))}
              </div>
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#050707] to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#050707] to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* ── Live Module Simulator ── */}
        <section className="py-16 bg-[#030505] border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Live Engine Simulator
              </h2>
              <p className="text-xs sm:text-sm text-white/60">
                Preview real-time MTProto telemetry, autonomous persona generation, and audience scraping in action.
              </p>
            </div>
            <LiveModuleSimulator />
          </div>
        </section>

        {/* ── Welcome + Team ── */}
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-white/[0.08] bg-[#090b0b] p-8 lg:p-10">
                <div className="w-10 h-10 rounded-lg bg-[#2ffcd4]/10 border border-[#2ffcd4]/20 flex items-center justify-center mb-5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ffcd4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Welcome!</h2>
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  Today, almost everyone who promotes projects or services in <strong className="text-white">Telegram</strong> has heard about us, and many are already members of our community.
                </p>
                <p className="text-sm text-white/70 leading-relaxed">
                  Mass messaging, boosting, group invitations, and other ways of getting traffic are done with <strong className="text-white">TelegramGeeks Pro!</strong>
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#090b0b] p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[#2ffcd4]" />
                  </div>
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">Brand</div>
                    <div className="text-sm font-semibold text-white">Sphere.Chat</div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">For Every Marketer</h2>
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  We provide not just software, but access to a private community of professionals, a knowledge base, and real-life Telegram automation cases.
                </p>
                <p className="text-sm text-white/70 leading-relaxed mb-5">
                  Every marketer needs the encrypted messenger <strong className="text-white">Sphere.chat</strong> with an audience of 5000+ people, each of whom uses <strong className="text-white">TelegramGeeks Pro!</strong>
                </p>
                <a
                  href="https://sphere.chat/"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#2ffcd4] hover:text-[#38ecd6] transition-colors"
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
        <section className="border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#2ffcd4]/10 via-[#2ffcd4]/[0.02] to-transparent rounded-3xl blur-2xl pointer-events-none" />
              <img
                src="/assets/landing/modules-showcase.jpg"
                alt="TelegramGeeks Pro modules dashboard"
                className="relative w-full h-auto rounded-xl border border-white/[0.1] shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="price" className="py-16 lg:py-20 border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 font-['Science_Gothic',sans-serif]">
                Buy a license
              </h2>
            </div>
            </AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-[10px] border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    plan.popular
                      ? "border-[#2ffcd4]/50 bg-[#0d1111] shadow-[0_0_30px_rgba(47,252,212,0.1)]"
                      : "border-white/[0.08] bg-[#090b0b]"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-[#2ffcd4] text-[10px] font-bold text-[#071412] uppercase tracking-wider shadow-[0_0_15px_rgba(47,252,212,0.4)]">
                      Best value
                    </div>
                  )}
                  <div className="mb-5">
                    <h3 className="font-semibold text-sm text-white/90 mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{plan.price}</span>
                      {plan.period && <span className="text-xs text-white/50">{plan.period}</span>}
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs text-white/60">
                        <svg className="w-3.5 h-3.5 text-[#2ffcd4] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.price === "Free" ? "/demo" : "/register"}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-xs font-semibold transition-all ${
                      plan.popular
                        ? "bg-[#2ffcd4] text-[#071412] hover:bg-[#38ecd6] shadow-[0_0_15px_rgba(47,252,212,0.2)]"
                        : "border border-white/15 text-white/80 hover:text-white hover:bg-white/[0.06] hover:border-white/30"
                    }`}
                  >
                    {plan.price === "Free" ? "Get Demo" : "Buy"} <ArrowRight className="w-3.5 h-3.5" />
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
        <section className="py-16 lg:py-20 border-t border-white/[0.06] relative overflow-hidden bg-gradient-to-b from-transparent to-[#050707]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4 font-['Science_Gothic',sans-serif]">
                Try the demo version &mdash; make sure the program is right for you!
              </h2>
              <p className="text-white/60 mb-8 text-sm sm:text-base">
                Start using it today and see the results for yourself
              </p>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md bg-[#2ffcd4] text-[#071412] font-semibold text-sm hover:bg-[#38ecd6] transition-all shadow-[0_0_25px_rgba(47,252,212,0.25)] hover:shadow-[0_0_35px_rgba(47,252,212,0.4)]"
              >
                Submit request <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
        </AnimatedSection>

        {/* ── Latest from blog ── */}
        {posts.length > 0 && (
          <section className="py-16 lg:py-20 border-t border-white/[0.06]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 font-['Science_Gothic',sans-serif]">Latest from blog</h2>
                  <p className="text-white/60 text-sm">New articles and updates from the TelegramGeeks Pro team</p>
                </div>
                <Link
                  href="/blog"
                  className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-[#2ffcd4] hover:text-[#38ecd6] transition-colors"
                >
                  All articles <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post: any) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#090b0b] hover:border-[#2ffcd4]/30 transition-all"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#050707]">
                      {post.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full relative flex items-end p-4 bg-gradient-to-br from-[#2ffcd4]/15 via-[#0d1111] to-[#090b0b]">
                          <div className="absolute inset-0 opacity-[0.07]" style={{
                            backgroundImage: "radial-gradient(circle at 1px 1px, #2ffcd4 1px, transparent 0)",
                            backgroundSize: "18px 18px",
                          }} />
                          <div className="relative z-10">
                            {post.category_name && (
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#2ffcd4] mb-1 block">{post.category_name}</span>
                            )}
                            <span className="text-sm font-semibold text-white leading-snug line-clamp-2">{post.title}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      {post.category_name && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#2ffcd4] mb-2">{post.category_name}</span>
                      )}
                      <h3 className="font-semibold text-base text-white group-hover:text-[#2ffcd4] transition-colors leading-snug line-clamp-2">
                        {post.title}
                      </h3>
                      {post.published_at && (
                        <span className="text-xs text-white/40 mt-3">
                          {new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/blog"
                className="sm:hidden inline-flex items-center gap-2 mt-8 text-sm font-semibold text-[#2ffcd4] transition-colors"
              >
                All articles <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* ── FAQ ── */}
        <FaqSection locale="en" />
      </main>

      <Footer locale="en" />
    </div>
  );
}
