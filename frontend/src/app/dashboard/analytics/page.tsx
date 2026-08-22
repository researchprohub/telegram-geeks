"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Users,
  Zap,
  TrendingUp,
  ShieldCheck,
  Flame,
  Network,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  FolderOpen,
  ArrowUpRight,
  UserCheck,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface OverviewStats {
  accounts: {
    total: number;
    active: number;
    warming: number;
    banned: number;
    flooded: number;
    health_rate_pct: number;
  };
  campaigns: {
    total: number;
    running: number;
    messages_sent: number;
    total_targets_parsed: number;
  };
  invites: {
    total: number;
    successful: number;
    conversion_rate_pct: number;
  };
  proxies: {
    total: number;
    alive: number;
    health_rate_pct: number;
  };
  updated_at: string;
}

export default function AnalyticsDashboardPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [folderDist, setFolderDist] = useState<any[]>([]);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [invites, setInvites] = useState<any>(null);
  const [floodwait, setFloodwait] = useState<any>(null);
  const [warming, setWarming] = useState<any>(null);
  const [proxyHealth, setProxyHealth] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [topCampaigns, setTopCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [days, setDays] = useState<number>(14);

  const fetchAllAnalytics = useCallback(async () => {
    try {
      const [
        ovRes,
        distRes,
        tsRes,
        invRes,
        flRes,
        wmRes,
        pxRes,
        revRes,
        topRes,
      ] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/analytics/accounts/distribution"),
        api.get(`/analytics/campaigns/timeseries?days=${days}`),
        api.get("/analytics/invites/breakdown"),
        api.get("/analytics/floodwait"),
        api.get("/analytics/warming"),
        api.get("/analytics/proxies/health"),
        api.get("/analytics/revenue"),
        api.get("/analytics/campaigns/top?limit=5"),
      ]);

      setOverview(ovRes.data);
      setFolderDist(distRes.data?.distribution || []);
      setTimeseries(tsRes.data || []);
      setInvites(invRes.data);
      setFloodwait(flRes.data);
      setWarming(wmRes.data);
      setProxyHealth(pxRes.data);
      setRevenue(revRes.data);
      setTopCampaigns(topRes.data || []);
    } catch (e) {
      console.error("Error fetching analytics data", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  // Auto-refresh interval (30 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAllAnalytics();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllAnalytics]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchAllAnalytics();
  };

  const folderColors: Record<string, string> = {
    active: "bg-success",
    temp_spam: "bg-warning",
    perm_ban: "bg-destructive",
    frozen: "bg-muted-foreground",
    premium: "bg-primary",
    archive: "bg-secondary-foreground",
    deleted: "bg-destructive/60",
  };

  const folderLabels: Record<string, string> = {
    active: "Active",
    temp_spam: "Temp SpamBlock",
    perm_ban: "Permanent Ban",
    frozen: "Frozen",
    premium: "Premium Accounts",
    archive: "Archive Pool",
    deleted: "Deleted",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Operational Telemetry & Analytics Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time multi-agent performance, delivery timeseries, account health radar, and revenue telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/40"
            />
            Auto-refresh (30s)
          </label>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-secondary flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4 text-primary", refreshing && "animate-spin")} />
            Refresh Data
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-sm font-semibold text-muted-foreground">Aggregating telemetry streams...</p>
        </div>
      ) : (
        <>
          {/* Top KPI Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Accounts */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Accounts Health
                </span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {overview?.accounts.active || 0}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  / {overview?.accounts.total || 0} total
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-success">
                  {overview?.accounts.health_rate_pct || 0}% Operational
                </span>
                {overview?.accounts.flooded ? (
                  <span className="text-[11px] font-bold text-warning">
                    {overview.accounts.flooded} Flooded
                  </span>
                ) : null}
              </div>
            </div>

            {/* Messages Sent */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Messages Delivered
                </span>
                <Zap className="h-4 w-4 text-accent" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {overview?.campaigns.messages_sent.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {overview?.campaigns.running || 0} Active Campaigns
                </span>
                <span className="text-[11px] font-bold text-primary">
                  {overview?.campaigns.total_targets_parsed.toLocaleString() || 0} Leads
                </span>
              </div>
            </div>

            {/* Invites Conversion */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Invites Conversion
                </span>
                <UserCheck className="h-4 w-4 text-success" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {overview?.invites.successful.toLocaleString() || 0}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  / {overview?.invites.total.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-success">
                  {overview?.invites.conversion_rate_pct || 0}% Conversion
                </span>
              </div>
            </div>

            {/* Proxies Health */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Proxy Routing
                </span>
                <Network className="h-4 w-4 text-warning" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {overview?.proxies.alive || 0}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  / {overview?.proxies.total || 0} online
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-success">
                  {overview?.proxies.health_rate_pct || 0}% Alive
                </span>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Gross Revenue
                </span>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  ${revenue?.total_revenue_usd?.toLocaleString() || "0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {revenue?.completed_orders || 0} Crypto Orders
                </span>
              </div>
            </div>
          </div>

          {/* Section: Account Folder Distribution & Warming Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 7-Folder Account Health Breakdown */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  7-Smart Folder Health & Isolation Matrix
                </h3>
                <span className="text-xs text-muted-foreground font-semibold">
                  Total: {overview?.accounts.total || 0} Accounts
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {folderDist.map((item) => (
                  <div key={item.folder} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", folderColors[item.folder] || "bg-primary")} />
                        {folderLabels[item.folder] || item.folder}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-foreground font-bold">{item.count}</span>
                        <span className="text-muted-foreground text-[11px]">({item.pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", folderColors[item.folder] || "bg-primary")}
                        style={{ width: `${Math.max(item.pct, 1)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Warming & Trust Progress */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Flame className="h-4 w-4 text-warning" />
                  TelegramBooster Warming Engine
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Autonomous 7-day maturation loop and reaction booster status.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 py-2">
                <div className="p-3 rounded-xl bg-secondary/60 border border-border text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Active Warming
                  </span>
                  <span className="text-xl font-black text-warning mt-0.5 block">
                    {warming?.active_warming_jobs || 0}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-secondary/60 border border-border text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Completed Jobs
                  </span>
                  <span className="text-xl font-black text-success mt-0.5 block">
                    {warming?.completed_warming_jobs || 0}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-foreground">Average Pool Trust Score</span>
                  <span className="text-primary">{warming?.average_trust_score || 80}/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${warming?.average_trust_score || 80}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Live FloodWait Radar & Invites Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Live FloodWait Bus Monitor */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  Live FloodWait Bus Radar ({floodwait?.total_flooded || 0})
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-bold">
                  Zero Account Bans
                </span>
              </div>

              {floodwait?.accounts && floodwait.accounts.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {floodwait.accounts.map((acc: any) => (
                    <div
                      key={acc.account_id}
                      className="p-3 rounded-xl bg-secondary/40 border border-border flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                        <div>
                          <span className="font-bold text-foreground block">
                            Account {acc.account_id} ({acc.phone})
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Lifts: {new Date(acc.lifts_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-warning bg-warning/10 px-2.5 py-1 rounded-lg">
                        {acc.remaining_seconds}s remaining
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-secondary/20 rounded-xl border border-dashed border-border">
                  <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-foreground">All Accounts Operational</p>
                  <p className="text-[11px] text-muted-foreground">
                    No accounts are currently stalled under Telegram FloodWait.
                  </p>
                </div>
              )}
            </div>

            {/* TelegramInviter Module Delivery Breakdown */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  TelegramInviter Performance & Error Breakdown
                </h3>
                <span className="text-xs text-muted-foreground font-semibold">
                  {invites?.total || 0} Total Invites
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-success/10 border border-success/20">
                  <span className="text-[10px] uppercase font-bold text-success block">
                    Successful Joins
                  </span>
                  <span className="text-xl font-black text-success mt-0.5 block">
                    {invites?.success || 0}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20">
                  <span className="text-[10px] uppercase font-bold text-destructive block">
                    Failed Invites
                  </span>
                  <span className="text-xl font-black text-destructive mt-0.5 block">
                    {invites?.failed || 0}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/20">
                  <span className="text-[10px] uppercase font-bold text-warning block">
                    Privacy Restricted
                  </span>
                  <span className="text-xl font-black text-warning mt-0.5 block">
                    {invites?.privacy_restricted || 0}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    FloodWait Halts
                  </span>
                  <span className="text-xl font-black text-foreground mt-0.5 block">
                    {invites?.flood_waits || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Top Performing Campaigns Table */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Top Performing Outreach Campaigns
              </h3>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Campaign Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Messages Sent</th>
                    <th className="py-3 px-4">Delivery Failures</th>
                    <th className="py-3 px-4">Tone & Persona</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        No campaign history recorded yet.
                      </td>
                    </tr>
                  ) : (
                    topCampaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-foreground">{camp.name}</td>
                        <td className="py-3 px-4 uppercase text-[10px] font-mono text-muted-foreground">
                          {camp.type}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full font-bold text-[10px]",
                              camp.status === "running"
                                ? "bg-primary/20 text-primary"
                                : camp.status === "completed"
                                ? "bg-success/20 text-success"
                                : "bg-secondary text-muted-foreground"
                            )}
                          >
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {camp.sent.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-destructive">
                          {camp.failed || 0}
                        </td>
                        <td className="py-3 px-4 capitalize text-muted-foreground">
                          {camp.tone}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
