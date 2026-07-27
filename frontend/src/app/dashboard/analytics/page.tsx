"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, AlertCircle, BarChart3, Users, Zap } from "lucide-react";
import { analyticsApi, campaignsApi, advancedAnalyticsApi } from "@/lib/api";

// Lazy-loaded chart components to avoid SSR hydration issues
let LineChart: any, Line: any, XAxis: any, YAxis: any, CartesianGrid: any, Tooltip: any, ResponsiveContainer: any, PieChart: any, Pie: any, Cell: any;

try {
  const rc = require("recharts");
  LineChart = rc.LineChart;
  Line = rc.Line;
  XAxis = rc.XAxis;
  YAxis = rc.YAxis;
  CartesianGrid = rc.CartesianGrid;
  Tooltip = rc.Tooltip;
  ResponsiveContainer = rc.ResponsiveContainer;
  PieChart = rc.PieChart;
  Pie = rc.Pie;
  Cell = rc.Cell;
} catch {
  // recharts not available on server
}

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [chartLoaded, setChartLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    setChartLoaded(true);
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const res = await campaignsApi.list();
      const items = res.data.items || [];
      setCampaigns(items);
      if (items.length > 0) {
        setSelectedCampaignId(items[0].id);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCampaignId) return;
    setLoading(true);
    const dayMap: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 };
    Promise.all([
      analyticsApi.summary(selectedCampaignId),
      analyticsApi.funnel(selectedCampaignId),
      advancedAnalyticsApi.performanceTrend(dayMap[dateRange] || 7),
    ])
      .then(([sRes, fRes, tRes]) => {
        setSummary(sRes.data);
        setFunnel(fRes.data);
        setTrendData(tRes.data.data_points || []);
      })
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load data"))
      .finally(() => setLoading(false));
  }, [selectedCampaignId, dateRange]);

  const pieData = useMemo(() => [
    { name: "Tech", value: 35 },
    { name: "Crypto", value: 28 },
    { name: "Gaming", value: 20 },
    { name: "Business", value: 17 },
  ], []);

  const funnelData = useMemo(() => {
    if (!funnel) return [];
    return [
      { stage: "Impressions", value: funnel.impressions || 0, color: "#3b82f6" },
      { stage: "Engagements", value: funnel.engagements || 0, color: "#8b5cf6" },
      { stage: "Clicks", value: funnel.clicks || 0, color: "#10b981" },
      { stage: "Joins", value: funnel.joins || 0, color: "#f59e0b" },
      { stage: "Active", value: funnel.active_members || 0, color: "#ef4444" },
    ];
  }, [funnel]);

  const lineData = useMemo(() => {
    if (trendData.length > 0) return trendData;
    return [
      { date: "N/A", messages: 0, reactions: 0 },
    ];
  }, [trendData]);

  if (!chartLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.07] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-slate-400">Campaign performance metrics</p>
          </div>
          <div className="flex gap-2">
            {campaigns.length > 0 && (
              <select
                value={selectedCampaignId || ""}
                onChange={e => setSelectedCampaignId(Number(e.target.value))}
                className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-sm text-white outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/30"
              >
                {campaigns.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-sm text-white outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/30"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-destructive/10 border border-destructive/20 rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {campaigns.length === 0 && !error && (
          <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
            <BarChart3 className="h-8 w-8" />
            <p className="text-sm">Create a campaign to see analytics</p>
          </div>
        )}

        {summary && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5">
                <div className="text-2xl font-bold text-cyan-400">{summary.engagement_score}</div>
                <p className="text-xs text-slate-400">Engagement Score</p>
              </div>
              <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5">
                <div className="text-2xl font-bold text-green-400">{summary.conversion_rate}%</div>
                <p className="text-xs text-slate-400">Conversion Rate</p>
              </div>
              <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5">
                <div className="text-2xl font-bold text-purple-400">{summary.roi}x</div>
                <p className="text-xs text-slate-400">ROI</p>
              </div>
              <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5">
                <div className="text-2xl font-bold text-orange-400">{summary.account_health_index}%</div>
                <p className="text-xs text-slate-400">Account Health</p>
              </div>
            </div>
          </>
        )}

        {/* Charts */}
        <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Messages & Reactions Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} stroke="rgba(255,255,255,0.07)" />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} stroke="rgba(255,255,255,0.07)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  backdropFilter: 'blur(12px)',
                }}
              />
              <Line type="monotone" dataKey="messages" stroke="#00F2FE" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="reactions" stroke="#A855F7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Niche Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px)',
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Conversion Funnel</h3>
            <div className="space-y-2">
              {funnelData.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-20 text-xs text-right text-slate-400 flex-shrink-0">{f.stage}</span>
                  <div className="flex-1 bg-white/[0.04] rounded-full h-5 overflow-hidden">
                    <div
                      className="h-5 rounded-full flex items-center justify-end pr-1.5 text-[10px] text-white font-medium"
                      style={{ width: `${(f.value / funnelData[0].value) * 100}%`, backgroundColor: f.color }}
                    >
                      {f.value > 50 ? f.value : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
