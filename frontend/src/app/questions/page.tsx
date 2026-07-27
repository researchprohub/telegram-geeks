"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Plus, X, ChevronRight, FileText, BookOpen, RefreshCw, MessageCircle, Users, Star, Gift } from "lucide-react";

const faqs = [
  {
    q: "How to buy?",
    a: "You can place an order directly on the website; the procedure for purchasing a key and modules is fully automated. Add the product to your cart, go through the registration procedure, and pay for your purchase. The license key will be sent to your email address automatically, and it will also appear in your personal account. Be sure to save your registration information. If you have questions, you can write to our online consultant or fill out an application directly on the website.",
  },
  {
    q: "How to pay?",
    a: "Cryptocurrencies accepted for payment are Bitcoin, USDT, USDC, etc. The payment and ordering procedure on the website is fully automated. Payment by cards is possible upon prior request.",
  },
  {
    q: "How to contact?",
    a: "You can write a message using the information in the Contacts section, fill out a request directly on the website or write to our online Operator. You can also register in our messenger sphere.chat and write to any available moderator. Contacts for communication with moderators can be found in the message that will be sent to you upon registration.",
  },
  {
    q: "Do you have an Affiliate program?",
    a: "Yes, we provide an affiliate program, you can earn up to 25% from each sale. All accruals are automated, the affiliate link is in your personal account.",
  },
  {
    q: "If you have bonuses for Partners?",
    a: "Yes, the affiliate program, in addition to excellent and generous payments, also has a bonus system; we provide our partners with bonuses in the form of modules to increase the efficiency of their work.",
  },
  {
    q: "What companies do you cooperate with?",
    a: "We have a fairly wide range of partners, among them there are SMS services, proxy services, and other services that today are industry giants in their field. The advantage of our company is a quick solution to any problems that arise if you are the owner of the Telegram Geeks key. Our partners have sphere.chat accounts, special personal groups to support users, where any issues are resolved quickly and in real time.",
  },
  {
    q: "What is sphere.chat?",
    a: "sphere.chat is our encrypted private messenger, a place where social media marketing experts exchange experiences and solve problems. The audience is quite large and has more than 1,500 users, and each user owns a key to Telegram Geeks!",
  },
  {
    q: "Do you have support after purchase?",
    a: "Yes! We try to support our users not only technically, but also with information; our projects blb.team, sphere.chat contain simply a huge amount of information on working with Telegram and other social networks. The support team is located in sphere.chat and will always be happy to help you!",
  },
];

const seoCards = [
  { href: "/manuals", title: "Read the manual", desc: "Step-by-step instructions for a confident start and quick mastery of the website.", icon: BookOpen },
  { href: "/posts", title: "View articles", desc: "Relevant articles and fresh materials across all website topics.", icon: FileText },
  { href: "/upd", title: "Updates feed", desc: "Stay tuned for new features, fresh updates, and platform news.", icon: RefreshCw },
  { href: "/questions", title: "Questions &ndash; Answers", desc: "Answers to frequently asked questions and tips on using the service.", icon: MessageCircle },
  { href: "/reviews", title: "Reviews", desc: "Reviews and opinions of real users about the product and service.", icon: Star },
  { href: "/telegram-promotion", title: "Benefits", desc: "Why choose us? A short list of key advantages appreciated by customers.", icon: Gift },
  { href: "/refferal", title: "Our partners", desc: "Great terms for agencies, bloggers, and corporate clients. Become our partner!", icon: Users },
];

export default function QuestionsPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main>
        {/* ── Header ── */}
        <section className="relative pt-28 pb-14 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
          </div>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              QUESTIONS &mdash; ANSWERS
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Here you can find answers to frequently asked and popular questions. Study the information to quickly understand all the details!
            </p>
          </div>
        </section>

        {/* ── Info Section ── */}
        <section className="border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
            <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
              <div className="hidden lg:block w-48 pt-2">
                <svg className="w-full text-primary/20" fill="currentColor" viewBox="0 0 1536 1083.9675" xmlns="http://www.w3.org/2000/svg">
                  <path d="M921 99q5-15 20.5-25t32.5-9q16 1 30 12.5t18 27.5q4 16 0 31.5t-10 29.5q-24 58-57 111.5T888 383q-37 54-75 107t-81 102q-41 46-88 86t-99 74q-52 34-108 61-55 27-114 46 25 5 51-3t51 1q18 5 31 21t23 32l4 8q2 4-1 7-1 2-3.5 3t-4.5 2q-70 21-144 25t-148 4q-46 0-93-8.5T14 907q-8-10-12-23t0-25q2-6 6-10.5t8-8.5q36-40 72-81 35-40 70.5-80.5T230 598q35-41 71-81 5-6 11-11.5t13-6.5q15-3 27 6.5t20 20.5q9 10 17 22.5t8 26.5q0 13-7 24t-15 21q-33 41-66 82.5T243 786q39-15 77-31 39-15 76-33.5t73-40.5q35-21 68-46 38-30 73-65 34-34 65-72t60-78q29-41 56-81 36-59 70.5-118T921 99zM649 663q7-3 13-7.5t11-11.5q2-2 3.5-4.5t1.5-4.5q-10 4-17 11.5T649 663zm-9 3q-4 2-7 5t-6 7q8-1 14-4.5t8-8.5q-2-2-5-1t-4 2zm-46 48q6-3 11-6.5t8-8.5q-7 2-12.5 6t-9.5 9h3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  FAQ: Everything about mass mailings and invites in Telegram via Telegram Geeks
                </h2>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Welcome to our FAQ — a section of frequently asked questions about mass mailings and invites in Telegram. If you want to quickly grow your audience and set up Telegram promotion using modern tools, here you will find detailed answers to the most important questions. We explain how to use mass mailings safely, avoid blocks, build an invite strategy, track performance, and run test campaigns for subscriber growth.
                  </p>
                  <p>
                    Telegram Geeks is reliable software for automating mailings, expanding your base, and conveniently managing campaigns. We have collected practical recommendations to make working with the service as simple, effective, and transparent as possible for every user.
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/demo"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                  >
                    Try for free <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ Accordion ── */}
        <section className="py-14 lg:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-muted overflow-hidden"
                >
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="flex items-center justify-between w-full px-5 py-4 text-left text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <span>{faq.q}</span>
                    {open === i ? (
                      <X className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {open === i && (
                    <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SEO Cards ── */}
        <section className="border-t border-border py-14 lg:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
              Discover more features of the website
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
              Do not limit yourself to just this page — we have collected the best manuals, useful articles, answers to questions, and real user reviews for you. Go to the section you are interested in to learn more, explore new features, and make your experience on the website as effective as possible.
            </p>
            <div className="h-px bg-white/5 mb-10" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {seoCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-xl border border-border bg-muted p-5 text-left hover:border-primary/20 hover:bg-primary/5 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <card.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{card.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
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
