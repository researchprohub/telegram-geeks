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
    <>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.07] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Overview</h1>
            <p className="text-sm text-slate-400">Engagement Platform</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-all"
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-slate-400" />
            </button>
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-all relative"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-slate-400" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search accounts..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 focus:border-primary/30 outline-none transition-all pl-10"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.title}
              className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5 relative overflow-hidden cursor-pointer hover:bg-white/[0.04] hover:border-primary/20 transition-all group"
              onClick={() => kpi.href && router.push(kpi.href)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-cyan-400/15 flex items-center justify-center border border-white/[0.05]">
                    <kpi.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.positive ? 'text-cyan-400' : 'text-destructive'}`}>
                    {kpi.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {kpi.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">{kpi.value}</div>
                <p className="text-xs text-slate-400 mt-1">{kpi.title}</p>
                <p className="text-[10px] text-slate-500/60">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 pb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <Link href="/dashboard/accounts/upload" className="flex-shrink-0 bg-gradient-to-r from-primary to-cyan-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)]">
            + Add Accounts
          </Link>
          <Link href="/dashboard/campaigns" className="flex-shrink-0 bg-white/[0.03] text-slate-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all border border-white/[0.07]">
            New Campaign
          </Link>
          <Link href="/dashboard/personas" className="flex-shrink-0 bg-white/[0.03] text-slate-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all border border-white/[0.07]">
            Manage Personas
          </Link>
        </div>
      </div>

      {/* Recent Accounts */}
      {accounts.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Recent Accounts</h2>
            <Link href="/dashboard/accounts" className="text-sm text-primary font-medium hover:text-primary/80">View All</Link>
          </div>
          <div className="space-y-2">
            {accounts.slice(0, 3).map((account) => (
              <div key={account.id} className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-4 cursor-pointer hover:bg-white/[0.04] hover:border-primary/20 transition-all group"
                onClick={() => router.push(`/dashboard/accounts/${account.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${avatarColors(account.status)}`}>
                      <Users className={`h-5 w-5 ${iconColors(account.status)}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{account.phone_number}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColors(account.status)}`}>
                          {account.status}
                        </span>
                        <span className="text-xs text-slate-500">Trust: {account.trust_score}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusIcon(account.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Campaigns */}
      {campaigns.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Recent Campaigns</h2>
            <Link href="/dashboard/campaigns" className="text-sm text-primary font-medium hover:text-primary/80">View All</Link>
          </div>
          <div className="space-y-2">
            {campaigns.slice(0, 3).map((campaign) => (
              <div key={campaign.id} className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-4 cursor-pointer hover:bg-white/[0.04] hover:border-primary/20 transition-all group"
                onClick={() => router.push(`/dashboard/campaigns`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{campaign.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{campaign.campaign_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      campaign.status === "running"
                        ? "bg-primary/10 text-primary"
                        : "bg-white/[0.04] text-slate-400"
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="px-6 pb-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-sm text-red-400">
            {error}
          </div>
        </div>
      )}
    </>
  );
}
