"use client";

import { useState } from "react";
import Link from "next/link";
import { FooterAnimation } from "./FooterAnimation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  ArrowUpRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowUp,
  Send,
  Sparkles,
  Lock,
  Globe2,
} from "lucide-react";

type NavItem = { label: string; href: string; badge?: string; external?: boolean };
type FooterCol = { title: string; links: NavItem[] };
type FooterDict = {
  headline: string;
  tagline: string;
  newsletterTitle: string;
  newsletterDesc: string;
  newsletterBtn: string;
  newsletterSuccess: string;
  systemStatus: string;
  systemOperational: string;
  copyright: string;
  backToTop: string;
  columns: FooterCol[];
};

const dict: Record<string, FooterDict> = {
  en: {
    headline: "Enterprise Telegram Automation & Persona Intelligence",
    tagline: "The modern all-in-one growth platform for Telegram channels, groups, and high-volume marketing with anti-ban MTProto architecture.",
    newsletterTitle: "Stay Ahead of Telegram Algorithm Changes",
    newsletterDesc: "Get weekly anti-ban strategies, warmup protocols, and feature releases directly to your inbox.",
    newsletterBtn: "Subscribe",
    newsletterSuccess: "Subscribed! Welcome to TelegramGeeks Intel.",
    systemStatus: "Engine v2.4.0 Active",
    systemOperational: "All 77+ Modules Operational",
    copyright: "TelegramGeeks Pro. Built for high-volume enterprise growth.",
    backToTop: "Back to Top",
    columns: [
      {
        title: "Product Matrix",
        links: [
          { label: "Windows Desktop App", href: "/download", badge: "v2.4.0" },
          { label: "Multi-Account Manager", href: "/manuals" },
          { label: "AI Persona Studio", href: "/manuals" },
          { label: "Neuro-Text AI Engine", href: "/manuals", badge: "AI" },
          { label: "Channel & Chat Scrapers", href: "/manuals" },
          { label: "Session & TData Converter", href: "/manuals" },
        ],
      },
      {
        title: "Solutions",
        links: [
          { label: "Web3 & Crypto Growth", href: "/blog/crypto-growth-automation" },
          { label: "Channel Cloner Strategy", href: "/blog/telegram-channel-cloner-guide" },
          { label: "2FA Warmup & Anti-Ban", href: "/blog/telegram-2fa-warmup-guide" },
          { label: "Mass Invites & Messaging", href: "/blog/mass-dm-outreach-secrets" },
          { label: "Affiliate & Referral Hub", href: "/refferal", badge: "Earn 25%" },
          { label: "Partner Program", href: "/partner" },
        ],
      },
      {
        title: "Resources & Docs",
        links: [
          { label: "Interactive API Docs", href: "/docs", external: true, badge: "REST" },
          { label: "User Manuals & Guides", href: "/manuals" },
          { label: "Technical Blog & SEO", href: "/blog" },
          { label: "Changelog & Releases", href: "/upd" },
          { label: "Verified Reviews", href: "/reviews" },
          { label: "Promotion FAQ", href: "/telegram-promotion" },
        ],
      },
      {
        title: "Security & Legal",
        links: [
          { label: "Privacy Policy", href: "/posts/private-policy" },
          { label: "Terms of Service", href: "/posts/offer" },
          { label: "Public Offer", href: "/posts/offer" },
          { label: "License Verification", href: "/download" },
          { label: "Direct Support & Contacts", href: "/contacts" },
        ],
      },
    ],
  },
  ru: {
    headline: "Корпоративная автоматизация и ИИ-персоны в Telegram",
    tagline: "Современная платформа для масштабирования каналов, групп и прямого маркетинга в Telegram с протоколом защиты от блокировок.",
    newsletterTitle: "Будьте в курсе обновлений алгоритмов Telegram",
    newsletterDesc: "Еженедельные стратегии прогрева аккаунтов, обходы спам-фильтров и новые модули.",
    newsletterBtn: "Подписаться",
    newsletterSuccess: "Вы подписаны на инсайды TelegramGeeks!",
    systemStatus: "Движок v2.4.0 активен",
    systemOperational: "Все 77+ модулей работают штатно",
    copyright: "TelegramGeeks Pro. Создано для профессионального роста в Telegram.",
    backToTop: "Наверх",
    columns: [
      {
        title: "Продукты",
        links: [
          { label: "Windows Приложение", href: "/ru/download", badge: "v2.4.0" },
          { label: "Мульти-аккаунт менеджер", href: "/ru/manuals" },
          { label: "ИИ-Персоны и прогрев", href: "/ru/manuals" },
          { label: "Нейро-текст генератор", href: "/ru/manuals", badge: "AI" },
          { label: "Парсеры аудитории", href: "/ru/manuals" },
          { label: "Конвертер TData / Session", href: "/ru/manuals" },
        ],
      },
      {
        title: "Решения",
        links: [
          { label: "Продвижение Web3 и Крипто", href: "/blog/crypto-growth-automation" },
          { label: "Клонирование каналов", href: "/blog/telegram-channel-cloner-guide" },
          { label: "Прогрев и 2FA безопасность", href: "/blog/telegram-2fa-warmup-guide" },
          { label: "Массовый инвайтинг", href: "/blog/mass-dm-outreach-secrets" },
          { label: "Партнерская программа", href: "/partner" },
          { label: "Рефералы", href: "/refferal", badge: "25%" },
        ],
      },
      {
        title: "База знаний",
        links: [
          { label: "Интерактивная документация", href: "/docs", external: true, badge: "API" },
          { label: "Инструкции и мануалы", href: "/ru/manuals" },
          { label: "Статьи и гайды", href: "/blog" },
          { label: "История обновлений", href: "/upd" },
          { label: "Отзывы клиентов", href: "/ru/reviews" },
          { label: "FAQ по продвижению", href: "/telegram-promotion" },
        ],
      },
      {
        title: "Правовая информация",
        links: [
          { label: "Политика конфиденциальности", href: "/posts/private-policy" },
          { label: "Пользовательское соглашение", href: "/posts/offer" },
          { label: "Публичная оферта", href: "/posts/offer" },
          { label: "Проверка лицензий", href: "/ru/download" },
          { label: "Контакты и поддержка", href: "/ru/contacts" },
        ],
      },
    ],
  },
  cn: {
    headline: "企业级 Telegram 自动化与 AI 智能体矩阵平台",
    tagline: "专为 Telegram 频道、群组及高并发营销打造的一体化增长系统，配备独家防封 MTProto 底层协议。",
    newsletterTitle: "获取 Telegram 算法最新动向",
    newsletterDesc: "订阅每周防封养号策略、协议更新与新功能发布推送。",
    newsletterBtn: "立即订阅",
    newsletterSuccess: "订阅成功！欢迎加入 TelegramGeeks 官方通讯。",
    systemStatus: "引擎 v2.4.0 运行中",
    systemOperational: "全线 77+ 核心模块稳定运行",
    copyright: "TelegramGeeks Pro. 赋能企业级全球流量增长。",
    backToTop: "返回顶部",
    columns: [
      {
        title: "产品功能",
        links: [
          { label: "Windows 客户端", href: "/cn/download", badge: "v2.4.0" },
          { label: "多账号协同管理", href: "/cn/manuals" },
          { label: "AI 人设智能矩阵", href: "/cn/manuals" },
          { label: "NeuroText 神经网络引擎", href: "/cn/manuals", badge: "AI" },
          { label: "高精度群组采集解析", href: "/cn/manuals" },
          { label: "TData / Session 双向转换", href: "/cn/manuals" },
        ],
      },
      {
        title: "行业方案",
        links: [
          { label: "Web3 与加密项目裂变", href: "/blog/crypto-growth-automation" },
          { label: "频道快速克隆引流", href: "/blog/telegram-channel-cloner-guide" },
          { label: "2FA 养号防风控体系", href: "/blog/telegram-2fa-warmup-guide" },
          { label: "批量精准私信触达", href: "/blog/mass-dm-outreach-secrets" },
          { label: "推荐返佣计划", href: "/refferal", badge: "25% 分佣" },
          { label: "商务合作", href: "/cn/partner" },
        ],
      },
      {
        title: "文档与资源",
        links: [
          { label: "API 接口文档", href: "/docs", external: true, badge: "API" },
          { label: "官方使用手册", href: "/cn/manuals" },
          { label: "技术博客与实战", href: "/blog" },
          { label: "版本更新日志", href: "/upd" },
          { label: "用户真实评价", href: "/cn/reviews" },
          { label: "常见问题答疑", href: "/cn/questions" },
        ],
      },
      {
        title: "合规与支持",
        links: [
          { label: "隐私政策", href: "/posts/private-policy" },
          { label: "服务条款", href: "/posts/offer" },
          { label: "公开协议", href: "/posts/offer" },
          { label: "授权码绑定查询", href: "/cn/download" },
          { label: "联系官方客服", href: "/cn/contacts" },
        ],
      },
    ],
  },
};

export function Footer({ locale = "en" }: { locale?: string }) {
  const d = dict[locale] || dict.en;
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubscribed(true);
      setSubmitting(false);
      setEmail("");
    }, 600);
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="relative border-t border-border/70 bg-card/25 backdrop-blur-2xl text-foreground overflow-hidden">
      {/* Background Interactive Constellation Animation */}
      <FooterAnimation />

      {/* Decorative Gradient Line at Top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        {/* Top Tier: Live Telemetry & Algorithm Newsletter Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 mb-12 border-b border-border/60">
          {/* Left Column: Brand Statement & Real-Time Pulse */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" href="/" />
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                {d.systemStatus} • {d.systemOperational}
              </div>
            </div>

            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              {d.tagline}
            </p>

            {/* Quick Metrics Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-muted/40 border border-border/50 text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>MTProto Direct Concurrency</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-muted/40 border border-border/50 text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Hardware Machine Lock (HWID)</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-muted/40 border border-border/50 text-muted-foreground">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>End-to-End Cryptography</span>
              </div>
            </div>
          </div>

          {/* Right Column: Newsletter Subscription Box */}
          <div className="lg:col-span-6 flex flex-col justify-center bg-card/40 rounded-2xl border border-border/60 p-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2 text-foreground font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{d.newsletterTitle}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-normal">
              {d.newsletterDesc}
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-medium animate-in fade-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{d.newsletterSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="flex-1 bg-background/80 border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 disabled:opacity-50 shrink-0 shadow-sm"
                >
                  <Send className="w-3 h-3" />
                  <span>{d.newsletterBtn}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Middle Tier: 4-Column Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {d.columns.map((col) => (
            <div key={col.title} className="space-y-3.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/90 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/80"></span>
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors duration-150"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                          {link.label}
                        </span>
                        <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" />
                        {link.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors duration-150"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                          {link.label}
                        </span>
                        {link.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Methods & Crypto Trust Badge Strip */}
        <div className="py-6 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground/80">Secure Payments Accepted:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {["Bitcoin (BTC)", "Ethereum (ETH)", "USDT (TRC20 / ERC20)", "TON Network", "Solana (SOL)", "Credit / Debit Card"].map((method) => (
              <span
                key={method}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-muted/30 border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Tier: Copyright, Language Switcher & Back to Top */}
        <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {d.copyright}</p>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60">
              <Globe2 className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
              <Link
                href="/"
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  locale === "en" ? "bg-primary text-primary-foreground font-semibold" : "hover:text-primary"
                }`}
              >
                EN
              </Link>
              <Link
                href="/ru"
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  locale === "ru" ? "bg-primary text-primary-foreground font-semibold" : "hover:text-primary"
                }`}
              >
                RU
              </Link>
              <Link
                href="/cn"
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  locale === "cn" ? "bg-primary text-primary-foreground font-semibold" : "hover:text-primary"
                }`}
              >
                中文
              </Link>
            </div>

            {/* Back To Top Button */}
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/60 bg-card/60 hover:border-primary/50 hover:text-primary active:scale-[0.97] transition-all text-xs font-medium"
              aria-label="Scroll to top"
            >
              <span>{d.backToTop}</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}