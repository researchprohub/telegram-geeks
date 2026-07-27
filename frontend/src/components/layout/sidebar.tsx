"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Brain, Zap, MessageSquare, BarChart3,
  Settings, ShieldCheck, Blocks, Upload, LogOut, CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/modules", label: "Modules", icon: Blocks, badge: "48" },
      { href: "/dashboard/campaigns", label: "Campaigns", icon: Zap },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Assets",
    items: [
      { href: "/dashboard/accounts", label: "Accounts", icon: Users },
      { href: "/dashboard/personas", label: "Personas", icon: Brain },
      { href: "/dashboard/groups", label: "Groups", icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
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
      "bg-white/[0.02] backdrop-blur-xl border-r border-white/[0.07]",
      collapsed ? "w-[76px]" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-6">
        {collapsed ? (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </div>
              <span className="font-bold text-base tracking-tight text-foreground">
                Telegram<span className="text-primary text-glow-primary">Geeks</span>
              </span>
            </div>
          </>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className={cn(
              "px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50",
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
                        ? "bg-primary/[0.08] text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.12)] text-glow-primary"
                        : "text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.04]"
                    )}
                  >
                    {/* Left border indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gradient-to-b from-primary to-cyan-400 shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                    )}
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0 transition-all",
                      isActive && "drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)]"
                    )} />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/[0.1] text-primary shadow-[0_0_6px_-1px_hsl(var(--primary)/0.3)]">
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
        <div className="p-4 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.05]">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-sm font-bold text-primary-foreground shadow-[0_0_8px_-2px_hsl(var(--primary)/0.3)]">
                N
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[hsl(var(--background))] shadow-[0_0_4px_rgba(34,197,94,0.4)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName || "Demo User"}</p>
              <p className="text-xs text-muted-foreground/70">{planNames[userPlan] || "Base"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-white/[0.05] transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
