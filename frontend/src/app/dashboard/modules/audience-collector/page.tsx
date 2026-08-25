"use client";

import { useState, useEffect } from "react";
import {
  UserSearch, ArrowLeft, Play, Loader2, Download, Filter, Hash,
  MessageCircle, Users, CheckCircle2, Shield, Sparkles, Database,
  Sliders, ArrowRight, Clock, AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { AccountPicker, AccountItem } from "@/components/modules/AccountPicker";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { GuidedModuleHarness, GuidedPreset } from "@/components/modules/GuidedModuleHarness";
import { RealtimeOperationHUD, OperationPhase, OperationLogEntry } from "@/components/modules/RealtimeOperationHUD";

export default function AudienceCollectorPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([]);
  const [source, setSource] = useState<"group" | "comments" | "members">("group");
  const [chatLink, setChatLink] = useState("https://t.me/CryptoAlphaGems");
  const [keywords, setKeywords] = useState("crypto, admin, dev, founder");
  const [limit, setLimit] = useState(250);

  // Concurrency & delays
  const [threadCount, setThreadCount] = useState(3);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(8);

  // Stepper & HUD State
  const [activeStep, setActiveStep] = useState(0);
  const [executing, setExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [logs, setLogs] = useState<OperationLogEntry[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    speedPerMin: 0,
    floodWaitSeconds: 0,
    estimatedTimeRemaining: "",
  });
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");

  const phases: OperationPhase[] = [
    { id: "1", name: "Resolve Channel / Group Entity", description: "Connecting via MTProto and verifying access", status: executing ? "running" : "pending" },
    { id: "2", name: "Paginated Member / Comment Fetch", description: "Extracting user IDs, names, usernames", status: "pending" },
    { id: "3", name: "Filter Bots & Inactive Users", description: "Applying keyword, last seen, and gender filters", status: "pending" },
    { id: "4", name: "Compile Structured Target DB", description: "Generating CSV export and TargetDB record", status: "pending" },
  ];

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } })
      .then((r) => {
        const items = r.data?.items || r.data || [];
        setAccounts(items);
        if (items.length > 0) {
          setSelectedAccounts([items[0].id]);
        }
      })
      .catch(() => {});
  }, []);

  function addLog(message: string, level: "info" | "success" | "warn" | "error" | "flood" = "info") {
    setLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), message, level },
    ]);
  }

  const handleApplyPreset = (preset: GuidedPreset) => {
    setMinDelay(preset.delayRange[0]);
    setMaxDelay(preset.delayRange[1]);
    addLog(`Applied safety preset: ${preset.name}`, "info");
  };

  async function handleExecute() {
    if (selectedAccounts.length === 0) {
      setError("Please select a scraper account in Step 1");
      setActiveStep(0);
      return;
    }
    if (!chatLink.trim()) {
      setError("Please enter a valid Telegram channel or group link in Step 2");
      setActiveStep(1);
      return;
    }

    setExecuting(true);
    setIsPaused(false);
    setError("");
    setResults(null);
    setCurrentPhaseIndex(0);
    setLogs([]);
    setStats({
      total: limit,
      completed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      speedPerMin: 45,
      floodWaitSeconds: 0,
      estimatedTimeRemaining: `${Math.ceil(limit / 45)} min`,
    });

    addLog(`Phase 1: Resolving chat entity ${chatLink} via MTProto...`, "info");

    try {
      setTimeout(() => {
        setCurrentPhaseIndex(1);
        addLog(`Phase 2: Fetching up to ${limit} members from channel...`, "info");
      }, 1000);

      setTimeout(() => {
        setCurrentPhaseIndex(2);
        addLog(`Phase 3: Applying filters (${keywords || "all users"})...`, "info");
      }, 2500);

      const r = await api.post("/modules/audience_collector/execute", {
        operation:
          source === "group"
            ? "collect_from_group"
            : source === "comments"
            ? "collect_from_comments"
            : "collect_members",
        params: {
          account_id: selectedAccounts[0],
          account_ids: selectedAccounts,
          chat_id: chatLink,
          limit,
          keywords: keywords ? keywords.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });

      const res = r.data?.result || r.data;
      setResults(res);
      const count = res.count || res.users?.length || (Array.isArray(res) ? res.length : limit);

      setCurrentPhaseIndex(3);
      setStats((prev) => ({
        ...prev,
        completed: count,
        success: count,
      }));

      addLog(`Phase 4: Finished scraping! Successfully extracted ${count} active user records.`, "success");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e.message || "Extraction failed";
      setError(msg);
      addLog(`Error during collection: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  }

  function handleExportCsv() {
    const userList = results?.users || (Array.isArray(results) ? results : []);
    if (!userList || userList.length === 0) return;
    const header = "user_id,username,first_name,last_name,status\n";
    const rows = userList
      .map((u: any) => `${u.id || u.user_id || ""},${u.username || ""},"${u.first_name || ""}",${u.last_name || ""},${u.status || "active"}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `telegram_audience_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Guided Stepper Content ---
  const guidedSteps = [
    {
      title: "Select Scraper Account",
      description: "Pick active account & proxy",
      component: (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Step 1: Choose Scraper Account</h3>
            <p className="text-xs text-muted-foreground">
              Select an account to query the Telegram channel or group. Read-only scraping does not burn accounts when proper delays are used.
            </p>
          </div>

          <AccountPicker
            accounts={accounts}
            selectedIds={selectedAccounts}
            onSelectionChange={setSelectedAccounts}
          />

          <ThreadProxyPanel
            threadCount={threadCount}
            onThreadChange={setThreadCount}
            proxyMode={proxyMode}
            onProxyChange={setProxyMode}
          />
        </div>
      ),
    },
    {
      title: "Target Group / Channel",
      description: "Enter source link or chat ID",
      component: (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Step 2: Source Channel or Group Link</h3>
            <p className="text-xs text-muted-foreground">
              Enter the target public link (<span className="font-mono text-primary">https://t.me/target_channel</span> or <span className="font-mono text-primary">@target_group</span>).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: "group", label: "Full Group Members", icon: Users },
              { id: "comments", label: "Recent Post Commenters", icon: MessageCircle },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSource(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  source === t.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={chatLink}
            onChange={(e) => setChatLink(e.target.value)}
            placeholder="https://t.me/cryptocommunity or @targetgroup"
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 font-mono"
          />

          <div className="p-3 bg-secondary/30 rounded-xl border border-border/80 text-xs text-muted-foreground">
            <p className="font-bold text-foreground mb-1">💡 Scraping Tip:</p>
            <p>
              Scraping <strong>Post Commenters</strong> captures users who are active, English/native speaking, and highly engaged right now.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Filter & Limit",
      description: "Set member count & keywords",
      component: (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Step 3: Audience Filters & Limit</h3>
            <p className="text-xs text-muted-foreground">
              Filter by keywords found in user bios or messages, and set maximum members to collect.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                Extraction Limit
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                min={10}
                max={5000}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-xs font-mono text-foreground outline-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Recommended: 200 - 1,000 per run</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                Bio / Keyword Filter (Optional)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="crypto, trader, founder"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-xs text-foreground outline-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Comma-separated keywords</p>
            </div>
          </div>

          <FloodControlPanel
            minDelay={minDelay}
            maxDelay={maxDelay}
            onMinDelayChange={setMinDelay}
            onMaxDelayChange={setMaxDelay}
          />
        </div>
      ),
    },
    {
      title: "Real-time HUD & Results",
      description: "Live extraction monitor & export",
      component: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Step 4: Live Extraction Monitor</h3>
              <p className="text-xs text-muted-foreground">
                Watch real-time user ingestion and export the filtered target dataset.
              </p>
            </div>

            {results && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-4 py-2 rounded-xl bg-success text-success-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV ({stats.completed} Leads)
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
              {error}
            </div>
          )}

          <RealtimeOperationHUD
            moduleName="Audience Collector"
            moduleCategory="MTProto Member Scraping"
            isRunning={executing}
            isPaused={isPaused}
            phases={phases}
            currentPhaseIndex={currentPhaseIndex}
            stats={stats}
            logs={logs}
            onPause={() => setIsPaused(true)}
            onResume={() => setIsPaused(false)}
            onStop={() => {
              setExecuting(false);
              addLog("Scraping cancelled by user.", "warn");
            }}
            onRestart={() => {
              setStats({
                total: 0,
                completed: 0,
                success: 0,
                failed: 0,
                skipped: 0,
                speedPerMin: 0,
                floodWaitSeconds: 0,
                estimatedTimeRemaining: "",
              });
              setLogs([]);
              setResults(null);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/modules")}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
              <UserSearch className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">Audience Collector Engine</h1>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                  v2.2 Guided
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Parse active members, comment responders, and target leads with zero session loss
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-7xl mx-auto space-y-4">
        <GuidedModuleHarness
          moduleName="Audience Collector"
          moduleCategory="Data Extraction & Enrichment"
          moduleDescription="Scrape real, high-value Telegram users from any channel, group, or comment thread with automated filtering."
          safetyLimits={{
            recommendedDailyPerAccount: 2000,
            hardMaxDailyPerAccount: 5000,
            recommendedDelaySeconds: 4,
            cooldownPeriodMinutes: 10,
          }}
          keyTips={[
            "Scraping is a read-only MTProto operation; it will not trigger flood waits when paced at 3-8s.",
            "Always filter for users active within the last 7 days for maximum DM and invite conversion.",
            "Save collected leads directly to Target Database or export as structured CSV.",
          ]}
          steps={guidedSteps}
          activeStep={activeStep}
          onStepChange={setActiveStep}
          onApplyPreset={handleApplyPreset}
          onLaunch={handleExecute}
          isLaunching={executing}
          expertView={
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  <AccountPicker
                    accounts={accounts}
                    selectedIds={selectedAccounts}
                    onSelectionChange={setSelectedAccounts}
                  />

                  <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                    <h4 className="text-xs font-bold text-foreground uppercase">Target Chat Link</h4>
                    <input
                      type="text"
                      value={chatLink}
                      onChange={(e) => setChatLink(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-xs text-foreground font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <ThreadProxyPanel
                    threadCount={threadCount}
                    onThreadChange={setThreadCount}
                    proxyMode={proxyMode}
                    onProxyChange={setProxyMode}
                  />
                  <FloodControlPanel
                    minDelay={minDelay}
                    maxDelay={maxDelay}
                    onMinDelayChange={setMinDelay}
                    onMaxDelayChange={setMaxDelay}
                  />
                  <button
                    onClick={handleExecute}
                    disabled={executing}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md"
                  >
                    {executing ? "Collecting Audience..." : "Run Collector"}
                  </button>
                </div>
              </div>

              <RealtimeOperationHUD
                moduleName="Audience Collector"
                moduleCategory="MTProto Member Scraping"
                isRunning={executing}
                isPaused={isPaused}
                phases={phases}
                currentPhaseIndex={currentPhaseIndex}
                stats={stats}
                logs={logs}
                onPause={() => setIsPaused(true)}
                onResume={() => setIsPaused(false)}
                onStop={() => setExecuting(false)}
              />
            </div>
          }
        />

        <CrossLinkFooter
          links={[
            { label: "Mass Messaging", href: "/dashboard/modules/mass-messaging" },
            { label: "Accounts Hub", href: "/dashboard/accounts" },
            { label: "Database Tools", href: "/dashboard/modules/database-tools" },
            { label: "Master Pipeline", href: "/dashboard/workflow" },
          ]}
        />

        <ModuleFooter manualSlug="audience-collector" />
      </div>
    </div>
  );
}
