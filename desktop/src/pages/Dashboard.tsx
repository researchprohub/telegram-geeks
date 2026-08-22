import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  modulesApi,
  accountsApi,
  proxiesApi,
  campaignsApi,
  personasApi,
  smsApi,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  Users,
  Network,
  Smartphone,
  Megaphone,
  Boxes,
  Zap,
  RefreshCw,
  Compass,
  Sparkles,
  Bot,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Radio,
  Cpu,
  Database,
  Lock,
  Layers,
} from "lucide-react";

interface DashboardStats {
  totalModules: number;
  totalAccounts: number;
  activeAccounts: number;
  totalProxies: number;
  aliveProxies: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalPersonas: number;
  configuredSms: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalModules: 77,
    totalAccounts: 0,
    activeAccounts: 0,
    totalProxies: 0,
    aliveProxies: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalPersonas: 0,
    configuredSms: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [mRes, aRes, pRes, cRes, perRes, smsRes] = await Promise.allSettled([
          modulesApi.list(),
          accountsApi.list(1, 200),
          proxiesApi.listAll(),
          campaignsApi.list(1, 100),
          personasApi.list(1),
          smsApi.listProviders(),
        ]);

        if (cancelled) return;

        let totalMod = 77;
        if (mRes.status === "fulfilled" && mRes.value.data?.total) {
          totalMod = mRes.value.data.total;
        }

        let accList: any[] = [];
        if (aRes.status === "fulfilled") {
          const raw = aRes.value.data;
          accList = (raw as any)?.items ?? (Array.isArray(raw) ? raw : []);
        }
        const activeAcc = accList.filter((a) => a.status === "active" || !a.status).length;

        let prxList: any[] = [];
        if (pRes.status === "fulfilled") {
          prxList = Array.isArray(pRes.value.data) ? pRes.value.data : [];
        }
        const alivePrx = prxList.filter((p) => p.status === "active" || p.status === "alive" || p.is_active).length;

        let campList: any[] = [];
        if (cRes.status === "fulfilled") {
          const raw = cRes.value.data;
          campList = (raw as any)?.items ?? (Array.isArray(raw) ? raw : []);
        }
        const activeCamp = campList.filter((c) => c.status === "running" || c.status === "active").length;

        let totalPer = 0;
        if (perRes.status === "fulfilled") {
          const raw = perRes.value.data;
          totalPer = Array.isArray(raw) ? raw.length : (raw as any)?.total || 0;
        }

        let confSms = 0;
        if (smsRes.status === "fulfilled") {
          const raw = smsRes.value.data;
          const provs = Array.isArray(raw) ? raw : (raw as any)?.providers || [];
          confSms = provs.filter((p: any) => p.configured || p.api_key_configured).length;
        }

        setStats({
          totalModules: totalMod,
          totalAccounts: accList.length,
          activeAccounts: activeAcc,
          totalProxies: prxList.length,
          aliveProxies: alivePrx,
          totalCampaigns: campList.length,
          activeCampaigns: activeCamp,
          totalPersonas: totalPer,
          configuredSms: confSms,
        });
      } catch {
        // preserve defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-card/80 via-card/40 to-primary/5 p-7 backdrop-blur-xl shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-3">
              <Sparkles className="h-3 w-3" />
              <span>Next-Gen Telegram Automation Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, {user?.full_name || user?.email?.split("@")[0] || "Operator"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Enterprise control center for multi-account orchestration, high-speed scrapers, AI-driven neuro-messaging, and anti-detection systems.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/campaigns"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black font-semibold text-xs shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:opacity-90 transition-all"
            >
              <Megaphone className="h-4 w-4" />
              <span>Launch Campaign</span>
            </Link>
            <Link
              to="/modules"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground hover:bg-card/80 text-xs font-medium transition-all"
            >
              <Boxes className="h-4 w-4 text-primary" />
              <span>All 77+ Modules</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Accounts KPI */}
        <Link
          to="/accounts"
          className="rounded-xl border border-border/80 bg-card/40 hover:bg-card/70 hover:border-primary/40 p-4 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Accounts</span>
            <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{stats.totalAccounts}</span>
            <span className="text-[10px] text-emerald-400 font-medium">({stats.activeAccounts} active)</span>
          </div>
          <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>TData & Sessions</span>
          </div>
        </Link>

        {/* Proxies KPI */}
        <Link
          to="/proxies"
          className="rounded-xl border border-border/80 bg-card/40 hover:bg-card/70 hover:border-primary/40 p-4 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Proxy Pool</span>
            <Network className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{stats.totalProxies}</span>
            <span className="text-[10px] text-emerald-400 font-medium">({stats.aliveProxies} online)</span>
          </div>
          <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
            <Radio className="h-3 w-3 text-cyan-400" />
            <span>SOCKS5 / Mobile</span>
          </div>
        </Link>

        {/* Campaigns KPI */}
        <Link
          to="/campaigns"
          className="rounded-xl border border-border/80 bg-card/40 hover:bg-card/70 hover:border-primary/40 p-4 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Campaigns</span>
            <Megaphone className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{stats.totalCampaigns}</span>
            <span className="text-[10px] text-amber-400 font-medium">({stats.activeCampaigns} active)</span>
          </div>
          <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3 text-amber-400" />
            <span>Mass DM & Invites</span>
          </div>
        </Link>

        {/* Modules KPI */}
        <Link
          to="/modules"
          className="rounded-xl border border-border/80 bg-card/40 hover:bg-card/70 hover:border-primary/40 p-4 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Modules</span>
            <Boxes className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-primary">{stats.totalModules}</span>
            <span className="text-[10px] text-primary/80 font-mono">ALL PRO</span>
          </div>
          <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            <span>Full Suite Active</span>
          </div>
        </Link>

        {/* AI Personas KPI */}
        <Link
          to="/personas"
          className="rounded-xl border border-border/80 bg-card/40 hover:bg-card/70 hover:border-primary/40 p-4 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">AI Personas</span>
            <Bot className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{stats.totalPersonas}</span>
            <span className="text-[10px] text-purple-400 font-medium">Active</span>
          </div>
          <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-purple-400" />
            <span>Dynamic Memory</span>
          </div>
        </Link>

        {/* SMS Gateways KPI */}
        <Link
          to="/sms-hub"
          className="rounded-xl border border-border/80 bg-card/40 hover:bg-card/70 hover:border-primary/40 p-4 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">SMS Hub</span>
            <Smartphone className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{stats.configuredSms}</span>
            <span className="text-[10px] text-muted-foreground">providers</span>
          </div>
          <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>Auto-Registrar</span>
          </div>
        </Link>
      </div>

      {/* Quick Launch Studios Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Automation Studios & Power Tools</h2>
            <p className="text-xs text-muted-foreground">Dedicated workspaces for fast execution and high-volume workflows.</p>
          </div>
          <Link to="/modules" className="text-xs text-primary hover:underline flex items-center gap-1">
            <span>View all tools</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Studio 1: Audience & Scrapers */}
          <Link
            to="/scraper"
            className="rounded-2xl border border-border bg-card/40 p-5 hover:bg-card/70 hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                  <Compass className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold">Audience</span>
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">Scraper & Audience Studio</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Extract members from public/private chats, filter by last seen active status, scrape commentators, and clean databases.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-primary font-medium">
              <span>Open Scraper</span>
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          {/* Studio 2: Converter & Sessions */}
          <Link
            to="/converter"
            className="rounded-2xl border border-border bg-card/40 p-5 hover:bg-card/70 hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">Converter</span>
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">Session & TData Converter</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bidirectional Pyrogram / Telethon SQLite $\leftrightarrow$ Telegram Desktop `tdata` converter, session duplicator, and JSON generator.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-primary font-medium">
              <span>Open Converter</span>
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          {/* Studio 3: Booster & Warmup */}
          <Link
            to="/booster"
            className="rounded-2xl border border-border bg-card/40 p-5 hover:bg-card/70 hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold">Booster</span>
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">Account Booster & Warmup</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Simulate realistic human behavior, automated peer-to-peer dialogues, channel post scrolling, views boosting, and reaction spikes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-primary font-medium">
              <span>Open Booster</span>
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          {/* Studio 4: AI Personas */}
          <Link
            to="/personas"
            className="rounded-2xl border border-border bg-card/40 p-5 hover:bg-card/70 hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                  <Bot className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-semibold">Intelligence</span>
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">AI Personas & Autoresponder</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Build autonomous AI agents with specialized personalities, dynamic long-term memory, emotional states, and knowledge base files.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-primary font-medium">
              <span>Open AI Studio</span>
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          {/* Studio 5: Neuro-Text & Spintax */}
          <Link
            to="/neuro-text"
            className="rounded-2xl border border-border bg-card/40 p-5 hover:bg-card/70 hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">Neuro-Text</span>
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">Neuro-Text & Spintax Engine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate thousands of unique message variations, AI text paraphrasing, emoji randomization, and anti-spam uniqueness scoring.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-primary font-medium">
              <span>Open Neuro-Text</span>
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>

          {/* Studio 6: SMS Registrar */}
          <Link
            to="/sms-hub"
            className="rounded-2xl border border-border bg-card/40 p-5 hover:bg-card/70 hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:bg-pink-500/20 transition-colors">
                  <Smartphone className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 font-semibold">Registrar</span>
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">Universal SMS Registrar</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect 10+ SMS gateways (SMS-Activate, 5SIM, VakSMS, SMS-Man) for automated number ordering, SMS code polling, and 2FA setup.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-primary font-medium">
              <span>Open SMS Hub</span>
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* System Infrastructure & Engine Diagnostics */}
      <div className="rounded-2xl border border-border bg-card/30 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Desktop Architecture & Local Engine Health</h3>
          </div>
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Subprocess Running (PID: Embedded)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-background/60 border border-border/50">
            <div className="text-muted-foreground flex items-center gap-1.5 mb-1">
              <Radio className="h-3.5 w-3.5 text-primary" />
              <span>Backend Core</span>
            </div>
            <div className="font-semibold text-foreground">FastAPI 3.12 (Port 8765)</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Asynchronous MTProto dispatcher</div>
          </div>

          <div className="p-3.5 rounded-xl bg-background/60 border border-border/50">
            <div className="text-muted-foreground flex items-center gap-1.5 mb-1">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span>Local Storage</span>
            </div>
            <div className="font-semibold text-foreground">SQLite WAL Mode</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">%LOCALAPPDATA%\TelegramGeeks</div>
          </div>

          <div className="p-3.5 rounded-xl bg-background/60 border border-border/50">
            <div className="text-muted-foreground flex items-center gap-1.5 mb-1">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span>Credential Vault</span>
            </div>
            <div className="font-semibold text-foreground">Windows DPAPI Protected</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Hardware-bound encrypted tokens</div>
          </div>

          <div className="p-3.5 rounded-xl bg-background/60 border border-border/50">
            <div className="text-muted-foreground flex items-center gap-1.5 mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Anti-Detection</span>
            </div>
            <div className="font-semibold text-foreground">Level 5 Telemetry Defense</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Humanized typing & delay randomizer</div>
          </div>
        </div>
      </div>
    </div>
  );
}