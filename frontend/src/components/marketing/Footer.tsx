import Link from "next/link";
import { FooterAnimation } from "./FooterAnimation";

type NavItem = { label: string; href: string };
type FooterCol = { title: string; links: NavItem[] };
type FooterDict = { title: string; copyright: string; columns: FooterCol[]; social: NavItem[] };

const dict: Record<string, FooterDict> = {
  en: {
    title: "Manage your business professionally",
    copyright: "All rights reserved. Telegram Geeks 2026.",
    columns: [
      { title: "Product", links: [
        { label: "Home", href: "/" },
        { label: "Manual", href: "/manuals" },
        { label: "Updates", href: "/upd" },
        { label: "Download", href: "/download" },
        { label: "Contacts", href: "/contacts" },
      ]},
      { title: "Resources", links: [
        { label: "Articles", href: "/posts" },
        { label: "Reviews", href: "/reviews" },
        { label: "FAQ", href: "/telegram-promotion" },
        { label: "Partners", href: "/partner" },
        { label: "Referral", href: "/refferal" },
      ]},
      { title: "Legal", links: [
        { label: "Privacy Policy", href: "/posts/private-policy" },
        { label: "Public Offer", href: "/posts/offer" },
      ]},
    ],
    social: [
      { label: "SphereChat", href: "https://sphere.chat/" },
      { label: "YouTube", href: "https://youtube.com" },
    ],
  },
  ru: {
    title: "Управляйте своим бизнесом профессионально",
    copyright: "Все права защищены. Telegram Geeks 2026.",
    columns: [
      { title: "Продукт", links: [
        { label: "Главная", href: "/" },
        { label: "Инструкция", href: "/manuals" },
        { label: "Обновления", href: "/upd" },
        { label: "Скачать", href: "/download" },
        { label: "Контакты", href: "/contacts" },
      ]},
      { title: "Ресурсы", links: [
        { label: "Статьи", href: "/posts" },
        { label: "Отзывы", href: "/reviews" },
        { label: "FAQ", href: "/telegram-promotion" },
        { label: "Партнёры", href: "/partner" },
        { label: "Рефералы", href: "/refferal" },
      ]},
      { title: "Юридическое", links: [
        { label: "Политика конфиденциальности", href: "/posts/private-policy" },
        { label: "Публичная оферта", href: "/posts/offer" },
      ]},
    ],
    social: [
      { label: "SphereChat", href: "https://sphere.chat/" },
      { label: "YouTube", href: "https://youtube.com" },
    ],
  },
  cn: {
    title: "专业管理您的业务",
    copyright: "版权所有。Telegram Geeks 2026。",
    columns: [
      { title: "产品", links: [
        { label: "首页", href: "/" },
        { label: "指南", href: "/manuals" },
        { label: "更新", href: "/upd" },
        { label: "下载", href: "/download" },
        { label: "联系", href: "/contacts" },
      ]},
      { title: "资源", links: [
        { label: "文章", href: "/posts" },
        { label: "评价", href: "/reviews" },
        { label: "FAQ", href: "/telegram-promotion" },
        { label: "合作伙伴", href: "/partner" },
        { label: "推荐", href: "/refferal" },
      ]},
      { title: "法律", links: [
        { label: "隐私政策", href: "/posts/private-policy" },
        { label: "公开协议", href: "/posts/offer" },
      ]},
    ],
    social: [
      { label: "SphereChat", href: "https://sphere.chat/" },
      { label: "YouTube", href: "https://youtube.com" },
    ],
  },
};

const socialIcons: Record<string, JSX.Element> = {
  SphereChat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 0 0-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8z" />
      <path d="M9.5 15.5V8.5l6.5 3.5z" fill="hsl(var(--background))" />
    </svg>
  ),
};

export function Footer({ locale = "en" }: { locale?: string }) {
  const d = dict[locale] || dict.en;
  return (
    <footer className="relative border-t border-border bg-background overflow-hidden">
      <FooterAnimation />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </div>
              <span className="font-bold text-base tracking-tight text-foreground">
                Telegram<span className="text-primary">Geeks</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{d.title}</p>
            <div className="flex items-center gap-3">
              {d.social.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                   className="text-muted-foreground hover:text-primary transition-colors"
                   aria-label={s.label}>
                  {socialIcons[s.label]}
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-6">{d.copyright}</p>
          </div>
          {d.columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground/80 mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}