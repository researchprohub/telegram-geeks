"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ShoppingCart, User, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

const navItems = [
  { label: "Download", href: "/download" },
  { label: "Prices", href: "/#price" },
  { label: "Blog", href: "/blog" },
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
          ? "bg-[#020303]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/40"
          : "bg-[#020303]/50 backdrop-blur-md border-b border-white/[0.04]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <BrandLogo size="md" href="/" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) =>
              item.dropdown ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                  >
                    {item.label}
                    <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                  </button>
                  {openDropdown === item.label && (
                    <div className="absolute top-full left-0 mt-1.5 w-56 rounded-lg border border-white/[0.1] bg-[#090b0b]/95 backdrop-blur-xl shadow-2xl shadow-black/80 py-2 animate-fade-in">
                      {item.children!.map((child) =>
                        child.nested ? (
                          <div key={child.label} className="relative group/sub">
                            <div className="flex items-center justify-between px-4 py-2 text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer">
                              {child.label}
                              <ChevronDown className="w-3 h-3 -rotate-90 opacity-60" />
                            </div>
                            <div className="absolute left-full top-0 ml-1 w-56 rounded-lg border border-white/[0.1] bg-[#090b0b]/95 backdrop-blur-xl shadow-2xl shadow-black/80 py-2 hidden group-hover/sub:block animate-fade-in">
                              {child.nested.map((sub) => (
                                <Link
                                  key={sub.label}
                                  href={sub.href}
                                  className="block px-4 py-2 text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
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
                            className="block px-4 py-2 text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
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
                  className="px-3 py-2 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Right Section: Language, Cart, Login */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="hidden sm:flex items-center bg-white/[0.04] border border-white/[0.08] rounded-md p-0.5 text-xs font-medium">
              {languages.map((lang) => (
                <Link
                  key={lang.code}
                  href={lang.href}
                  className={`px-2.5 py-1 rounded transition-colors text-[11px] font-semibold ${
                    locale === lang.code.toLowerCase()
                      ? "text-[#071412] bg-[#2ffcd4]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {lang.code}
                </Link>
              ))}
            </div>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-md border border-white/[0.08] bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors relative"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#2ffcd4]" />
            </Link>

            {/* Login Button */}
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium rounded-md bg-white text-[#071412] hover:bg-white/90 transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              <User className="w-3.5 h-3.5" />
              Log in
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-md text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#050707]/98 backdrop-blur-2xl max-h-[85vh] overflow-y-auto px-4 py-5 space-y-2">
          {navItems.map((item) =>
            item.dropdown ? (
              <div key={item.label} className="border-b border-white/[0.04] pb-2">
                <button
                  onClick={() => setMobileSubOpen(mobileSubOpen === item.label ? null : item.label)}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white rounded-md"
                >
                  {item.label}
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileSubOpen === item.label ? "rotate-180" : ""}`} />
                </button>
                {mobileSubOpen === item.label && (
                  <div className="ml-4 pl-2 border-l border-white/[0.08] space-y-1 mt-1">
                    {item.children!.map((child) =>
                      child.nested ? (
                        <div key={child.label} className="py-1">
                          <div className="px-3 py-1 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                            {child.label}
                          </div>
                          {child.nested.map((sub) => (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              onClick={() => setMobileOpen(false)}
                              className="block px-3 py-1.5 text-xs text-white/70 hover:text-[#2ffcd4]"
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
                          className="block px-3 py-1.5 text-xs text-white/70 hover:text-[#2ffcd4]"
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
                className="block px-3 py-2 text-sm font-medium text-white/80 hover:text-white rounded-md"
              >
                {item.label}
              </Link>
            )
          )}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-1">
              {languages.map((lang) => (
                <Link
                  key={lang.code}
                  href={lang.href}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    locale === lang.code.toLowerCase() ? "bg-[#2ffcd4] text-[#071412]" : "text-white/60"
                  }`}
                >
                  {lang.code}
                </Link>
              ))}
            </div>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md bg-white text-[#071412]"
            >
              <User className="w-3.5 h-3.5" />
              Log in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
