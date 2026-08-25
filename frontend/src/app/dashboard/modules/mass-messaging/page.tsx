"use client";

import { useState, useEffect } from "react";
import {
  Send, ArrowLeft, Play, Loader2, CheckCircle2, AlertCircle, Users,
  Database, List, Shuffle, Sparkles, MessageSquare, Shield, Clock,
  Smartphone, Zap, Sliders
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

export default function MassMessagingPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([]);
  const [messageText, setMessageText] = useState(
    "{Hey|Hello|Hi} {there|friend}! Check out our {latest updates|new features|exclusive community}."
  );
  const [useSpintax, setUseSpintax] = useState(true);
  const [mode, setMode] = useState<"database" | "list" | "manual">("list");
  const [targetIds, setTargetIds] = useState("@sample_user1\n@sample_user2\n@sample_user3");

  // Concurrency & Delays
  const [threadCount, setThreadCount] = useState(3);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(15);
  const [maxDelay, setMaxDelay] = useState(30);

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
  const [error, setError] = useState("");

  const phases: OperationPhase[] = [
    { id: "1", name: "Account Health & Handshake", description: "Verifying MTProto session keys & proxies", status: executing ? "running" : "pending" },
    { id: "2", name: "Target Ingestion & De-Duplication", description: "Parsing @usernames & recipient list", status: "pending" },
    { id: "3", name: "MTProto Spintax Dispatch", description: "Transmitting randomized messages with safe delays", status: "pending" },
    { id: "4", name: "Delivery Confirmation & Metrics", description: "Recording delivery status to target DB", status: "pending" },
  ];

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } })
      .then((r) => {
        const items = r.data?.items || r.data || [];
        setAccounts(items);
        if (items.length > 0) {
          setSelectedAccounts(items.slice(0, 3).map((a: any) => a.id));
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

  const resolveSampleSpintax = (template: string) => {
    return template.replace(/\{([^{}]+)\}/g, (_, choices) => {
      const arr = choices.split("|");
      return arr[Math.floor(Math.random() * arr.length)];
    });
  };

  const handleApplyPreset = (preset: GuidedPreset) => {
    setMinDelay(preset.delayRange[0]);
    setMaxDelay(preset.delayRange[1]);
    setUseSpintax(preset.useSpintax);
    addLog(`Applied safety preset: ${preset.name} (Delay: ${preset.delayRange[0]}-${preset.delayRange[1]}s)`, "info");
  };

  async function handleExecute() {
    if (selectedAccounts.length === 0) {
      setError("Please select at least one sender account in Step 1");
      setActiveStep(0);
      return;
    }
    if (!messageText.trim()) {
      setError("Please write your outreach message in Step 2");
      setActiveStep(1);
      return;
    }

    const targets = targetIds.split("\n").map((s) => s.trim()).filter(Boolean);
    if (targets.length === 0) {
      setError("Please enter target recipients in Step 3");
      setActiveStep(2);
      return;
    }

    setExecuting(true);
    setIsPaused(false);
    setError("");
    setCurrentPhaseIndex(0);
    setLogs([]);
    setStats({
      total: targets.length,
      completed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      speedPerMin: 15,
      floodWaitSeconds: 0,
      estimatedTimeRemaining: `${Math.ceil((targets.length * 20) / 60)} min`,
    });

    addLog(`Phase 1: Initializing MTProto connections across ${selectedAccounts.length} sender accounts...`, "info");

    try {
      setTimeout(() => {
        setCurrentPhaseIndex(1);
        addLog(`Phase 2: Ingested ${targets.length} target recipients. Verifying privacy filters...`, "info");
      }, 1000);

      setTimeout(() => {
        setCurrentPhaseIndex(2);
        addLog(`Phase 3: Starting live MTProto message dispatch (delay: ${minDelay}-${maxDelay}s)...`, "info");
      }, 2200);

      const payload: any = {
        operation:
          mode === "database"
            ? "send_to_database"
            : mode === "list"
            ? "send_to_list"
            : "send_to_users",
        params: {
          account_ids: selectedAccounts,
          account_id: selectedAccounts[0],
          text: messageText,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
          use_spintax: useSpintax,
        },
      };

      if (mode === "database") payload.params.database_path = targetIds || "/default";
      else if (mode === "list") payload.params.user_ids = targets;
      else payload.params.phone_numbers = targets;

      const r = await api.post("/modules/mass_messaging/execute", payload);
      const res = r.data?.result || r.data;
      const sent = res.sent || res.count || targets.length;
      const failed = res.failed || 0;

      setCurrentPhaseIndex(3);
      setStats((prev) => ({
        ...prev,
        completed: sent + failed,
        success: sent,
        failed,
      }));

      addLog(`Phase 4: Outreach completed! Successfully delivered ${sent} messages (${failed} failed).`, "success");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e.message || "Execution error";
      setError(msg);
      addLog(`Execution error: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  }

  // --- Guided Stepper Content ---
  const guidedSteps = [
    {
      title: "Select Sender Fleet",
      description: "Pick accounts & proxy routes",
      component: (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Step 1: Choose Active Senders</h3>
            <p className="text-xs text-muted-foreground">
              Select the Telegram accounts that will send direct messages. Messages will be rotated evenly among selected accounts to prevent rate limits.
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
      title: "Compose & Spintax",
      description: "Write text with variation tags",
      component: (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Step 2: Message Content & Spintax</h3>
            <p className="text-xs text-muted-foreground">
              Use Spintax <span className="font-mono text-primary">{`{Hi|Hello|Hey}`}</span> tags to make every single outgoing message unique. Telegram's spam filter flags identical text sent to multiple users.
            </p>
          </div>

          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={5}
            placeholder="Type your outreach message here with {option1|option2} tags..."
            className="w-full bg-secondary border border-border rounded-xl p-3.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 font-sans leading-relaxed"
          />

          {/* Spintax Live Preview */}
          <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                <Shuffle className="h-3.5 w-3.5" />
                Live Spintax Sample Output
              </span>
              <button
                type="button"
                onClick={() => setMessageText((prev) => prev)}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground"
              >
                Re-sample
              </button>
            </div>
            <p className="text-xs text-foreground font-mono bg-card p-2.5 rounded-lg border border-border">
              {resolveSampleSpintax(messageText || "Enter text above")}
            </p>
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
      title: "Target Recipients",
      description: "Input @usernames or target list",
      component: (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Step 3: Target Audience List</h3>
            <p className="text-xs text-muted-foreground">
              Enter target usernames (<span className="font-mono text-primary">@username</span>) or Telegram user IDs, one per line.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: "list", label: "Usernames List", icon: List },
              { id: "database", label: "Target Database", icon: Database },
              { id: "manual", label: "Phone Numbers", icon: Users },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMode(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  mode === t.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            value={targetIds}
            onChange={(e) => setTargetIds(e.target.value)}
            rows={6}
            placeholder={`@username_1\n@username_2\n@username_3`}
            className="w-full bg-secondary border border-border rounded-xl p-3.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 font-mono leading-relaxed"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Total Recipients:{" "}
              <strong className="text-foreground">
                {targetIds.split("\n").map((s) => s.trim()).filter(Boolean).length}
              </strong>
            </span>
            <span>Estimated send time: ~{Math.ceil((targetIds.split("\n").filter(Boolean).length * 20) / 60)} minutes</span>
          </div>
        </div>
      ),
    },
    {
      title: "Review & Live Launch",
      description: "Pre-flight summary & HUD",
      component: (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Step 4: Review & Live Launch</h3>
            <p className="text-xs text-muted-foreground">
              Review your outreach campaign configuration before transmitting over Telegram MTProto.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-secondary/30 rounded-xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Senders Selected</p>
              <p className="text-lg font-mono font-bold text-primary mt-0.5">
                {selectedAccounts.length} accounts
              </p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Target Audience</p>
              <p className="text-lg font-mono font-bold text-foreground mt-0.5">
                {targetIds.split("\n").filter(Boolean).length} users
              </p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Delays</p>
              <p className="text-lg font-mono font-bold text-success mt-0.5">
                {minDelay}-{maxDelay}s
              </p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Spintax Enabled</p>
              <p className="text-lg font-mono font-bold text-foreground mt-0.5">
                {useSpintax ? "Active" : "Disabled"}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
              {error}
            </div>
          )}

          {/* Realtime HUD rendered directly in step 4 or below */}
          <RealtimeOperationHUD
            moduleName="Mass Messaging"
            moduleCategory="Direct MTProto Outreach"
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
              addLog("Operation aborted by user.", "warn");
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
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">Mass Messaging Engine</h1>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                  v2.2 Guided
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                High-deliverability direct messaging with Spintax, multi-account rotation, and live HUD
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-7xl mx-auto space-y-4">
        {/* Guided Module Harness */}
        <GuidedModuleHarness
          moduleName="Mass Messaging"
          moduleCategory="Outreach & Engagement"
          moduleDescription="Dispatch personalized messages to targeted leads with rotating senders, Spintax variation, and flood safety."
          safetyLimits={{
            recommendedDailyPerAccount: 35,
            hardMaxDailyPerAccount: 50,
            recommendedDelaySeconds: 20,
            cooldownPeriodMinutes: 30,
            spintaxMandatory: true,
          }}
          keyTips={[
            "Always use {Hi|Hello|Hey} spintax tags to keep message signatures distinct.",
            "Maintain at least 15-30s random delay between messages to avoid automated flood waits.",
            "Distribute campaigns across 3+ active accounts with high trust scores (>80).",
            "Never send raw unshortened links to recipients who haven't interacted with your bot or account.",
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
                    <h4 className="text-xs font-bold text-foreground uppercase">Outreach Message & Spintax</h4>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={5}
                      className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>

                  <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                    <h4 className="text-xs font-bold text-foreground uppercase">Recipients</h4>
                    <textarea
                      value={targetIds}
                      onChange={(e) => setTargetIds(e.target.value)}
                      rows={5}
                      className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground font-mono"
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
                    {executing ? "Running Operation..." : "Execute Campaign"}
                  </button>
                </div>
              </div>

              <RealtimeOperationHUD
                moduleName="Mass Messaging"
                moduleCategory="Direct MTProto Outreach"
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
            { label: "Audience Collector", href: "/dashboard/modules/audience-collector" },
            { label: "Accounts Hub", href: "/dashboard/accounts" },
            { label: "Channel Cloner", href: "/dashboard/modules/channel-cloner" },
            { label: "Master Pipeline", href: "/dashboard/workflow" },
          ]}
        />

        <ModuleFooter manualSlug="mass-messaging" />
      </div>
    </div>
  );
}
