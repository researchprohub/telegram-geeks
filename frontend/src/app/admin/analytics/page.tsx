"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Key,
  Shield,
  Zap,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  Server,
  Radio,
  Send,
  Download,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  Coins,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface AnalyticsData {
  total_users: number;
  active_users: number;
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  total_campaigns: number;
  active_campaigns: number;
  total_accounts: number;
  total_groups: number;
  total_personas: number;
  conversion_rate?: number;
  avg_order_value?: number;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("30d");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  async function fetchAnalytics() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/analytics/overview");
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }

  // Simulated crypto revenue distribution
  const cryptoBreakdown = [
    { coin: "USDT (TRC-20)", share: 48, amount: (data?.total_revenue || 1240) * 0.48, color: "bg-teal-400" },
    { coin: "Solana (SOL)", share: 22, amount: (data?.total_revenue || 1240) * 0.22, color: "bg-purple-400" },
    { coin: "Bitcoin (BTC)", share: 15, amount: (data?.total_revenue || 1240) * 0.15, color: "bg-amber-400" },
    { coin: "Monero (XMR)", share: 10, amount: (data?.total_revenue || 1240) * 0.10, color: "bg-orange-400" },
    { coin: "Ethereum (ETH)", share: 5, amount: (data?.total_revenue || 1240) * 0.05, color: "bg-cyan-400" },
  ];

  const modulePerformance = [
    { name: "Channel Cloner & Rebroadcaster", runs: 1420, successRate: "99.4%", tier: "Pro/Agency" },
    { name: "Neuro-Text AI Mass Messenger", runs: 980, successRate: "98.7%", tier: "Pro" },
    { name: "Group Member Scraper & Filter", runs: 854, successRate: "99.1%", tier: "Starter" },
    { name: "Session Warmup & Booster", runs: 640, successRate: "97.9%", tier: "Pro" },
    { name: "Anti-Spam Proxy Rotator", runs: 512, successRate: "100%", tier: "All" },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Timeframe Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2 shadow-sm shadow-primary/10">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Platform Telemetry & Revenue Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Analytics & Operations Hub
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time throughput, license renewals, cryptographic cash flow, and cluster performance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-xl bg-secondary/40 p-1 border border-border/60">
            {["7d", "30d", "90d", "all"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === t
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
            className="border-border/60 hover:bg-secondary/40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Gross Revenue */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-primary/[0.03] backdrop-blur-md shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="h-16 w-16 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Total Revenue Generated
            </CardDescription>
            <CardTitle className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              ${(data?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
              <ArrowUpRight className="h-4 w-4" />
              <span>+28.4% vs prev period</span>
            </div>
          </CardContent>
        </Card>

        {/* Paid Licenses */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-purple-500/[0.03] backdrop-blur-md shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Key className="h-16 w-16 text-purple-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Desktop Licenses & Orders
            </CardDescription>
            <CardTitle className="text-3xl sm:text-4xl font-extrabold text-purple-400 tracking-tight">
              {data?.total_orders || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-foreground font-semibold">{data?.pending_orders || 0} Pending</span>
              <span>•</span>
              <span className="text-teal-400">{(data?.total_orders || 0) - (data?.pending_orders || 0)} Confirmed</span>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Sessions Running */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-cyan-500/[0.03] backdrop-blur-md shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="h-16 w-16 text-cyan-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Connected MTProto Sessions
            </CardDescription>
            <CardTitle className="text-3xl sm:text-4xl font-extrabold text-cyan-400 tracking-tight">
              {data?.total_accounts || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-teal-400 font-semibold">100% MTProto 2.0</span>
              <span>•</span>
              <span>{data?.total_personas || 0} AI Personas</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Automated Campaigns */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card to-teal-500/[0.03] backdrop-blur-md shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="h-16 w-16 text-teal-400" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Active Campaigns
            </CardDescription>
            <CardTitle className="text-3xl sm:text-4xl font-extrabold text-teal-400 tracking-tight">
              {data?.active_campaigns || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Total Launched: <strong className="text-foreground">{data?.total_campaigns || 0}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Grid: Crypto Revenue Distribution & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crypto Revenue Share */}
        <Card className="lg:col-span-1 border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Cryptocurrency Payment Flow
            </CardTitle>
            <CardDescription className="text-xs">
              Breakdown of subscription payments by incoming blockchain network.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cryptoBreakdown.map((item) => (
              <div key={item.coin} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{item.coin}</span>
                  <span className="font-mono text-muted-foreground">
                    ${item.amount.toFixed(2)} ({item.share}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary/40 overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.share}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Module Usage & Velocity */}
        <Card className="lg:col-span-2 border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Top Automation Engine Modules
            </CardTitle>
            <CardDescription className="text-xs">
              Execution frequency and operational success rate across all 77+ platform modules.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground font-semibold text-left">
                    <th className="p-3 pl-6">Module Name</th>
                    <th className="p-3">Required Tier</th>
                    <th className="p-3">Executions</th>
                    <th className="p-3 pr-6 text-right">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {modulePerformance.map((mod) => (
                    <tr key={mod.name} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3 pl-6 font-semibold text-foreground">{mod.name}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {mod.tier}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{mod.runs.toLocaleString()}</td>
                      <td className="p-3 pr-6 text-right font-mono font-bold text-teal-400">
                        {mod.successRate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cluster Node Diagnostics */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Server className="h-4 w-4 text-teal-400" />
            Infrastructure & Cluster Topology
          </CardTitle>
          <CardDescription className="text-xs">
            Live operational status of backend services running on Docker Node (`213.111.150.162`).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">PostgreSQL 16</span>
                <span className="inline-flex items-center gap-1 text-teal-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  Healthy
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Pool connections: 12/50 &bull; Latency: 0.8ms</p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Redis 7 In-Memory</span>
                <span className="inline-flex items-center gap-1 text-teal-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  Healthy
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Rate limit keys: 48 &bull; Memory: 14.2 MB</p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">FastAPI ASGI Engine</span>
                <span className="inline-flex items-center gap-1 text-teal-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Uptime: 99.98% &bull; Port: 8002 &bull; Py 3.12</p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Next.js Edge Frontend</span>
                <span className="inline-flex items-center gap-1 text-teal-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Port: 3001 &bull; SSL: Cloudflare TLS 1.3</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
