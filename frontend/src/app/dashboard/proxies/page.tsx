"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Globe, Zap, DollarSign, CheckCircle2,
  XCircle, Settings, RefreshCw, Wallet, Plus,
  ChevronDown, Activity, TrendingUp, Network,
  Server, Copy, Check, Trash2, ArrowRight, Play
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";

const PROVIDERS = [
  {
    id: "bright_data", name: "Bright Data", tier: "Enterprise",
    ipPool: "150M+", minPriceGB: 0.60, proxyTypes: ["Residential", "DC", "ISP", "Mobile"],
    protocols: ["HTTP", "HTTPS", "SOCKS5"], cryptoCoins: ["BTC", "ETH", "USDT", "USDC"],
    badge: "🏆 Top Tier", color: "from-orange-500/20 to-red-500/20",
    borderColor: "border-orange-500/30", dotColor: "bg-orange-400",
    description: "Highest reliability for enterprise account fleets",
    fields: ["customer_id", "zone_name", "password"],
  },
  {
    id: "oxylabs", name: "Oxylabs", tier: "Enterprise",
    ipPool: "100M+", minPriceGB: 0.42, proxyTypes: ["Residential", "DC", "ISP", "Mobile"],
    protocols: ["HTTP", "HTTPS", "SOCKS5"], cryptoCoins: ["BTC", "ETH", "USDT"],
    badge: "⚡ Fastest DC", color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30", dotColor: "bg-blue-400",
    description: "Best for large-scale datacenter operations",
    fields: ["username", "password"],
  },
  {
    id: "decodo", name: "Decodo (Smartproxy)", tier: "Professional",
    ipPool: "115M+", minPriceGB: 0.60, proxyTypes: ["Residential", "DC", "ISP", "Mobile"],
    protocols: ["HTTP", "HTTPS", "SOCKS5"], cryptoCoins: ["BTC", "ETH", "USDT", "LTC"],
    badge: "🚀 Best Value", color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30", dotColor: "bg-green-400",
    description: "99.7% success rate with HTTP/3 & QUIC support",
    fields: ["username", "password"],
  },
  {
    id: "iproyal", name: "IPRoyal", tier: "Professional",
    ipPool: "32M+", minPriceGB: 1.75, proxyTypes: ["Residential", "DC", "ISP", "Mobile"],
    protocols: ["HTTP", "HTTPS", "SOCKS5"],
    cryptoCoins: ["BTC", "ETH", "USDT", "LTC", "XMR", "DOGE", "TRX", "SOL", "+17 more"],
    badge: "💎 25+ Cryptos", color: "from-purple-500/20 to-violet-500/20",
    borderColor: "border-purple-500/30", dotColor: "bg-purple-400",
    description: "Widest cryptocurrency payment support — 25+ coins accepted",
    fields: ["username", "password"],
  },
  {
    id: "dataimpulse", name: "DataImpulse", tier: "Budget",
    ipPool: "90M+", minPriceGB: 1.00, proxyTypes: ["Residential", "Mobile", "DC"],
    protocols: ["HTTP", "SOCKS5"], cryptoCoins: ["USDT TRC20", "BTC", "ETH"],
    badge: "💰 $1/GB PAYG", color: "from-yellow-500/20 to-amber-500/20",
    borderColor: "border-yellow-500/30", dotColor: "bg-yellow-400",
    description: "Cheapest rotating residential with permanent non-expiring credits",
    fields: ["username", "password"],
  },
  {
    id: "nodemaven", name: "NodeMaven", tier: "Social Media",
    ipPool: "1,400+ locs", minPriceGB: 1.00, proxyTypes: ["Residential", "Mobile"],
    protocols: ["HTTP", "SOCKS5"], cryptoCoins: ["BTC", "USDT", "ETH"],
    badge: "🤖 Social Optimized", color: "from-pink-500/20 to-rose-500/20",
    borderColor: "border-pink-500/30", dotColor: "bg-pink-400",
    description: "Optimized for social media automation & multi-accounting",
    fields: ["username", "password"],
  },
  {
    id: "webshare", name: "Webshare", tier: "Budget",
    ipPool: "30M+", minPriceGB: 1.19, proxyTypes: ["Residential", "DC", "ISP"],
    protocols: ["HTTP", "SOCKS5"], cryptoCoins: ["BTC", "USDT"],
    badge: "🔑 API-First", color: "from-slate-500/20 to-gray-500/20",
    borderColor: "border-slate-500/30", dotColor: "bg-slate-400",
    description: "Full REST API for programmatic proxy management",
    fields: ["api_key", "username", "password"],
  },
  {
    id: "proxy_cheap", name: "Proxy-Cheap", tier: "Budget",
    ipPool: "20M+", minPriceGB: 4.99, proxyTypes: ["Residential", "DC", "ISP"],
    protocols: ["HTTP", "SOCKS5"], cryptoCoins: ["BTC", "ETH", "USDT", "LTC"],
    badge: "🌍 220+ Countries", color: "from-teal-500/20 to-cyan-500/20",
    borderColor: "border-teal-500/30", dotColor: "bg-teal-400",
    description: "Wide geo coverage for budget agency operations",
    fields: ["username", "password"],
  },
  {
    id: "soax", name: "SOAX", tier: "Professional",
    ipPool: "8.5M+", minPriceGB: 3.50, proxyTypes: ["Residential", "Mobile", "ISP"],
    protocols: ["HTTP", "SOCKS5"], cryptoCoins: ["BTC", "ETH", "USDT"],
    badge: "✅ Clean IPs", color: "from-indigo-500/20 to-blue-500/20",
    borderColor: "border-indigo-500/30", dotColor: "bg-indigo-400",
    description: "Verified & cleaned residential IPs — lowest ban rate",
    fields: ["api_key", "password"],
  },
  {
    id: "proxyrack", name: "Proxyrack", tier: "Budget",
    ipPool: "2M+", minPriceGB: 5.00, proxyTypes: ["Residential", "DC"],
    protocols: ["HTTP", "SOCKS5"], cryptoCoins: ["BTC"],
    badge: "🕒 30-min Sticky", color: "from-orange-400/20 to-yellow-500/20",
    borderColor: "border-orange-400/30", dotColor: "bg-orange-300",
    description: "Best for tasks requiring 30-min persistent sessions",
    fields: ["username", "api_key"],
  },
  {
    id: "proxy_seller", name: "Proxy-Seller", tier: "Budget",
    ipPool: "20M+", minPriceGB: 0.70, proxyTypes: ["Residential", "ISP", "DC"],
    protocols: ["HTTP", "HTTPS", "SOCKS5"], cryptoCoins: ["BTC", "ETH", "USDT"],
    badge: "💵 $0.70/GB", color: "from-lime-500/20 to-green-500/20",
    borderColor: "border-lime-500/30", dotColor: "bg-lime-400",
    description: "Most affordable per-GB pricing with 220+ geo coverage",
    fields: ["username", "password"],
  },
  {
    id: "proxyscrape", name: "ProxyScrape", tier: "Free+",
    ipPool: "40M+", minPriceGB: 0.00, proxyTypes: ["Residential", "DC"],
    protocols: ["HTTP", "SOCKS5"], cryptoCoins: ["BTC", "ETH", "USDT", "LTC"],
    badge: "🆓 Free Tier", color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/30", dotColor: "bg-emerald-400",
    description: "Free tier available — crypto for premium bandwidth",
    fields: ["username", "password"],
  },
  {
    id: "froxy", name: "Froxy", tier: "Budget",
    ipPool: "8M+", minPriceGB: 2.00, proxyTypes: ["Residential", "ISP"],
    protocols: ["HTTP", "SOCKS5"], cryptoCoins: ["BTC", "USDT"],
    badge: "🌐 EU/Asia Focus", color: "from-violet-500/20 to-purple-500/20",
    borderColor: "border-violet-500/30", dotColor: "bg-violet-400",
    description: "Cost-effective for EU and Asia-Pacific coverage",
    fields: ["username", "password"],
  },
  {
    id: "proxycompass", name: "ProxyCompass", tier: "Specialized",
    ipPool: "Custom", minPriceGB: 3.00, proxyTypes: ["Residential", "DC"],
    protocols: ["HTTP", "HTTPS", "SOCKS5"], cryptoCoins: ["BTC", "ETH", "USDT"],
    badge: "🧭 Multi-Account", color: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/30", dotColor: "bg-cyan-400",
    description: "Specialized for managing multiple accounts simultaneously",
    fields: ["api_key", "password"],
  },
];

const TIER_COLORS: Record<string, string> = {
  "Enterprise":   "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  "Professional": "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  "Social Media": "bg-pink-500/20 text-pink-300 border border-pink-500/30",
  "Budget":       "bg-green-500/20 text-green-300 border border-green-500/30",
  "Free+":        "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  "Specialized":  "bg-purple-500/20 text-purple-300 border border-purple-500/30",
};

export default function ProxiesPage() {
  const [activeTab, setActiveTab] = useState<"pool" | "hub">("pool");
  const [activeFilter, setActiveFilter] = useState("All");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [registeredProviders, setRegisteredProviders] = useState<Set<string>>(new Set(["decodo", "dataimpulse"]));
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({});
  const [proxies, setProxies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [sweepResults, setSweepResults] = useState<any>(null);
  const [sweepLoading, setSweepLoading] = useState(false);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    fetchProxies();
  }, []);

  async function fetchProxies() {
    setLoading(true);
    try {
      const res = await api.get("/proxies");
      setProxies(res.data.proxies || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkImport() {
    if (!bulkText.trim()) return;
    try {
      await api.post("/proxies/bulk", { proxies_text: bulkText, proxy_type: "socks5" });
      setBulkText("");
      setNotification("Proxies imported successfully!");
      setTimeout(() => setNotification(""), 4000);
      fetchProxies();
    } catch (err: any) {
      setNotification(err.response?.data?.detail || "Failed to import proxies");
      setTimeout(() => setNotification(""), 4000);
    }
  }

  async function handleHealthSweep() {
    setSweepLoading(true);
    try {
      const res = await api.get("/proxy-providers/health-sweep");
      setSweepResults(res.data.health || {});
      setNotification("Health sweep complete!");
      setTimeout(() => setNotification(""), 4000);
    } catch {
      setNotification("Health check error");
      setTimeout(() => setNotification(""), 4000);
    } finally {
      setSweepLoading(false);
    }
  }

  const handleRegister = (providerId: string) => {
    setRegisteredProviders(prev => new Set([...prev, providerId]));
    setNotification(`${providerId} registered successfully!`);
    setTimeout(() => setNotification(""), 4000);
    setExpandedCard(null);
  };

  const filters = ["All", "Enterprise", "Professional", "Social Media", "Budget", "Free+"];
  const filtered = activeFilter === "All"
    ? PROVIDERS
    : PROVIDERS.filter(p => p.tier === activeFilter);

  return (
    <div className="min-h-screen p-8 space-y-8 bg-background text-foreground">

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Proxy Infrastructure & Provider Hub
                <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-xs">
                  14 Providers Supported
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage your manual SOCKS5/HTTP pool or connect rotating residential proxy APIs with native crypto checkout.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-card p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("pool")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "pool" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-white"
              }`}
            >
              Manual Proxy Pool ({proxies.length})
            </button>
            <button
              onClick={() => setActiveTab("hub")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "hub" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-white"
              }`}
            >
              Rotating API Hub (14)
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleHealthSweep}
            disabled={sweepLoading}
            className="border-border text-white hover:bg-card gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${sweepLoading ? "animate-spin text-primary" : ""}`} />
            {sweepLoading ? "Sweeping..." : "Health Sweep"}
          </Button>
        </div>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {notification}
        </motion.div>
      )}

      {/* ── KPI Stats Bar ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Proxies in Pool", value: proxies.length.toString(), icon: Server, color: "text-blue-400" },
          { label: "Rotating API Providers", value: "14", icon: Globe, color: "text-primary" },
          { label: "Active Connected Providers", value: registeredProviders.size.toString(), icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Crypto Payment Coins", value: "25+ Coins", icon: Wallet, color: "text-yellow-400" },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/70 backdrop-blur-md border border-border p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-background/50 border border-border ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── TAB 1: MANUAL PROXY POOL ────────────────────────────────────────── */}
      {activeTab === "pool" && (
        <div className="space-y-6">
          <Card className="bg-card/70 border border-border p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Bulk Import Proxies
            </h2>
            <p className="text-xs text-muted-foreground">
              Paste proxies one per line in format: <code className="text-primary bg-background px-1.5 py-0.5 rounded">host:port:username:password</code> or <code className="text-primary bg-background px-1.5 py-0.5 rounded">host:port</code> (Default protocol: SOCKS5).
            </p>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              rows={4}
              placeholder="185.220.101.5:1080:user123:pass456&#10;192.168.1.100:9050"
              className="w-full bg-background/70 border border-border rounded-xl p-3 text-sm text-white font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
            />
            <div className="flex justify-end">
              <Button onClick={handleBulkImport} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="w-4 h-4" /> Import to Pool
              </Button>
            </div>
          </Card>

          <Card className="bg-card/70 border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-primary" /> Registered Pool ({proxies.length})
              </h2>
              <Button variant="ghost" size="sm" onClick={fetchProxies} className="text-xs text-muted-foreground hover:text-white">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
              </Button>
            </div>

            {proxies.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm space-y-2">
                <Server className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p>No proxies registered in pool yet.</p>
                <p className="text-xs">Import manual proxies above or connect a rotating API provider in the Hub tab.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {proxies.map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-background/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.status === "active" ? "bg-emerald-400" : "bg-yellow-400"}`} />
                      <div>
                        <p className="text-sm font-mono font-medium text-white">{p.host}:{p.port}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.proxy_type?.toUpperCase()} • {p.country || "Global"} • {p.provider || "manual"}
                          {p.response_time_ms ? ` • ${p.response_time_ms}ms` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono border-border text-muted-foreground">
                        {p.allocated_to_account_id ? `Assigned to Account #${p.allocated_to_account_id}` : "Unallocated"}
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB 2: ROTATING API PROVIDERS HUB ───────────────────────────────── */}
      {activeTab === "hub" && (
        <div className="space-y-6">
          {/* Crypto Banner */}
          <Card className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/30 p-5 rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-300">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Direct Crypto Billing Across All Providers</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Pay for rotating residential bandwidth anonymously using BTC, ETH, USDT (TRC20/ERC20), LTC, XMR, SOL, or DOGE.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["BTC", "ETH", "USDT", "LTC", "XMR", "SOL", "TRX", "DOGE"].map(coin => (
                  <span key={coin} className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[11px] font-mono font-semibold rounded-lg">
                    {coin}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Filter Bar */}
          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground shadow"
                    : "bg-card text-muted-foreground hover:text-white border border-border"
                }`}
              >
                {f} {f === "All" ? `(${PROVIDERS.length})` : `(${PROVIDERS.filter(p => p.tier === f).length})`}
              </button>
            ))}
          </div>

          {/* Provider Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((provider, i) => {
                const isRegistered = registeredProviders.has(provider.id);
                const isExpanded = expandedCard === provider.id;

                return (
                  <motion.div
                    key={provider.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card
                      className={`bg-card/80 border ${provider.borderColor} overflow-hidden transition-all duration-300 hover:border-white/20`}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2.5 h-2.5 rounded-full ${provider.dotColor} ${isRegistered ? "animate-pulse" : "opacity-40"}`} />
                              <h3 className="text-white font-bold text-base">{provider.name}</h3>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TIER_COLORS[provider.tier]}`}>
                              {provider.tier}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">From</p>
                            <p className="text-white font-bold text-sm">
                              {provider.minPriceGB === 0 ? "FREE" : `$${provider.minPriceGB.toFixed(2)}/GB`}
                            </p>
                          </div>
                        </div>

                        <div className="text-xs text-primary font-medium mb-2">{provider.badge}</div>
                        <p className="text-xs text-muted-foreground mb-4 min-h-[32px]">{provider.description}</p>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="bg-background/60 border border-border/60 rounded-lg p-2">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-semibold">IP Pool</p>
                            <p className="text-white text-xs font-mono font-semibold">{provider.ipPool}</p>
                          </div>
                          <div className="bg-background/60 border border-border/60 rounded-lg p-2">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-semibold">Protocols</p>
                            <p className="text-white text-xs font-mono font-semibold">{provider.protocols.join(", ")}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {provider.cryptoCoins.slice(0, 4).map(coin => (
                            <span key={coin} className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-300 text-[10px] rounded font-mono border border-yellow-500/20">
                              {coin}
                            </span>
                          ))}
                          {provider.cryptoCoins.length > 4 && (
                            <span className="px-1.5 py-0.5 bg-card text-muted-foreground text-[10px] rounded border border-border">
                              +{provider.cryptoCoins.length - 4} more
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {isRegistered ? (
                            <>
                              <Button size="sm" variant="outline" className="flex-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 text-xs font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-3 border-border text-white hover:bg-card"
                                onClick={() => setExpandedCard(isExpanded ? null : provider.id)}
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
                              onClick={() => setExpandedCard(isExpanded ? null : provider.id)}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Connect API
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Credential Settings Form */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border bg-background/50 p-5 space-y-3"
                          >
                            <p className="text-xs font-semibold text-white">API Credentials for {provider.name}</p>
                            {provider.fields.map(field => (
                              <div key={field}>
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">
                                  {field.replace(/_/g, " ")}
                                </label>
                                <input
                                  type={field.includes("password") || field.includes("key") ? "password" : "text"}
                                  placeholder={`Enter ${field.replace(/_/g, " ")}...`}
                                  className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                                  onChange={e => setCredentials(prev => ({
                                    ...prev,
                                    [provider.id]: { ...prev[provider.id], [field]: e.target.value }
                                  }))}
                                />
                              </div>
                            ))}
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                                onClick={() => handleRegister(provider.id)}
                              >
                                Save & Activate
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-3 border-border text-white hover:bg-card text-xs"
                                onClick={() => setExpandedCard(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

    </div>
  );
}
