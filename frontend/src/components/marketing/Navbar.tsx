"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ShoppingCart, User, Menu, X, Globe } from "lucide-react";

const navItems = [
  { label: "Download", href: "/download" },
  { label: "Prices", href: "/#price" },
    {
      label: "Information",
      href: "#",
      dropdown: true,
      children: [
      { label: "About us", href: "/about" },
      {
        label: "Catalog",
        nested: [
          { label: "Demo license", href: "/demo" },
          { label: "License for 1 month", href: "/promotion-in-telegram-license-for-1-month" },
          { label: "License for 1 year", href: "/promotion-in-telegram-license-for-1-year" },
          { label: "License for 2 years", href: "/promotion-in-telegram-license-for-2-years" },
          { label: "License for 3 years", href: "/promotion-in-telegram-license-for-3-years" },
        ],
      },
      { label: "Partners", href: "/partner" },
      { label: "Referral", href: "/refferal" },
      { label: "Manual", href: "/manuals" },
      { label: "Articles", href: "/posts" },
      { label: "Reviews", href: "/reviews" },
      { label: "Benefits", href: "/telegram-promotion" },
      { label: "Updates feed", href: "/upd" },
    ],
  },
  { label: "Contacts", href: "/contacts" },
  { label: "Partners", href: "/partner" },
];

const languages = [
  { code: "EN", label: "English", href: "/" },
  { code: "RU", label: "Русский", href: "/ru" },
  { code: "CN", label: "中文", href: "/cn" },
];

export function Navbar({ locale = "en" }: { locale?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileSubOpen, setMobileSubOpen] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">
              Telegram<span className="text-primary">Geeks</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) =>
              item.dropdown ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
                    {item.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                  </button>
                  {openDropdown === item.label && (
                    <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-border bg-card shadow-2xl shadow-black/50 py-2">
                      {item.children!.map((child) =>
                        child.nested ? (
                          <div key={child.label} className="relative group/sub">
                            <div className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                              {child.label}
                              <ChevronDown className="w-3 h-3 -rotate-90" />
                            </div>
                            <div className="absolute left-full top-0 ml-1 w-56 rounded-xl border border-border bg-card shadow-2xl shadow-black/50 py-2 hidden group-hover/sub:block">
                              {child.nested.map((sub) => (
                                <Link
                                  key={sub.label}
                                  href={sub.href}
                                  className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                  {sub.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            {child.label}
                          </Link>
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Language */}
            <div className="hidden md:flex items-center gap-0.5 text-xs font-medium">
              {languages.map((lang, i) => (
                <span key={lang.code}>
                  <Link
                    href={lang.href}
                    className={`px-2 py-1 rounded ${
                      locale === lang.code.toLowerCase()
                        ? "text-foreground bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    } transition-colors`}
                  >
                    {lang.code}
                  </Link>
                  {i < languages.length - 1 && (
                    <span className="text-muted-foreground/50 mx-0.5">|</span>
                  )}
                </span>
              ))}
            </div>

            {/* Cart */}
            <Link
              href="/cart"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent relative"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
            </Link>

            {/* Login */}
            <Link
              href="/login"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
            >
              <User className="w-4 h-4" />
              Log in
            </Link>

            {/* Burger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) =>
              item.dropdown ? (
                <div key={item.label}>
                  <button
                    onClick={() => setMobileSubOpen(mobileSubOpen === item.label ? null : item.label)}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent"
                  >
                    {item.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileSubOpen === item.label ? "rotate-180" : ""}`} />
                  </button>
                  {mobileSubOpen === item.label && (
                    <div className="ml-4 space-y-0.5 pb-1">
                      {item.children!.map((child) =>
                        child.nested ? (
                          <div key={child.label}>
                            <div className="px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider">
                              {child.label}
                            </div>
                            {child.nested.map((sub) => (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                onClick={() => setMobileOpen(false)}
                                className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent ml-2"
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent"
                          >
                            {child.label}
                          </Link>
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent"
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="pt-3 mt-3 border-t border-border flex items-center gap-2">
              {languages.map((lang, i) => (
                <span key={lang.code}>
                  <Link
                    href={lang.href}
                    className={`px-2 py-1 text-xs rounded ${
                      locale === lang.code.toLowerCase() ? "text-foreground bg-accent" : "text-muted-foreground"
                    }`}
                  >
                    {lang.code}
                  </Link>
                </span>
              ))}
            </div>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 rounded-lg border border-border text-sm text-foreground hover:bg-accent transition-colors"
            >
              <User className="w-4 h-4" />
              Log in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}