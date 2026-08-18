"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import AnimatedSection from "@/components/marketing/AnimatedSection";
import {
  Info, Shield, Users, Feather, Zap, Globe, Search, MessageCircle,
  UserPlus, Bot, Send, Hash, FileJson, BarChart3, BookOpen
} from "lucide-react";

const features = [
  { icon: Shield, title: "Security", desc: "Advanced protection for your accounts and data" },
  { icon: Users, title: "Team", desc: "Professional team with years of experience in Telegram marketing" },
  { icon: Feather, title: "Reliability", desc: "Stable operation and regular updates" },
  { icon: Zap, title: "Speed", desc: "High-performance modules for any tasks" },
  { icon: Globe, title: "Global", desc: "Used by clients worldwide for Telegram promotion" },
];

const moduleCategories = [
  { icon: Search, title: "Audience Collection", desc: "Scrape members from groups, channels, and comments. Filter by geo, language, and activity. Global search across all Telegram." },
  { icon: MessageCircle, title: "Messaging & Automation", desc: "Mass messaging with spintax and variables, autoresponder, autoposting, forwarder, interceptor, channel comments, and GPT-powered SMS." },
  { icon: UserPlus, title: "Invitation System", desc: "Five invitation methods — by ID, username, phone, contacts, or admin rights. Smart rate limits and auto-stop on bans." },
  { icon: Zap, title: "Account Growth", desc: "Views booster, reactions booster, account warmer (30-day progressive schedule), mass subscriptions, and bot referrals." },
  { icon: Bot, title: "Registration & Sessions", desc: "Automated batch registration via SMS services, QR login, session import/export, and device parameter generation." },
  { icon: FileJson, title: "Cloning & Migration", desc: "Clone entire chats and channels with media. Duplicate sessions across devices. Forward messages with word replacement." },
  { icon: Hash, title: "Management Tools", desc: "Mass inspection, folder manager, proxy checker, bot/chat creator, admin management, contact book, and console logs." },
  { icon: BarChart3, title: "Analytics & Reports", desc: "Campaign reporting with success rates, error tracking, and cross-account performance comparisons." },
];

export default function AboutPage() {
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
                <Info className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">About us</h1>
                <p className="text-muted-foreground max-w-2xl">
                  We are a team of professionals dedicated to providing the best tools for Telegram marketing and promotion
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
            <div className="max-w-3xl mx-auto space-y-6 text-muted-foreground leading-relaxed mb-14">
              <p>
                TelegramGeeks Pro is an all-in-one Telegram marketing platform, providing automated account registration,
                advanced audience targeting, bulk messaging, and comprehensive account management tools.
              </p>
              <p>
                Our software includes <strong className="text-foreground/80">49 modules</strong> across 8 categories —
                from audience collection and mass messaging to account warming, channel cloning, and campaign analytics.
                Every module is designed for real Telegram automation used by marketing professionals worldwide.
              </p>
              <p>
                We have been cooperating with our partners for several years. Our clients actively use the software
                and are very satisfied with the quality and reliability. The functionality covers all needs and works
                flawlessly.
              </p>
            </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-border bg-muted p-6 hover:border-primary/20 hover:bg-primary/5 transition-colors"
                >
                  <f.icon className="w-5 h-5 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">What We Offer</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {moduleCategories.map((cat, i) => (
                <motion.div
                  key={cat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="rounded-xl border border-border bg-card p-6 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <cat.icon className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{cat.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cat.desc}</p>
                </motion.div>
              ))}
            </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
