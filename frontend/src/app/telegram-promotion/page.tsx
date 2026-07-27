"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import AnimatedSection from "@/components/marketing/AnimatedSection";
import {
  Shield, Bot, MessageCircle, BarChart3, Sparkles,
  Zap, ArrowRight, BookOpen, Star, TrendingUp
} from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Security",
    description:
      "Security is built into the logic of every Telegram Geeks module. AntiSafety during registration, a proxy checker with IP overlap analysis, GPT-based text uniqueness, and intelligent parsing focused only on the target audience all work together so accounts do not get banned and promotional campaigns do not stop.",
    modules: ["Mass Inspection", "Proxy Checker", "Account Booster", "Universal Registrar"],
  },
  {
    icon: Zap,
    title: "Flexible automation tools",
    description:
      "Telegram Geeks can collect audiences by geo, language, and activity — exactly the people you need, not random users. Then you can use this base however you want: launch campaigns, invite people to groups, or add them to contacts. No spam to random users, only precise work with those who are most likely to respond.",
    modules: ["Audience Collector", "Global Search", "Gender Detector", "Database Tools"],
  },
  {
    icon: MessageCircle,
    title: "Maximum deliverability and campaign efficiency",
    description:
      "Telegram Geeks makes messages feel natural: GPT generates unique content for each recipient, the randomizer breaks repetitive patterns, and inserting a first name, last name, or username adds a human touch. Need more? PostBot helps create posts with buttons and interactive elements directly inside the software. All of this works together so your message is not ignored and has a much better chance of generating a response.",
    modules: ["Mass Messaging", "PostBot Creator", "Autoposting V2", "Autoresponder"],
  },
  {
    icon: BarChart3,
    title: "Transparent analytics and performance control",
    description:
      "With Telegram Geeks, you do not guess what worked — you see it in real numbers. Reports collect data across all campaigns and invites: successful deliveries, errors, and overall metrics. You can combine results from different tasks, measure the efficiency of each account, and quickly notice when a proxy or audience segment stops responding. Analytics here is about real actions and clear insights.",
    modules: ["Reports", "Mass Inspection", "Console Log"],
  },
  {
    icon: Sparkles,
    title: "Easy start and support at every stage",
    description:
      "You can get started without technical knowledge — the intuitive interface and quick launch of test campaigns make the software accessible to any user. The support team is always ready to help with setup, recommendations, and solving any questions that come up.",
    modules: ["Demo License", "Sphere.Chat Community", "Knowledge Base"],
  },
  {
    icon: Star,
    title: "Free trial and flexible pricing",
    description:
      "Telegram Geeks offers a free trial for new users so you can evaluate promotion effectiveness without upfront investment. A flexible pricing system makes it easy to choose the right solution for a business of any size.",
    modules: ["24h Demo", "1mo / 1yr / 2yr / 3yr Plans"],
  },
];

export default function TelegramPromotionPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {/* ── Header ── */}
        <section className="pt-28 pb-12 lg:pt-36 lg:pb-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/assets/theme/back-gradients/main-header.svg"
              alt=""
              className="w-full h-full object-cover opacity-20"
            />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                Benefits
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Telegram Geeks provides tools for organic audience growth,
                automation setup, and stronger engagement so your channel or
                chat helps build brand awareness and trust.
              </p>
            </div>
          </div>
        </section>

        {/* ── Benefits Grid ── */}
        <section className="pb-16 lg:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
            <div className="grid gap-6 md:grid-cols-2">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                  whileHover={{ y: -4 }}
                  className="group rounded-xl border border-border bg-muted p-6 lg:p-8 hover:border-primary/20 hover:bg-primary/[0.02] transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <b.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {b.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {b.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {b.modules.map((m) => (
                      <span key={m} className="inline-block px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10 text-xs text-primary">
                        {m}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ── CTA ── */}
        <AnimatedSection>
        <section className="py-16 lg:py-20 border-t border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Ready to grow in Telegram?
              </h2>
              <p className="text-muted-foreground mb-8">
                Telegram Geeks is your reliable partner for real audience
                growth and business development in Telegram. Choose safe,
                effective, and modern promotion tools that have already proven
                their results.
              </p>
              <Link
                href="/#price"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Try for free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
        </AnimatedSection>

        {/* ── Explore More ── */}
        <AnimatedSection>
        <section className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Discover more website opportunities
              </h2>
              <p className="text-muted-foreground mb-8">
                Do not stop at this page alone — we have collected the best
                guides, useful articles, answers to common questions, and real
                user reviews for you. Open the section you are interested in to
                learn more, explore new features, and make your experience on
                the site even more effective.
              </p>
              <Link
                href="/posts"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/20 transition-colors"
              >
                Browse articles <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
        </AnimatedSection>
      </main>
      <Footer />
    </div>
  );
}
