import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { accountsApi, proxiesApi } from "../lib/api";
import { BrandLogo } from "./BrandLogo";

import {
  LayoutDashboard,
  Users,
  Network,
  Smartphone,
  Boxes,
  Compass,
  Megaphone,
  Zap,
  RefreshCw,
  Bot,
  Sparkles,
  UsersRound,
  BarChart3,
  CreditCard,
  KeyRound,
  Settings as SettingsIcon,
  ShieldCheck,
  Activity,
  LogOut,
  Brain,
} from "lucide-react";

interface NavSection {
  title: string;
  items: { to: string; label: string; icon: any; badge?: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "CORE",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/accounts", label: "Accounts Hub", icon: Users },
      { to: "/proxies", label: "Proxy Pool", icon: Network },
      { to: "/sms-hub", label: "SMS Hub", icon: Smartphone },
    ],
  },
  {
    title: "AUTOMATION SUITE",
    items: [
      { to: "/modules", label: "Modules Hub", icon: Boxes, badge: "77+" },
      { to: "/scraper", label: "Scraper Studio", icon: Compass },
      { to: "/campaigns", label: "Campaigns & DM", icon: Megaphone },
      { to: "/booster", label: "Booster & Warmup", icon: Zap },
      { to: "/converter", label: "Format Converter", icon: RefreshCw },
    ],
  },
  {
    title: "AI & INTELLIGENCE",
    items: [
      { to: "/personas", label: "AI Personas", icon: Bot },
      { to: "/neuro-text", label: "Neuro-Text Studio", icon: Sparkles },
      { to: "/ai-models", label: "AI Model Settings", icon: Brain, badge: "13" },
    ],
  },
  {
    title: "TOOLS & COMMUNITY",
    items: [
      { to: "/groups", label: "Groups & Chats", icon: UsersRound },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { to: "/analytics", label: "Analytics & Reports", icon: BarChart3 },
      { to: "/billing", label: "Billing & Plans", icon: CreditCard },
      { to: "/license-manager", label: "License Manager", icon: KeyRound },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

export default function Layout() {
  const { user, status, logout, setBackendOk, backendOk } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState<{ accounts: number; proxies: number }>({ accounts: 0, proxies: 0 });

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const st = await window.api?.backendStatus();
      if (!cancelled && st) setBackendOk(st.started);
    };
    check();
    const id = setInterval(check, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [setBackendOk]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [accR, prxR] = await Promise.all([
          accountsApi.list(1, 1),
          proxiesApi.listAll(),
        ]);
        if (!cancelled) {
          const accTotal = (accR.data as any)?.total ?? (Array.isArray(accR.data) ? accR.data.length : 0);
          const prxTotal = Array.isArray(prxR.data) ? prxR.data.length : 0;
          setStats({ accounts: accTotal, proxies: prxTotal });
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (status === "anon") return <Navigate to="/login" replace />;
  if (!backendOk) return <Navigate to="/backend-error" replace />;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-card/20 backdrop-blur-md flex flex-col z-20 select-none">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <BrandLogo size="sm" to="/" showTagline />
        </div>

        {/* Quick KPI Banner */}
        <div className="px-4 py-2.5 bg-background/50 border-b border-border grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-md bg-card/60 p-1.5 border border-border/50">
            <span className="text-[10px] text-muted-foreground block">Accounts</span>
            <span className="font-bold text-primary">{stats.accounts}</span>
          </div>
          <div className="rounded-md bg-card/60 p-1.5 border border-border/50">
            <span className="text-[10px] text-muted-foreground block">Proxies</span>
            <span className="font-bold text-emerald-400">{stats.proxies}</span>
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="px-2 mb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                        active
                          ? "bg-primary/15 text-primary border-l-2 border-primary shadow-[0_0_15px_rgba(45,212,191,0.1)]"
                          : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground/80"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-primary/20 text-primary">
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

        {/* User Footer */}
        <div className="border-t border-border p-3 bg-background/40 flex items-center justify-between">
          <div className="min-w-0 flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
              {(user?.full_name || user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-foreground">{user?.full_name || user?.email}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>{user?.role || "Active Plan"}</span>
              </div>
            </div>
          </div>
          <button
            title="Logout"
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            onClick={() => logout()}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-12 border-b border-border bg-card/10 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span className="text-foreground font-medium">Local Engine Active</span>
              <span className="text-[10px] font-mono text-muted-foreground">(:8765)</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Anti-Detection V2.4 Active</span>
            </div>
            <div className="h-3 w-px bg-border"></div>
            <Link
              to="/billing"
              className="text-xs px-2.5 py-1 rounded-md bg-gradient-to-r from-primary/20 to-cyan-500/20 text-primary border border-primary/30 hover:border-primary font-medium transition-all"
            >
              Upgrade License
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}