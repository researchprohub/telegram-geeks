"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Brain, Zap, MessageSquare, BarChart3,
  Settings, ShieldCheck, Blocks, Upload, LogOut, CreditCard, Newspaper,
  Network, Cpu,
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { BrandLogo } from "@/components/brand/BrandLogo";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/modules", label: "Modules", icon: Blocks, badge: "77" },
      { href: "/dashboard/campaigns", label: "Campaigns", icon: Zap },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/blog", label: "Blog", icon: Newspaper },
    ],
  },
  {
    label: "Assets",
    items: [
      { href: "/dashboard/accounts", label: "Accounts", icon: Users },
      { href: "/dashboard/personas", label: "Personas", icon: Brain },
      { href: "/dashboard/groups", label: "Groups", icon: MessageSquare },
      { href: "/dashboard/proxies", label: "Proxies & Hub", icon: Network, badge: "14" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/dashboard/ai-models", label: "AI Models", icon: Cpu, badge: "13" },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
      { href: "/dashboard/features", label: "Features", icon: Blocks },
    ],
  },
];

export function Sidebar({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void } = {}) {
  const pathname = usePathname();
  const [userPlan, setUserPlan] = useState<string>("starter");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    fetchUserInfo();
  }, []);

  async function fetchUserInfo() {
    try {
      const res = await api.get("/auth/me");
      setUserPlan(res.data.plan_tier || "starter");
      setUserName(res.data.full_name || "");
    } catch {
      // ignore
    }
  }

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors — navigate anyway
    }
    window.location.href = "/login";
  };

  const planColors: Record<string, string> = {
    starter: "bg-primary",
    pro: "bg-accent",
    agency: "bg-warning",
  };

  const planNames: Record<string, string> = {
    starter: "Base",
    pro: "Pro",
    agency: "Agency",
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300",
      "bg-[#0a0f1d] border-r border-border shadow-2xl",
      collapsed ? "w-[76px]" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-5 border-b border-border/50 flex items-center justify-between">
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-black/50 border border-primary/30 mx-auto">
            <img src="/assets/brand/logo-icon.svg" alt="TG" className="w-full h-full object-contain" />
          </div>
        ) : (
          <BrandLogo size="sm" href="/dashboard" />
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className={cn(
              "px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400",
              collapsed && "text-center px-0"
            )}>
              {collapsed ? "..." : group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20 font-semibold shadow-[0_0_12px_-3px_hsl(var(--primary)/0.25)] text-glow-primary"
                        : "text-slate-300 hover:text-white hover:bg-secondary/70"
                    )}
                  >
                    {/* Left border indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                    )}
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0 transition-all",
                      isActive ? "text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]" : "text-slate-400"
                    )} />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/[0.15] text-primary border border-primary/20 shadow-[0_0_6px_-1px_hsl(var(--primary)/0.3)]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 bg-secondary/70 rounded-xl p-2.5 border border-border shadow-sm">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-sm font-bold text-primary-foreground shadow-[0_0_8px_-2px_hsl(var(--primary)/0.3)]">
                {(userName || "Demo User").charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a0f1d] shadow-[0_0_4px_rgba(52,211,153,0.6)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{userName || "Demo User"}</p>
              <p className="text-xs text-muted-foreground font-medium">{planNames[userPlan] || "Base"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-surface transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
