import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { DemoRequestForm } from "@/components/marketing/DemoRequestForm";
import {
  ChevronRight,
  Sparkles,
  Clock,
  Gift,
  Users,
  MessageCircle,
  Star,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Flame,
  Bot,
} from "lucide-react";

const reviews = [
  { name: "Max R.", role: "Agency Founder", license: "1-Year License", text: "Tested the 24h demo before buying. Scraped 3,000 active group members in 2 minutes without any flood issues. Upgraded to 1-Year immediately!" },
  { name: "Blake T.", role: "Web3 Marketer", license: "2-Year License", text: "The AI persona warmup in the demo proved it's miles ahead of old Telegram tools. Highly recommend taking the test." },
  { name: "Elena V.", role: "Lead Gen Specialist", license: "1-Year License", text: "The message interceptor is pure magic. We captured 12 high-intent leads during our 24h trial run." },
  { name: "Alex K.", role: "Traffic Arbitrageur", license: "Lifetime License", text: "24 hours was plenty of time to test all 77 modules and verify proxy rotation. Super smooth experience." },
];

export const metadata = {
  title: "Free 24-Hour Demo License — TelegramGeeks Pro",
  description: "Test all 77+ Telegram automation modules free for 24 hours. Full access to scraper, bulk messaging, AI persona warmup, and SMS registrar.",
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#020303] text-white">
      <Navbar />

      <main>
        {/* ── Header ── */}
        <section className="pt-28 pb-12 lg:pt-36 lg:pb-16 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[300px] bg-[#2ffcd4]/[0.05] rounded-full blur-[140px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <nav className="flex items-center gap-2 text-xs text-white/50 mb-6 font-medium">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#2ffcd4]">Free 24h Demo</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2ffcd4]/30 bg-[#2ffcd4]/10 text-xs font-semibold text-[#2ffcd4]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>24-Hour Full-Featured Evaluation</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase font-['Science_Gothic',sans-serif]">
                  Free License for <span className="text-[#2ffcd4]">24 Hours</span>
                </h1>
                <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                  Experience the full power of TelegramGeeks Pro before purchase. Test MTProto scraping, AI persona warming, and high-speed cold outreach in real working conditions.
                </p>
              </div>

              {/* Quick Perks List */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md shrink-0 text-xs">
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-[#2ffcd4] shrink-0" />
                  <span>All 77+ Modules</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-[#2ffcd4] shrink-0" />
                  <span>100 Accounts Slot</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-[#2ffcd4] shrink-0" />
                  <span>AI Neuro-Text</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-[#2ffcd4] shrink-0" />
                  <span>No Credit Card</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Demo Request Form & Overview ── */}
        <section className="pb-16 lg:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Detailed Information */}
              <div className="lg:col-span-7 space-y-8">
                <div className="rounded-2xl border border-white/[0.08] bg-[#07090a] p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#2ffcd4]" />
                      What Do You Get During the 24h Trial?
                    </h2>
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                      You will receive complete access to the full Windows desktop software and cloud orchestration console without artificial feature gates:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-1.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#2ffcd4]" /> Audience Scraper & Parser
                      </div>
                      <p className="text-white/60">Extract members from public/private chats, comment threads, and voice rooms.</p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-1.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#2ffcd4]" /> AI Persona Warmup Booster
                      </div>
                      <p className="text-white/60">Autonomous peer-to-peer dialogues and reaction generation to boost trust scores.</p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-1.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-[#2ffcd4]" /> Universal SMS Registrar
                      </div>
                      <p className="text-white/60">Automated registration via 5SIM, SMS-Activate, and GrizzlySMS with 2FA setup.</p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-1.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#2ffcd4]" /> Message Interceptor
                      </div>
                      <p className="text-white/60">Real-time keyword listening in public groups with instant response dispatch.</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] space-y-3">
                    <h3 className="text-sm font-bold text-white">How Does Demo Activation Work?</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      1. Generate your 24-hour demo key using the form on the right.<br />
                      2. Download the Telegram Geeks Windows Desktop application.<br />
                      3. Paste your key in the <strong>License Manager</strong> — access begins the moment you activate!
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Generator Form */}
              <div className="lg:col-span-5 sticky top-28">
                <DemoRequestForm />
              </div>
            </div>
          </div>
        </section>

        {/* ── Reviews Section ── */}
        <section className="py-16 lg:py-20 border-t border-white/[0.06] bg-[#040607]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#2ffcd4]" />
                  What Operators Say After Testing
                </h2>
                <p className="text-xs text-white/50 mt-1">Verified reviews from marketers who started with our 24h trial</p>
              </div>
              <Link href="/reviews" className="text-xs font-semibold text-[#2ffcd4] hover:underline flex items-center gap-1">
                <span>View All Reviews</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reviews.map((r, i) => (
                <div key={i} className="rounded-xl border border-white/[0.08] bg-[#070a0a] p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-yellow-400">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed italic">
                      &quot;{r.text}&quot;
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                    <div>
                      <div className="font-bold text-white">{r.name}</div>
                      <div className="text-white/40 text-[10px]">{r.role}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#2ffcd4]/10 text-[#2ffcd4] font-semibold text-[10px]">
                      {r.license}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom Call to Action ── */}
        <section className="py-16 border-t border-white/[0.06]">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase font-['Science_Gothic',sans-serif]">
              Ready to Upgrade to <span className="text-[#2ffcd4]">Full Production</span>?
            </h2>
            <p className="text-xs sm:text-sm text-white/60 max-w-xl mx-auto">
              Choose from 1-Month, 1-Year, or Multi-Year license tiers with unlimited quota scaling and multi-chain crypto auto-activation.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/#price"
                className="px-8 py-3.5 rounded-xl bg-[#2ffcd4] text-[#071412] font-bold text-xs sm:text-sm hover:bg-[#38ecd6] transition-all shadow-[0_0_25px_rgba(47,252,212,0.25)] flex items-center gap-2"
              >
                <span>View Full Pricing Plans</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

