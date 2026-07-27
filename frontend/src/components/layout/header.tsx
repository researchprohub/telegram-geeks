"use client";

import { Bell, Moon, Sun, Search, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

function useBreadcrumb() {
  const pathname = usePathname() || "/dashboard";
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p, i) => ({
    label: p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "),
    href: "/" + parts.slice(0, i + 1).join("/"),
    last: i === parts.length - 1,
  }));
}

export function Header() {
  const [dark, setDark] = useState(true);
  const crumbs = useBreadcrumb();

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {}
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/70 px-6 backdrop-blur-xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        {crumbs.map((c, i) => (
          <div key={c.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <span
              className={
                c.last
                  ? "font-semibold text-foreground truncate"
                  : "text-muted-foreground truncate"
              }
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search..."
            className="h-9 w-56 rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 border-l border-border pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
            A
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-medium">Admin</p>
            <p className="text-[11px] text-muted-foreground">Operator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
