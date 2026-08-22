"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Wallet,
  Settings,
  Shield,
  BarChart3,
  LogOut,
  ArrowLeft,
  Handshake,
  KeyRound,
  X,
  Radio,
  ExternalLink,
} from "lucide-react";
import { authApi } from "@/lib/api";

const navGroups = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3, badge: "Live" },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/admin/users", label: "Users & Operators", icon: Users },
      { href: "/admin/licenses", label: "Licenses", icon: KeyRound },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/deposits", label: "Crypto Deposits", icon: Wallet },
      { href: "/admin/partners", label: "Partners", icon: Handshake },
    ],
  },
  {
    title: "System & Config",
    items: [
      { href: "/admin/settings", label: "System Settings", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  }, [pathname]);

  async function checkAdmin() {
    try {
      const res = await authApi.getMe();
      setIsAdmin(res.data.role === "admin");
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    router.push("/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card/95 backdrop-blur-2xl border-r border-border/70 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-border/60 bg-gradient-to-r from-card via-card to-primary/[0.03]">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 via-red-500 to-amber-500 text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Shield className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-foreground">
                TelegramGeeks
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Admin Command
            </p>
          </div>
        </Link>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-border">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm shadow-primary/5 font-bold"
                        : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-sm shadow-primary" />
                      )}
                      <item.icon
                        className={cn(
                          "h-4 w-4 transition-transform group-hover:scale-110",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 uppercase">
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

      {/* Quick Server Status Pill */}
      <div className="px-4 py-2 border-t border-border/40 bg-secondary/10">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Radio className="h-3 w-3 text-teal-400 animate-pulse" />
            <span>Server Cluster</span>
          </span>
          <span className="font-mono text-[10px] text-teal-400 font-semibold">99.98% Up</span>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-border/60 p-3 space-y-1 bg-card/80">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary/50 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Exit to App Dashboard</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-64">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Slide-out */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
