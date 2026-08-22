"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Activity, Filter, Send, UserPlus, Sparkles, Wrench, BarChart3,
  ShieldCheck, Play, CheckCircle2, AlertCircle, RefreshCw, Layers, ArrowRight,
  Sliders, Smartphone, Copy, Folder, Shield, Calendar, Bot, Radio, Flame,
  FileText, Link as LinkIcon, Database, Cpu, Terminal, Eye, Download, Plus, Check, Loader2,
  Lock, Zap, Heart, MessageSquare, ChevronRight, Hash, Key, Clock, History
} from "lucide-react";
import { workflowApi, StageOverview, PipelineRun } from "@/lib/api/workflow";
import { useWorkflowPipeline } from "@/hooks/useWorkflowPipeline";
import { PipelineConsole } from "@/components/workflow/PipelineConsole";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const DEFAULT_WORKFLOW_STAGES = [
  {
    id: "stage-1",
    number: 1,
    name: "1. Provisioning",
    description: "Device Params, SMS OTP & TData",
    status: "ready",
    steps: [
      { id: "step-1-1", title: "Device Parameter Generator", operation: "generate_parameters" },
      { id: "step-1-2", title: "SMS Virtual Activation", operation: "sms_activate" },
      { id: "step-1-3", title: "TData & Session Conversion", operation: "convert_session" },
      { id: "step-1-4", title: "7-Folder Sorting & Health Check", operation: "folder_sort" }
    ]
  },
  {
    id: "stage-2",
    number: 2,
    name: "2. Warming",
    description: "30-Day Maturation & Trust-Score",
    status: "ready",
    steps: [
      { id: "step-2-1", title: "Activity Schedule Simulation", operation: "activity_schedule" },
      { id: "step-2-2", title: "Automated Story Publishing", operation: "publish_stories" },
      { id: "step-2-3", title: "Mutual P2P Conversation", operation: "p2p_conversation" },
      { id: "step-2-4", title: "Daily Trust Score Radar", operation: "trust_score_radar" }
    ]
  },
  {
    id: "stage-3",
    number: 3,
    name: "3. Intelligence",
    description: "Group Scraping & DB Enrichment",
    status: "ready",
    steps: [
      { id: "step-3-1", title: "Channel & Group Scraper", operation: "scrape_group_members" },
      { id: "step-3-2", title: "Post Comment Inspector", operation: "scrape_comments" },
      { id: "step-3-3", title: "Gender & Activity Filter", operation: "filter_gender_activity" },
      { id: "step-3-4", title: "Database Set Operations", operation: "db_set_operations" }
    ]
  },
  {
    id: "stage-4",
    number: 4,
    name: "4. Outreach",
    description: "Multi-Thread Spintax Messenger",
    status: "ready",
    steps: [
      { id: "step-4-1", title: "Nested Spintax Engine", operation: "resolve_spintax" },
      { id: "step-4-2", title: "Multi-Account DM Dispatcher", operation: "dispatch_mass_dm" },
      { id: "step-4-3", title: "Adaptive FloodWait Bus", operation: "flood_wait_handler" },
      { id: "step-4-4", title: "2-Way CRM Lead Forwarder", operation: "crm_forwarder" }
    ]
  },
  {
    id: "stage-5",
    number: 5,
    name: "5. Inviter",
    description: "TelegramInviter V1-V3 Suite",
    status: "ready",
    steps: [
      { id: "step-5-1", title: "Invite by ID / Username (V1)", operation: "invite_v1" },
      { id: "step-5-2", title: "Admin Promotion Inviter (V2)", operation: "invite_v2" },
      { id: "step-5-3", title: "Mutual Contact Inviter (V3)", operation: "invite_v3" },
      { id: "step-5-4", title: "Daily 50-Invite Cap Safety Guard", operation: "invite_safety_cap" }
    ]
  },
  {
    id: "stage-6",
    number: 6,
    name: "6. Engagement",
    description: "TelegramBooster Views & Waves",
    status: "ready",
    steps: [
      { id: "step-6-1", title: "Emoji Reaction Booster", operation: "boost_reactions" },
      { id: "step-6-2", title: "Post View Multiplier", operation: "boost_views" },
      { id: "step-6-3", title: "Poll Voting & Quiz Booster", operation: "boost_poll_votes" },
      { id: "step-6-4", title: "Multi-Channel Cross-Commenter", operation: "cross_commenter" }
    ]
  },
  {
    id: "stage-7",
    number: 7,
    name: "7. Automation",
    description: "@BotFather Bot & Channel Cloner",
    status: "ready",
    steps: [
      { id: "step-7-1", title: "Automated BotFather Bot Creator", operation: "create_botfather_bot" },
      { id: "step-7-2", title: "PostBot Inline Button Builder", operation: "build_postbot_buttons" },
      { id: "step-7-3", title: "Full Channel History Cloner", operation: "clone_channel_history" },
      { id: "step-7-4", title: "Automated Anti-Spam Reporter", operation: "dispatch_abuse_report" }
    ]
  },
  {
    id: "stage-8",
    number: 8,
    name: "8. Telemetry",
    description: "Real-Time Telemetry & Radar",
    status: "ready",
    steps: [
      { id: "step-8-1", title: "Real-Time Activity Radar", operation: "telemetry_radar" },
      { id: "step-8-2", title: "Account Portfolio Health Heatmap", operation: "health_heatmap" },
      { id: "step-8-3", title: "Campaign Conversion Funnel", operation: "conversion_funnel" },
      { id: "step-8-4", title: "Interactive ROI Calculator", operation: "roi_calculator" }
    ]
  },
  {
    id: "stage-9",
    number: 9,
    name: "9. Governance",
    description: "HWID Cryptographic Licensing",
    status: "ready",
    steps: [
      { id: "step-9-1", title: "HWID Hardware Signature Binding", operation: "hwid_bind" },
      { id: "step-9-2", title: "Ed25519 License Verification", operation: "verify_license" },
      { id: "step-9-3", title: "USDT / TON Payout Settlements", operation: "crypto_payout" },
      { id: "step-9-4", title: "Role-Based Access Control Audit", operation: "rbac_audit" }
    ]
  }
];

export default function MasterWorkflowPage() {
  const router = useRouter();
  const [stages, setStages] = useState<any[]>(DEFAULT_WORKFLOW_STAGES);
  const [telemetry, setTelemetry] = useState<StageOverview["telemetry"] | null>(null);
  const [activeStageId, setActiveStageId] = useState<string>("stage-1");
  const [loading, setLoading] = useState(false);
  const [executingStep, setExecutingStep] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [pastRuns, setPastRuns] = useState<PipelineRun[]>([]);

  // Pipeline hook with SSE stream
  const { run, loading: pipelineLoading, error: pipelineError, launch, cancel, pause, resume, setRun } = useWorkflowPipeline();

  // Stage-specific Form States
  // Stage 1
  const [paramMode, setParamMode] = useState<"Beginner" | "Professional">("Beginner");
  const [paramCount, setParamCount] = useState(10);
  const [regMethod, setRegMethod] = useState<"auto" | "manual" | "import">("auto");
  const [activeFolderTab, setActiveFolderTab] = useState<string>("Active");

  // Stage 2: Warming Engine
  const [warmDays, setWarmDays] = useState(14);
  const [warmMinDelay, setWarmMinDelay] = useState(30);
  const [warmMaxDelay, setWarmMaxDelay] = useState(120);
  const [warmupJobs, setWarmupJobs] = useState<any[]>([]);
  const [loadingWarmup, setLoadingWarmup] = useState(false);

  // Stage 3
  const [scrapeSource, setScrapeSource] = useState("https://t.me/CryptoAlphaGems");
  const [scrapeLimit, setScrapeLimit] = useState(50);
  const [genderFilter, setGenderFilter] = useState("all");

  // Stage 4
  const [spintaxText, setSpintaxText] = useState("{Hi|Hey|Hello} {name}! Check out our updated channel updates!");
  const [campaignTargetsCount, setCampaignTargetsCount] = useState(50);

  // Stage 5: Inviting Engine
  const [inviteMethod, setInviteMethod] = useState<"v1" | "v2" | "v3">("v1");
  const [targetGroupLink, setTargetGroupLink] = useState("https://t.me/CryptoAlphaGems");
  const [targetUserIds, setTargetUserIds] = useState("182939102\n591829381\n918273645\n482719283");
  const [inviteDelayMin, setInviteDelayMin] = useState(15);
  const [inviteDelayMax, setInviteDelayMax] = useState(45);
  const [inviteJobs, setInviteJobs] = useState<any[]>([]);
  const [loadingInvite, setLoadingInvite] = useState(false);

  // Stage 6
  const [reactionPost, setReactionPost] = useState("https://t.me/telegramgeeks/42");
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(["👍", "🔥", "❤️"]);

  // Stage 7
  const [botName, setBotName] = useState("GeeksAutoBot");

  // Stage 9
  const [licenseTier, setLicenseTier] = useState("pro");
  const [licenseHWID, setLicenseHWID] = useState("HWID-8821-TG-PRO");

  useEffect(() => {
    fetchWorkflowData();
    fetchHistory();
  }, []);

  async function fetchWorkflowData() {
    try {
      const data = await workflowApi.getStages();
      if (data && data.stages && data.stages.length > 0) {
        setStages(data.stages);
      }
      if (data && data.telemetry) {
        setTelemetry(data.telemetry);
      }
    } catch (err) {
      console.error("Failed to load workflow data", err);
    }
  }

  async function fetchHistory() {
    try {
      const data = await workflowApi.getPipelines(10);
      setPastRuns(data.runs || []);
    } catch {
      // ignore
    }
  }

  async function fetchWarmupJobs() {
    try {
      setLoadingWarmup(true);
      const res = await api.get("/warmup/jobs");
      setWarmupJobs(res.data.jobs || []);
    } catch {
      setWarmupJobs([]);
    } finally {
      setLoadingWarmup(false);
    }
  }

  async function fetchInviteJobs() {
    try {
      setLoadingInvite(true);
      const res = await api.get("/inviter/jobs");
      setInviteJobs(res.data.jobs || []);
    } catch {
      setInviteJobs([]);
    } finally {
      setLoadingInvite(false);
    }
  }

  useEffect(() => {
    if (activeStageId === "stage-2") {
      fetchWarmupJobs();
    } else if (activeStageId === "stage-5") {
      fetchInviteJobs();
    }
  }, [activeStageId]);

  async function handleStartWarmup() {
    try {
      await api.post("/warmup/start", {
        account_ids: ["1", "2"],
        duration_days: warmDays,
        interval_min: warmMinDelay,
        interval_max: warmMaxDelay,
      });
      await fetchWarmupJobs();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleStopWarmup(accId: string) {
    try {
      await api.post("/warmup/stop", { account_ids: [accId] });
      await fetchWarmupJobs();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleLaunchInvite() {
    try {
      const uids = targetUserIds.split("\n").map((x) => parseInt(x.trim())).filter((n) => !isNaN(n));
      await api.post("/inviter/invite", {
        target_group: targetGroupLink,
        user_ids: uids.length > 0 ? uids : [182939102, 591829381],
        method: inviteMethod === "v1" ? "standard" : inviteMethod === "v2" ? "admin" : "link",
        delay_min: inviteDelayMin,
        delay_max: inviteDelayMax,
      });
      await fetchInviteJobs();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRunStep(stageNum: number, stepId: string, operation?: string, params?: any) {
    try {
      setExecutingStep(stepId);
      setExecutionResult(null);
      const res = await workflowApi.runStep(stageNum, stepId, operation, params || {});
      setExecutionResult(res);
      await fetchWorkflowData();
    } catch (err: any) {
      setExecutionResult({
        status: "error",
        message: err.response?.data?.detail || err.message || "Execution error",
      });
    } finally {
      setExecutingStep(null);
    }
  }

  async function handleLaunchFullPipeline() {
    await launch([1, 2, 3, 4, 5, 6, 7, 8, 9], "Auto-Pilot Full Operations Pipeline");
    fetchHistory();
  }

  const activeStage = stages.find((s) => s.id === activeStageId) || stages[0];

  const stageIcons: Record<number, any> = {
    1: Users,
    2: Activity,
    3: Filter,
    4: Send,
    5: UserPlus,
    6: Sparkles,
    7: Wrench,
    8: BarChart3,
    9: ShieldCheck,
  };

  if (loading && stages.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-9 w-9 animate-spin text-primary mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">Loading Master Operational Workflow v2.0...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary tracking-wide uppercase mb-2">
            🚀 Master Operational Workflow v2.0
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Full System Operations Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            End-to-end 9-stage execution suite: Provisioning → Warming → Parsing → Outreach → Invites → Boosting → Utilities → Telemetry → Governance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchWorkflowData(); fetchHistory(); }}
            className="p-2.5 rounded-xl bg-secondary border border-border hover:bg-surface text-muted-foreground hover:text-foreground transition-all shadow-sm flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh Telemetry
          </button>

          <button
            onClick={handleLaunchFullPipeline}
            disabled={pipelineLoading || run?.status === "running"}
            className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:opacity-95 transition-all text-sm disabled:opacity-50"
          >
            {pipelineLoading || run?.status === "running" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            {pipelineLoading || run?.status === "running" ? "Auto-Pilot Running..." : "Run Auto-Pilot Pipeline"}
          </button>
        </div>
      </div>

      {/* Real-time Platform Telemetry Cards */}
      {telemetry && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Active Accounts</p>
            <div className="text-2xl font-extrabold text-foreground mt-1">{telemetry.active_accounts || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">of {telemetry.total_accounts || 0} total</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Warming Pool</p>
            <div className="text-2xl font-extrabold text-warning mt-1">{telemetry.warming_accounts || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Auto-Warming</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Avg Trust Score</p>
            <div className="text-2xl font-extrabold text-primary mt-1">{telemetry.avg_trust_score || 0}%</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">MTProto Baseline</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Active Proxies</p>
            <div className="text-2xl font-extrabold text-foreground mt-1">{telemetry.active_proxies || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">of {telemetry.total_proxies || 0} pooled</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Outreach Campaigns</p>
            <div className="text-2xl font-extrabold text-foreground mt-1">{telemetry.running_campaigns || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Live streams</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Licenses Granted</p>
            <div className="text-2xl font-extrabold text-accent mt-1">{telemetry.total_licenses || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">HWID Bound</p>
          </div>
        </div>
      )}

      {/* FloodWait Indicator (if any account is currently flooded) */}
      {telemetry?.flooded_accounts && telemetry.flooded_accounts.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">
                FloodWait Bus Active ({telemetry.flooded_accounts.length} accounts in cooldown)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Auto-guard is safely delaying tasks to protect session integrity.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {telemetry.flooded_accounts.map((f, i) => (
              <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-warning/20 text-warning border border-warning/30">
                Acc #{f.account_id}: {f.seconds_remaining}s
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live Pipeline Console with SSE Feed */}
      {(run || pipelineLoading) && (
        <PipelineConsole
          run={run}
          loading={pipelineLoading}
          onCancel={cancel}
          onPause={pause}
          onResume={resume}
        />
      )}

      {/* ─── FULL SYSTEM WORKFLOW MAP (Interactive DAG Navigation) ─── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Full System Workflow Map (9-Stage Flow)
          </h2>
          <span className="text-xs text-muted-foreground">Select a stage below to open its dedicated command console</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
          {stages.map((st) => {
            const isSelected = st.id === activeStageId;
            const IconComponent = stageIcons[st.number] || Users;
            return (
              <div
                key={st.id}
                onClick={() => setActiveStageId(st.id)}
                className={cn(
                  "p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group relative",
                  isSelected
                    ? "bg-primary/10 border-primary shadow-md shadow-primary/15"
                    : "bg-secondary/70 border-border hover:border-primary/40 hover:bg-surface"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-[10px] font-extrabold px-1.5 py-0.5 rounded-md",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
                    )}>
                      ST-{st.number}
                    </span>
                    <IconComponent className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-110",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <h3 className="text-xs font-bold text-foreground line-clamp-2">{st.name.replace(" Pipeline", "")}</h3>
                </div>

                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{st.steps?.length || 0} Steps</span>
                  <ChevronRight className={cn(
                    "h-3 w-3 transition-transform",
                    isSelected ? "text-primary translate-x-0.5" : "text-muted-foreground"
                  )} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── ACTIVE STAGE COMMAND CONSOLE ─── */}
      {activeStage && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          {/* Stage Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-extrabold text-lg">
                {activeStage.number}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-foreground">
                  STAGE {activeStage.number} — {activeStage.name.toUpperCase()}
                </h2>
                <p className="text-xs text-primary font-medium mt-0.5 italic">"{activeStage.tagline}"</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground">
                {activeStage.status_badge || "Ready"}
              </span>
            </div>
          </div>

          {/* Dynamic Stage Body */}
          {/* ════════ STAGE 1: ACCOUNT PROVISIONING ════════ */}
          {activeStage.number === 1 && (
            <div className="space-y-6">
              {/* STEP 1A: Parameter Generation */}
              <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/60">
                  <div>
                    <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 1A</span>
                    <h3 className="text-sm font-bold text-foreground">Parameter Generation</h3>
                  </div>
                  <div className="flex items-center bg-card p-1 rounded-lg border border-border">
                    <button
                      onClick={() => setParamMode("Beginner")}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                        paramMode === "Beginner" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Beginner Mode
                    </button>
                    <button
                      onClick={() => setParamMode("Professional")}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                        paramMode === "Professional" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Professional Mode (1M DB)
                    </button>
                  </div>
                </div>

                {paramMode === "Beginner" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Country / Region</label>
                      <select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground">
                        <option>United States (+1)</option>
                        <option>United Kingdom (+44)</option>
                        <option>Germany (+49)</option>
                        <option>Brazil (+55)</option>
                        <option>Global Mix</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Device Fingerprint Pool</label>
                      <select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground">
                        <option>Android Flagships (Samsung S24, Pixel 8)</option>
                        <option>Android Mid-range (Xiaomi, OnePlus)</option>
                        <option>Telegram Desktop (Windows 11)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Generate Count</label>
                      <input
                        type="number"
                        value={paramCount}
                        onChange={(e) => setParamCount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">API ID / Hash Pool</label>
                        <input defaultValue="Official Android Hash" className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">App Version Matrix</label>
                        <input defaultValue="10.14.5 (4821)" className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">System Language</label>
                        <input defaultValue="en-US / de-DE / pt-BR" className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">DB Size Limit</label>
                        <input defaultValue="Up to 1,000,000 rows" disabled className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border text-xs text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">Export as: session+json | SQLite DB | CSV</span>
                  <button
                    onClick={() => handleRunStep(1, "1A", paramMode === "Beginner" ? "generate_beginner" : "generate_professional", { count: paramCount })}
                    disabled={executingStep === "1A"}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 transition-all shadow-sm"
                  >
                    {executingStep === "1A" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sliders className="h-3.5 w-3.5" />}
                    Generate Parameters
                  </button>
                </div>
              </div>

              {/* STEP 1B: Account Registration */}
              <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/60">
                  <div>
                    <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 1B</span>
                    <h3 className="text-sm font-bold text-foreground">Account Registration Methods</h3>
                  </div>
                  <div className="flex items-center bg-card p-1 rounded-lg border border-border text-xs">
                    <button
                      onClick={() => setRegMethod("auto")}
                      className={cn("px-2.5 py-1 rounded-md font-bold transition-all", regMethod === "auto" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                    >
                      [A] Auto-Registrar (SMS API)
                    </button>
                    <button
                      onClick={() => setRegMethod("manual")}
                      className={cn("px-2.5 py-1 rounded-md font-bold transition-all", regMethod === "manual" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                    >
                      [B] Manual (SIM)
                    </button>
                    <button
                      onClick={() => setRegMethod("import")}
                      className={cn("px-2.5 py-1 rounded-md font-bold transition-all", regMethod === "import" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                    >
                      [C] Import Sessions
                    </button>
                  </div>
                </div>

                {regMethod === "auto" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">SMS Provider</label>
                      <select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground">
                        <option>SMS-Activate.org</option>
                        <option>GrizzlySMS</option>
                        <option>SMS Bower</option>
                        <option>5SIM.net</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Verification Method</label>
                      <select className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground">
                        <option>SMS Text Message</option>
                        <option>Voice Call Verification</option>
                        <option>Flash-Call (Auto-Detect)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Auto 2FA Password & Refund</label>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-xs text-primary font-bold">Enabled (Auto-refund on fail)</span>
                      </div>
                    </div>
                  </div>
                )}

                {regMethod === "manual" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">SIM Phone Number</label>
                      <input placeholder="+1 (555) 019-2834" className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Profile Name & Bio</label>
                      <input placeholder="Elena / Web3 Growth" className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Format</label>
                      <input value="Auto-save to session+json" disabled className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border text-sm text-muted-foreground" />
                    </div>
                  </div>
                )}

                {regMethod === "import" && (
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center space-y-2 hover:border-primary/40 transition-colors">
                    <Download className="h-8 w-8 text-primary mx-auto" />
                    <p className="text-sm font-semibold text-foreground">Drop session+json, TDATA folders, or QR code exports here</p>
                    <p className="text-xs text-muted-foreground">Supports batch import via directory drop with auto-binding</p>
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <button
                    onClick={() => handleRunStep(1, "1B", "register_account", { method: regMethod })}
                    disabled={executingStep === "1B"}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 transition-all shadow-sm"
                  >
                    {executingStep === "1B" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Smartphone className="h-3.5 w-3.5" />}
                    Execute Registration Flow
                  </button>
                </div>
              </div>

              {/* STEP 1C: Session Format Management & 1D Smart Folders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-3">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 1C</span>
                  <h3 className="text-sm font-bold text-foreground">Session Format Management</h3>
                  <p className="text-xs text-muted-foreground">TDATA conversion, duplicate session protection, JSON generation, and multi-format backup.</p>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleRunStep(1, "1C", "convert_session_to_tdata")}
                      className="p-2.5 rounded-lg bg-card border border-border text-xs font-bold text-foreground hover:border-primary/40 text-left"
                    >
                      Convert to TDATA →
                    </button>
                    <button
                      onClick={() => handleRunStep(1, "1C", "duplicate_session")}
                      className="p-2.5 rounded-lg bg-card border border-border text-xs font-bold text-foreground hover:border-primary/40 text-left"
                    >
                      Clone Session →
                    </button>
                  </div>
                </div>

                <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-3">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 1D</span>
                  <h3 className="text-sm font-bold text-foreground">Smart Folder Distribution</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {["Active", "Temp SpamBlock", "Perm Ban", "Frozen", "Premium", "Archive", "Deleted"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setActiveFolderTab(f)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-bold transition-all border",
                          activeFolderTab === f ? "bg-primary/20 border-primary text-primary" : "bg-card border-border text-muted-foreground"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleRunStep(1, "1D", "get_folder_summary")}
                    className="w-full mt-2 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-95"
                  >
                    Refresh Smart Folders & Run Status Checks
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STAGE 2: HEALTH & WARMING ════════ */}
          {activeStage.number === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-3">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 2A</span>
                  <h3 className="text-sm font-bold text-foreground">Bulk MTProto Status Check</h3>
                  <p className="text-xs text-muted-foreground">Ping all registered accounts, detect active Telegram sessions, auto-sort into smart folders, and handle FloodWait limits.</p>
                  <button
                    onClick={() => handleRunStep(2, "2A", "check_all_accounts")}
                    disabled={executingStep === "2A"}
                    className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95"
                  >
                    {executingStep === "2A" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                    Run Bulk Status Check on All Accounts
                  </button>
                </div>

                <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-3">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 2B</span>
                  <h3 className="text-sm font-bold text-foreground">Proxy Binding & Health</h3>
                  <p className="text-xs text-muted-foreground">Assign SOCKS5/HTTP/MTProxy per account with auto-rotation rules and liveness health checks.</p>
                  <button
                    onClick={() => handleRunStep(2, "2B", "check_proxies")}
                    disabled={executingStep === "2B"}
                    className="w-full py-2.5 rounded-lg bg-card border border-border hover:border-primary/40 text-foreground text-xs font-bold flex items-center justify-center gap-2"
                  >
                    {executingStep === "2B" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4 text-primary" />}
                    Test Proxy Liveness & Rotate Failed
                  </button>
                </div>
              </div>

              <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 2C</span>
                    <h3 className="text-sm font-bold text-foreground">Account Booster (Smart AI Warming)</h3>
                  </div>
                  <button
                    onClick={fetchWarmupJobs}
                    className="p-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", loadingWarmup && "animate-spin")} />
                    Refresh
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Configure progressive warming schedule with human-paced natural behavior and Neuro-Text AI dialogues.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Warming Duration: {warmDays} Days</label>
                    <input
                      type="range" min={3} max={30} value={warmDays}
                      onChange={(e) => setWarmDays(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Message Interval (Min / Max s)</label>
                    <div className="flex items-center gap-2">
                      <input value={warmMinDelay} onChange={(e) => setWarmMinDelay(Number(e.target.value))} className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground" />
                      <span className="text-xs text-muted-foreground">-</span>
                      <input value={warmMaxDelay} onChange={(e) => setWarmMaxDelay(Number(e.target.value))} className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Automated Actions</label>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">Like Posts</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">Join Groups</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">React Stories</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handleStartWarmup}
                    disabled={loadingWarmup}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 shadow-md shadow-primary/20"
                  >
                    <Zap className="h-4 w-4" />
                    Start Smart Warming Cycle
                  </button>
                </div>

                {/* Live Warmup Jobs Table */}
                <div className="mt-4 pt-4 border-t border-border/60">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-primary" /> Active Warmup Jobs ({warmupJobs.length})
                    </h4>
                  </div>

                  {warmupJobs.length === 0 ? (
                    <div className="p-4 rounded-lg bg-card/50 border border-border/60 text-center text-xs text-muted-foreground">
                      No active warmup jobs running. Click "Start Smart Warming Cycle" above to begin.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {warmupJobs.map((job) => (
                        <div key={job.id} className="p-3 rounded-lg bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">Account #{job.account_id}</span>
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-black uppercase",
                                job.status === "running" ? "bg-primary/20 text-primary border border-primary/30" :
                                job.status === "completed" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                "bg-muted text-muted-foreground border border-border"
                              )}>
                                {job.status}
                              </span>
                              <span className="text-muted-foreground text-[11px]">Interval: {job.interval_range}</span>
                            </div>
                            <div className="text-muted-foreground text-[11px]">
                              Actions Completed: <span className="font-bold text-foreground">{job.actions_completed}</span> | Duration: {job.duration_days} days
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {job.status === "running" && (
                              <button
                                onClick={() => handleStopWarmup(job.account_id)}
                                className="px-2.5 py-1 rounded bg-destructive/10 text-destructive border border-destructive/20 font-bold hover:bg-destructive/20 text-[11px]"
                              >
                                Stop Job
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════ STAGE 3: AUDIENCE PARSER & VALIDATOR ════════ */}
          {activeStage.number === 3 && (
            <div className="space-y-6">
              <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-4">
                <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 3A</span>
                <h3 className="text-sm font-bold text-foreground">Audience Parser / Scraper</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Source Channel / Group Link</label>
                    <input
                      value={scrapeSource}
                      onChange={(e) => setScrapeSource(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Target Limit</label>
                    <input
                      type="number"
                      value={scrapeLimit}
                      onChange={(e) => setScrapeLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">AI Gender Filter</label>
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground"
                    >
                      <option value="all">All Targets</option>
                      <option value="male">Male Only (AI Detected)</option>
                      <option value="female">Female Only (AI Detected)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">Auto-excludes bots and inactive accounts (&gt;30d)</span>
                  <button
                    onClick={() => handleRunStep(3, "3A", "collect_from_comments", { source: scrapeSource, limit: scrapeLimit, gender: genderFilter })}
                    disabled={executingStep === "3A"}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 shadow-md shadow-primary/20"
                  >
                    {executingStep === "3A" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                    Scrape Precision Audience
                  </button>
                </div>
              </div>

              <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 3B</span>
                  <h3 className="text-sm font-bold text-foreground">Number / Link Checker</h3>
                  <p className="text-xs text-muted-foreground">Validate phone number database against live Telegram registration status.</p>
                </div>
                <button
                  onClick={() => handleRunStep(3, "3B", "check_numbers_batch")}
                  className="px-4 py-2 rounded-lg bg-card border border-border text-xs font-bold text-foreground hover:border-primary/40"
                >
                  Check Phone Number Database →
                </button>
              </div>
            </div>
          )}

          {/* ════════ STAGE 4: MASS MESSAGING & CAMPAIGNS ════════ */}
          {activeStage.number === 4 && (
            <div className="space-y-6">
              <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-4">
                <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 4A</span>
                <h3 className="text-sm font-bold text-foreground">Campaign Message Composer (Spintax + GPT Uniqueizer)</h3>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Spintax Template</label>
                  <textarea
                    rows={3}
                    value={spintaxText}
                    onChange={(e) => setSpintaxText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Target Recipients</label>
                    <input
                      type="number"
                      value={campaignTargetsCount}
                      onChange={(e) => setCampaignTargetsCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Safety Delays</label>
                    <input defaultValue="30-120 seconds (Randomized)" disabled className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border text-sm text-muted-foreground" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">FloodWait Auto-Guard</label>
                    <div className="pt-2 text-xs font-bold text-primary">Active (Auto-pause + Resume)</div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={() => handleRunStep(4, "4A", "send_to_database", { template: spintaxText, target_count: campaignTargetsCount })}
                    disabled={executingStep === "4A"}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 shadow-md shadow-primary/20"
                  >
                    {executingStep === "4A" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Launch Outreach Campaign
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-3">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 4B</span>
                  <h3 className="text-sm font-bold text-foreground">Autoposting & Neural Commenting</h3>
                  <p className="text-xs text-muted-foreground">Schedule cross-channel broadcasts and deploy GPT contextual comments on posts.</p>
                  <button
                    onClick={() => handleRunStep(4, "4B", "post_to_channels")}
                    className="w-full py-2 rounded-lg bg-card border border-border text-xs font-bold text-foreground hover:border-primary/40"
                  >
                    Configure Autoposting Schedules →
                  </button>
                </div>

                <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-3">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 4C</span>
                  <h3 className="text-sm font-bold text-foreground">Autoresponder & Unified Inbox</h3>
                  <p className="text-xs text-muted-foreground">Forward client responses to team work groups and catch high-intent keywords.</p>
                  <button
                    onClick={() => handleRunStep(4, "4C", "start_monitoring")}
                    className="w-full py-2 rounded-lg bg-card border border-border text-xs font-bold text-foreground hover:border-primary/40"
                  >
                    Start AI Autoresponder Engine →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STAGE 5: INVITING PIPELINE ════════ */}
          {activeStage.number === 5 && (
            <div className="space-y-6">
              <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 5A</span>
                    <h3 className="text-sm font-bold text-foreground">Invite Engine (V1 / V2 / V3)</h3>
                  </div>
                  <button
                    onClick={fetchInviteJobs}
                    className="p-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", loadingInvite && "animate-spin")} />
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setInviteMethod("v1")}
                    className={cn("p-4 rounded-xl border text-left transition-all", inviteMethod === "v1" ? "bg-primary/10 border-primary" : "bg-card border-border")}
                  >
                    <h4 className="font-bold text-sm text-foreground">[V1] Standard Invite</h4>
                    <p className="text-xs text-muted-foreground mt-1">Directly invite from parsed target user list.</p>
                  </button>
                  <button
                    onClick={() => setInviteMethod("v2")}
                    className={cn("p-4 rounded-xl border text-left transition-all", inviteMethod === "v2" ? "bg-primary/10 border-primary" : "bg-card border-border")}
                  >
                    <h4 className="font-bold text-sm text-foreground">[V2] Admin Bypass</h4>
                    <p className="text-xs text-muted-foreground mt-1">Bypass restricted group invite limits via admin.</p>
                  </button>
                  <button
                    onClick={() => setInviteMethod("v3")}
                    className={cn("p-4 rounded-xl border text-left transition-all", inviteMethod === "v3" ? "bg-primary/10 border-primary" : "bg-card border-border")}
                  >
                    <h4 className="font-bold text-sm text-foreground">[V3] Link-Based Invite</h4>
                    <p className="text-xs text-muted-foreground mt-1">Enforce strict 1 account : 1 link ratio.</p>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Target Group Link / Username</label>
                    <input
                      value={targetGroupLink}
                      onChange={(e) => setTargetGroupLink(e.target.value)}
                      placeholder="https://t.me/CryptoAlphaGems"
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Delay Interval ({inviteDelayMin} - {inviteDelayMax}s)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={inviteDelayMin}
                        onChange={(e) => setInviteDelayMin(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-xs text-foreground"
                      />
                      <span className="text-xs text-muted-foreground">-</span>
                      <input
                        type="number"
                        value={inviteDelayMax}
                        onChange={(e) => setInviteDelayMax(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-xs text-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Target User IDs (one per line)</label>
                  <textarea
                    value={targetUserIds}
                    onChange={(e) => setTargetUserIds(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono text-foreground"
                  />
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handleLaunchInvite}
                    disabled={loadingInvite}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 shadow-md shadow-primary/20"
                  >
                    <UserPlus className="h-4 w-4" />
                    Launch Telegram Inviter Engine
                  </button>
                </div>

                {/* Live Invite Jobs Table */}
                <div className="mt-4 pt-4 border-t border-border/60">
                  <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5 text-primary" /> Recent Invite Jobs ({inviteJobs.length})
                  </h4>

                  {inviteJobs.length === 0 ? (
                    <div className="p-4 rounded-lg bg-card/50 border border-border/60 text-center text-xs text-muted-foreground">
                      No invite jobs executed yet. Configure targets and click "Launch Telegram Inviter Engine".
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {inviteJobs.map((j) => (
                        <div key={j.id} className="p-3 rounded-lg bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{j.target_group}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-primary/20 text-primary border border-primary/30">
                                {j.method}
                              </span>
                              <span className="text-muted-foreground text-[11px]">{j.status}</span>
                            </div>
                            <div className="text-muted-foreground text-[11px]">
                              Invited: <span className="font-bold text-emerald-400">{j.invited}</span> | Failed: <span className="font-bold text-destructive">{j.failed}</span> | Total: {j.total_targets}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-36">
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${j.progress_pct}%` }} />
                            </div>
                            <span className="text-[11px] font-bold text-foreground">{j.progress_pct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════ STAGE 6: ENGAGEMENT BOOSTING ════════ */}
          {activeStage.number === 6 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-4">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 6A</span>
                  <h3 className="text-sm font-bold text-foreground">Reaction Booster</h3>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Target Post Link</label>
                    <input
                      value={reactionPost}
                      onChange={(e) => setReactionPost(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Emojis</label>
                    <div className="flex items-center gap-2">
                      {["👍", "❤️", "🔥", "🎉", "😮", "🚀"].map((em) => (
                        <span key={em} className="text-xl p-2 rounded-lg bg-card border border-border cursor-pointer hover:border-primary">
                          {em}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRunStep(6, "6A", "add_reaction", { post_link: reactionPost, reactions: selectedEmojis })}
                    disabled={executingStep === "6A"}
                    className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2"
                  >
                    {executingStep === "6A" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
                    Boost Post Reactions
                  </button>
                </div>

                <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-4">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Step 6C</span>
                  <h3 className="text-sm font-bold text-foreground">Channel & Chat Cloner</h3>
                  <p className="text-xs text-muted-foreground">Clone messages, media, and member structures with protected content bypass.</p>
                  <input placeholder="https://t.me/SourceChannelToClone" className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground" />
                  <button
                    onClick={() => handleRunStep(6, "6C", "clone_channel")}
                    className="w-full py-2.5 rounded-lg bg-card border border-border text-xs font-bold text-foreground hover:border-primary/40"
                  >
                    Initiate Channel Cloner →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STAGE 7: UTILITY & POWER TOOLS ════════ */}
          {activeStage.number === 7 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-3">
                <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Tool 7A</span>
                <h3 className="text-sm font-bold text-foreground">Bot Creator</h3>
                <input value={botName} onChange={(e) => setBotName(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground" />
                <button
                  onClick={() => handleRunStep(7, "7A", "create_bot", { name: botName })}
                  className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
                >
                  Create Bot via BotFather →
                </button>
              </div>

              <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-3">
                <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Tool 7B</span>
                <h3 className="text-sm font-bold text-foreground">Reporter Module</h3>
                <p className="text-xs text-muted-foreground">Mass parallel complaint reporting for spam / fake entities.</p>
                <button
                  onClick={() => handleRunStep(7, "7B", "mass_report")}
                  className="w-full py-2 rounded-lg bg-card border border-border text-xs font-bold text-foreground hover:border-primary/40"
                >
                  Run Reporter Flow →
                </button>
              </div>

              <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-3">
                <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Tool 7C</span>
                <h3 className="text-sm font-bold text-foreground">Contact Manager</h3>
                <p className="text-xs text-muted-foreground">Mass add contacts and sync contact books across accounts.</p>
                <button
                  onClick={() => handleRunStep(7, "7C", "export_contacts")}
                  className="w-full py-2 rounded-lg bg-card border border-border text-xs font-bold text-foreground hover:border-primary/40"
                >
                  Sync Contact Books →
                </button>
              </div>
            </div>
          )}

          {/* ════════ STAGE 8: ANALYTICS & MONITORING ════════ */}
          {activeStage.number === 8 && (
            <div className="space-y-6">
              <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Stage 8 Telemetry</span>
                    <h3 className="text-sm font-bold text-foreground">Account Health & Campaign Heatmap</h3>
                  </div>
                  <button
                    onClick={() => handleRunStep(8, "8A", "get_report")}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
                  >
                    Refresh Telemetry
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-card p-3 rounded-lg border border-border">
                    <span className="text-xs text-muted-foreground block">Health Score Baseline</span>
                    <span className="text-xl font-bold text-primary">94.2%</span>
                  </div>
                  <div className="bg-card p-3 rounded-lg border border-border">
                    <span className="text-xs text-muted-foreground block">7-Day Ban Rate</span>
                    <span className="text-xl font-bold text-foreground">0.8%</span>
                  </div>
                  <div className="bg-card p-3 rounded-lg border border-border">
                    <span className="text-xs text-muted-foreground block">Spam Risk Index</span>
                    <span className="text-xl font-bold text-primary">Low (2.4%)</span>
                  </div>
                  <div className="bg-card p-3 rounded-lg border border-border">
                    <span className="text-xs text-muted-foreground block">24h Outreach Success</span>
                    <span className="text-xl font-bold text-foreground">98.7%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STAGE 9: ADMIN & LICENSE CONTROL HUB ════════ */}
          {activeStage.number === 9 && (
            <div className="space-y-6">
              <div className="bg-secondary/60 rounded-xl p-5 border border-border/80 space-y-4">
                <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">Stage 9 Governance</span>
                <h3 className="text-sm font-bold text-foreground">License Engine & HWID Binding</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">License Tier</label>
                    <select
                      value={licenseTier}
                      onChange={(e) => setLicenseTier(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground"
                    >
                      <option value="starter">Starter Plan ($29/mo)</option>
                      <option value="pro">Pro Plan ($79/mo)</option>
                      <option value="agency">Agency Lifetime ($1,990)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Target HWID</label>
                    <input
                      value={licenseHWID}
                      onChange={(e) => setLicenseHWID(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Crypto Deposit Gateways</label>
                    <div className="pt-2 flex gap-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">SOL</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">ETH</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">BTC</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">USDT</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={() => handleRunStep(9, "9A", "check_license", { tier: licenseTier, hwid: licenseHWID })}
                    className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
                  >
                    Generate & Bind License Key →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── LIVE STEP EXECUTION RESULT DRAWER ─── */}
          {executionResult && (
            <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Execution Result (Step {executionResult.step_id || "Active"})
                </span>
                <span className="text-[11px] text-muted-foreground">{executionResult.timestamp || ""}</span>
              </div>
              <div className="bg-secondary/90 rounded-lg p-3 font-mono text-xs text-foreground/90 overflow-x-auto">
                <pre>{JSON.stringify(executionResult.result || executionResult, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PAST PIPELINE RUNS HISTORY TABLE ─── */}
      {pastRuns.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Pipeline Execution History
            </h3>
            <button
              onClick={fetchHistory}
              className="text-xs text-primary font-bold hover:underline"
            >
              Refresh History
            </button>
          </div>

          <div className="divide-y divide-border/60">
            {pastRuns.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    r.status === "completed" ? "bg-emerald-400" :
                    r.status === "running" ? "bg-primary animate-pulse" :
                    r.status === "failed" ? "bg-destructive" : "bg-muted-foreground"
                  )} />
                  <div>
                    <p className="text-xs font-mono font-bold text-foreground">{r.id}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Stages: {r.stages.join(" → ")} • {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-foreground/80">{r.progress}%</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                    r.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                    r.status === "running" ? "bg-primary/20 text-primary" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {r.status}
                  </span>
                  <button
                    onClick={() => setRun(r)}
                    className="text-xs px-2.5 py-1 rounded bg-secondary hover:bg-surface text-muted-foreground hover:text-foreground font-semibold border border-border"
                  >
                    View Logs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
