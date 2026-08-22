"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Zap, TrendingUp, Brain,
  ArrowUpRight, ArrowDownRight,
  RefreshCw, Search, Bell, CheckCircle2, XCircle, AlertCircle, Eye,
  Loader2
} from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const badgeColors = (status: string) =>
    status === "active" ? "bg-primary/10 text-primary" :
    status === "banned" ? "bg-destructive/10 text-destructive" :
    "bg-warning/10 text-warning";
  const avatarColors = (status: string) =>
    status === "active" ? "bg-primary/10" :
    status === "banned" ? "bg-destructive/10" :
    "bg-warning/10";
  const iconColors = (status: string) =>
    status === "active" ? "text-primary" :
    status === "banned" ? "text-destructive" :
    "text-warning";

  useEffect(() => {
    verifySession();
  }, [router]);

  async function verifySession() {
    try {
      await api.get("/auth/me");
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      fetchData();
    }
  }

  async function fetchData() {
    try {
      const [accRes, campRes] = await Promise.allSettled([
        api.get("/accounts/"),
        api.get("/campaigns/"),
      ]);

      const accountsList = accRes.status === "fulfilled" ? (accRes.value.data?.items || accRes.value.data || []) : [];
      const campaignsList = campRes.status === "fulfilled" ? (campRes.value.data?.items || campRes.value.data || []) : [];

      const activeAccounts = accountsList.filter((a: any) => a.status === "active").length;
      const runningCampaigns = campaignsList.filter((c: any) => c.status === "running" || c.status === "draft").length;
      const avgTrust = accountsList.length > 0
        ? Math.round(accountsList.reduce((s: number, a: any) => s + (a.trust_score || 0), 0) / accountsList.length * 10) / 10
        : 0;

      setAccounts(accountsList);
      setCampaigns(campaignsList);
      setKpis([
        {
          title: "Active Accounts", value: String(activeAccounts),
          icon: Users, tint: "from-primary/20 to-primary/5", accent: "text-primary",
          change: String(accountsList.length), positive: true, sub: `of ${accountsList.length} total`,
          href: "/dashboard/accounts",
        },
        {
          title: "Running Campaigns", value: String(runningCampaigns),
          icon: Zap, tint: "from-primary/15 to-primary/5", accent: "text-primary",
          change: String(campaignsList.length), positive: true, sub: `of ${campaignsList.length} total`,
          href: "/dashboard/campaigns",
        },
        {
          title: "Avg Trust Score", value: String(avgTrust),
          icon: TrendingUp, tint: "from-primary/20 to-primary/5", accent: "text-primary",
          change: avgTrust > 50 ? "+5.2%" : "0%", positive: avgTrust > 50, sub: "trust baseline",
          href: null,
        },
        {
          title: "Personas", value: String(accountsList.length),
          icon: Brain, tint: "from-primary/15 to-primary/5", accent: "text-primary",
          change: String(campaignsList.length), positive: true, sub: `${campaignsList.length} campaigns`,
          href: "/dashboard/personas",
        },
      ]);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "banned":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "restricted":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-Powered Telegram Automation & Growth Platform</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-secondary border border-border hover:bg-surface text-muted-foreground hover:text-foreground transition-all shadow-sm"
            aria-label="Refresh"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="p-2.5 rounded-xl bg-secondary border border-border hover:bg-surface text-muted-foreground hover:text-foreground transition-all shadow-sm relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
          </button>
          <Link
            href="/dashboard/accounts/upload"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-primary/20 hover:opacity-95 transition-all text-sm"
          >
            + Add Accounts
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search accounts, personas, or campaigns..."
          className="w-full px-4 py-3 pl-11 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/60 outline-none transition-all text-sm shadow-sm"
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-xl hover:bg-card/90 transition-all group shadow-sm"
            onClick={() => kpi.href && router.push(kpi.href)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <kpi.icon className="h-6 w-6" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                kpi.positive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              }`}>
                {kpi.positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {kpi.change}
              </span>
            </div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">{kpi.value}</div>
            <p className="text-sm font-medium text-foreground/80 mt-1">{kpi.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick-Start Onboarding Banner (if no accounts yet) */}
      {accounts.length === 0 && (
        <div className="bg-gradient-to-br from-card via-card to-secondary/60 border border-border rounded-2xl p-8 relative overflow-hidden shadow-lg">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4">
              ⚡ Quick Start Guide
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Telegram Geeks Pro</h2>
            <p className="text-muted-foreground text-sm max-w-2xl mb-6">
              Get started with multi-account management, AI persona warming, and MTProto automated outreach in 3 simple steps:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard/accounts/upload"
                className="p-5 rounded-xl bg-secondary/80 border border-border hover:border-primary/40 hover:bg-surface transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold mb-3 group-hover:scale-105 transition-transform">
                  1
                </div>
                <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Add Sessions / TData</h3>
                <p className="text-xs text-muted-foreground mt-1">Upload Telethon .session files or Telegram Desktop folders.</p>
              </Link>

              <Link
                href="/dashboard/settings"
                className="p-5 rounded-xl bg-secondary/80 border border-border hover:border-primary/40 hover:bg-surface transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold mb-3 group-hover:scale-105 transition-transform">
                  2
                </div>
                <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Configure Proxies</h3>
                <p className="text-xs text-muted-foreground mt-1">Bind SOCKS5 or rotating 4G/5G mobile proxies to avoid bans.</p>
              </Link>

              <Link
                href="/dashboard/campaigns/wizard"
                className="p-5 rounded-xl bg-secondary/80 border border-border hover:border-primary/40 hover:bg-surface transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold mb-3 group-hover:scale-105 transition-transform">
                  3
                </div>
                <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Launch Campaigns</h3>
                <p className="text-xs text-muted-foreground mt-1">Start AI warming, chat scraping, or targeted mass DM outreach.</p>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Accounts */}
      {accounts.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Recent Accounts</h2>
            <Link href="/dashboard/accounts" className="text-xs font-semibold text-primary hover:underline">View All Accounts →</Link>
          </div>
          <div className="space-y-3">
            {accounts.slice(0, 5).map((account) => (
              <div
                key={account.id}
                className="bg-secondary/60 rounded-xl border border-border/80 p-4 cursor-pointer hover:border-primary/40 hover:bg-surface transition-all flex items-center justify-between"
                onClick={() => router.push(`/dashboard/accounts/${account.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${avatarColors(account.status)}`}>
                    <Users className={`h-5 w-5 ${iconColors(account.status)}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{account.phone_number}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeColors(account.status)}`}>
                        {account.status}
                      </span>
                      <span className="text-xs text-muted-foreground">Trust: {account.trust_score}%</span>
                    </div>
                  </div>
                </div>
                {getStatusIcon(account.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
