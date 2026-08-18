import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import {
  Activity, MessageCircle, Users, Target, Shuffle,
  Play, ExternalLink, Clock, ArrowRight, Eye
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Select Accounts",
    desc: "Select the account that will perform the forwarding. This account will be responsible for intercepting and forwarding the messages based on the trigger words you set.",
    icon: Users,
  },
  {
    number: "02",
    title: "Content Sources",
    desc: "Define the sources from which content will be copied. You can select groups, channels, or dialogues to intercept messages. After selecting an account, click \"Get data\" to load the available channels, chats, and dialogues linked to that account.",
    icon: MessageCircle,
  },
  {
    number: "03",
    title: "Forwarding Targets",
    desc: "Select the groups, channels, or dialogues where the intercepted content will be sent. These are your personal resources where the copied content will appear. Click \"Get data\" to display the lists.",
    icon: Target,
  },
  {
    number: "04",
    title: "Triggers and Replacement Words",
    desc: "Set up the keywords that trigger the forwarding. Specify the words or phrases that will be used to intercept messages. Additionally, you can define words or phrases to replace during forwarding to tailor the content to your audience.",
    icon: Shuffle,
  },
  {
    number: "05",
    title: "Start",
    desc: "Choose how to forward — as a repost with a source link to let recipients trace the original, or configure a standard timeout in case of FloodWait to handle restrictions automatically.",
    icon: Play,
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

export default function InterceptorPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {/* ── Hero ── */}
        <section className="pt-28 pb-12 lg:pt-36 lg:pb-16 relative">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                Module
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />
                3.4K views
              </span>
            </div>
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Activity className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                  Interceptor Module
                </h1>
                <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
                  Allows you to intercept messages from groups and channels using keywords,
                  forwarding them to your groups or channels to search for your potential customers.
                </p>
                <p className="text-muted-foreground text-sm mt-4 max-w-2xl leading-relaxed">
                  The module automates forwarding content from external sources (groups, channels, dialogues)
                  to your channels or chats based on trigger phrases. For example, if the trigger is the word
                  &quot;Repair,&quot; TelegramGeeks Pro will immediately intercept and forward any message containing that word.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
                How It Works
              </h2>
              <p className="text-muted-foreground text-sm">
                Set up keyword-based message interception in five simple steps
              </p>
            </div>
            <div className="space-y-8">
              {steps.map((step, i) => (
                <div key={i} className="group rounded-xl border border-border bg-muted p-6 lg:p-8 hover:border-primary/20 hover:bg-primary/5 transition-all">
                  <div className="flex items-start gap-5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-mono font-bold text-primary/60">{step.number}</span>
                        <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Start Options Detail ── */}
        <section className="py-12 lg:py-16 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                <Play className="w-5 h-5 text-primary" />
                Start Options
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-muted">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Forward as a repost with a source link</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Instead of simply copying, enable this option to forward the message while retaining
                      the link to the original message, allowing the recipient to trace the source.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-muted">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Configure standard timeout for FloodWait</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Set a waiting period when encountering flood restrictions. If the restriction lasts longer
                      than the set limit, the account will pause its operation; if shorter, the account will wait
                      for the specified time and continue once the timeout is over.
                    </p>
                  </div>
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

        {/* ── CTA ── */}
        <section className="pb-20 lg:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-8 lg:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
                Ready to automate your message interception?
              </h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-xl mx-auto">
                Connect the Interceptor module and start capturing relevant messages automatically
              </p>
              <Link
                href="/#modules_block"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-[#0a0a0f] font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Connect a module
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
