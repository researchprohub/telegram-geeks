import { useState, useEffect, FormEvent } from "react";
import { campaignsApi, accountsApi, detail } from "../lib/api";
import {
  Send,
  Play,
  Pause,
  Square,
  Trash2,
  Plus,
  Layers,
  Activity,
  Sliders,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  RefreshCw,
  FileText,
  ShieldCheck,
  ChevronRight,
  Terminal,
} from "lucide-react";

interface CampaignItem {
  id: number;
  name: string;
  type?: string;
  status: "draft" | "running" | "paused" | "completed" | "failed" | "stopped";
  total_targets?: number;
  sent_count?: number;
  delivered_count?: number;
  failed_count?: number;
  created_at?: string;
  config?: any;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [name, setName] = useState("");
  const [campaignType, setCampaignType] = useState("direct_dm");
  const [targetsText, setTargetsText] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("Hello {first_name|there}!\n\nI noticed you are interested in {Crypto|Trading|Tech}.\nLet me know if you would like to connect!");
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [delayMin, setDelayMin] = useState(15);
  const [delayMax, setDelayMax] = useState(45);
  const [msgsPerAccount, setMsgsPerAccount] = useState(25);
  const [threads, setThreads] = useState(5);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    try {
      const [campRes, accRes] = await Promise.allSettled([
        campaignsApi.list(1),
        accountsApi.list(1, 200),
      ]);

      if (campRes.status === "fulfilled") {
        const d = campRes.value.data as any;
        const raw = d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
        setCampaigns(Array.isArray(raw) ? raw : []);
        if (!activeCampaignId && raw.length > 0) {
          setActiveCampaignId(raw[0].id);
        }
      }

      if (accRes.status === "fulfilled") {
        const ad = accRes.value.data as any;
        const rawAcc = ad?.items ?? ad?.data ?? (Array.isArray(ad) ? ad : []);
        setAccounts(Array.isArray(rawAcc) ? rawAcc : []);
        if (selectedAccountIds.length === 0 && rawAcc.length > 0) {
          setSelectedAccountIds(rawAcc.slice(0, 5).map((a: any) => a.id));
        }
      }
    } catch (err) {
      setError(detail(err));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Poll logs for active campaign
  useEffect(() => {
    if (!activeCampaignId) return;
    const fetchLogs = async () => {
      try {
        const res = await campaignsApi.logs(activeCampaignId);
        const l = res.data;
        setLogs(Array.isArray(l) ? l : (l as any)?.items || []);
      } catch {}
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, [activeCampaignId]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please specify a campaign name.");
      return;
    }
    const targets = targetsText.split("\n").map((t) => t.trim()).filter(Boolean);
    if (targets.length === 0) {
      setError("Please add at least one recipient lead.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await campaignsApi.create({
        name: name.trim(),
        type: campaignType,
        status: "draft",
        targets: targets,
        message: messageTemplate,
        account_ids: selectedAccountIds,
        config: {
          delay_min: delayMin,
          delay_max: delayMax,
          max_per_account: msgsPerAccount,
          threads: threads,
        },
      });
      setShowWizard(false);
      setName("");
      setTargetsText("");
      setWizardStep(1);
      setSuccessMsg("Campaign configured and created successfully!");
      await loadData();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAction = async (id: number, actionFn: (id: number) => Promise<any>, actionName: string) => {
    setError("");
    try {
      await actionFn(id);
      setSuccessMsg(`Campaign #${id} ${actionName} successfully!`);
      await loadData();
    } catch (err) {
      setError(detail(err));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Send className="h-6 w-6 text-primary" />
            Campaigns & Broadcast Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Multi-threaded high-speed outreach engine with AI Spintax, account pool rotation, and anti-flood delays.
          </p>
        </div>

        <button
          onClick={() => setShowWizard(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black font-semibold text-xs shadow-[0_0_20px_rgba(45,212,191,0.25)] hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Campaign Wizard</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Campaign Management Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Campaigns Table & KPI cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-md">
              <div className="text-xs text-muted-foreground">Total Campaigns</div>
              <div className="text-2xl font-extrabold text-foreground mt-1">{campaigns.length}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-md">
              <div className="text-xs text-muted-foreground">Running Tasks</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                {campaigns.filter((c) => c.status === "running").length}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-md">
              <div className="text-xs text-muted-foreground">Active Senders Pool</div>
              <div className="text-2xl font-extrabold text-primary mt-1">{accounts.length} Accounts</div>
            </div>
          </div>

          {/* Campaigns List Card */}
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">All Outreach Campaigns</span>
              <button onClick={loadData} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-card/60 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3 font-medium">Campaign</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Progress</th>
                    <th className="px-5 py-3 font-medium text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-foreground">
                  {campaigns.map((c) => {
                    const total = c.total_targets || 100;
                    const sent = c.sent_count || 0;
                    const pct = Math.min(100, Math.round((sent / total) * 100));
                    const isSelected = activeCampaignId === c.id;

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setActiveCampaignId(c.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-card/50"
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-foreground text-xs">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground uppercase">{c.type || "Direct DM"} • #{c.id}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === "running"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : c.status === "paused"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-secondary text-muted-foreground"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="w-32 space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>{sent} sent</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {c.status !== "running" ? (
                              <button
                                onClick={() => handleAction(c.id, campaignsApi.start, "started")}
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                title="Start Campaign"
                              >
                                <Play className="h-3.5 w-3.5 fill-emerald-400" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(c.id, campaignsApi.pause, "paused")}
                                className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                                title="Pause Campaign"
                              >
                                <Pause className="h-3.5 w-3.5 fill-amber-400" />
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(c.id, campaignsApi.stop, "stopped")}
                              className="p-1.5 rounded-lg bg-card hover:bg-card/80 text-muted-foreground hover:text-foreground transition-colors"
                              title="Stop Campaign"
                            >
                              <Square className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleAction(c.id, campaignsApi.delete, "deleted")}
                              className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                              title="Delete Campaign"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-muted-foreground text-xs">
                        No campaigns found. Click "New Campaign Wizard" to configure your first outreach.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Live Logs & Active Inspector */}
        <div className="rounded-2xl border border-border bg-card/30 p-5 backdrop-blur-md flex flex-col justify-between h-[540px]">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Terminal className="h-4 w-4 text-primary" />
                <span>Live Event Stream {activeCampaignId ? `(#${activeCampaignId})` : ""}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Auto-updating</span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] overflow-y-auto max-h-[410px] custom-scrollbar pr-1">
              {logs.map((l: any, i) => (
                <div key={i} className="text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-2">
                  <span className="text-foreground/70">[{new Date(l.created_at || Date.now()).toLocaleTimeString()}]</span>{" "}
                  <span>{l.message || JSON.stringify(l)}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-24 text-muted-foreground text-xs font-sans">
                  Select an active campaign to view real-time thread dispatch logs.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Safety Throttling: <strong>Level 5</strong></span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> MTProto Guard Active
            </span>
          </div>
        </div>
      </div>

      {/* Campaign Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">New Campaign Wizard</h3>
                <p className="text-xs text-muted-foreground">Step {wizardStep} of 3: {
                  wizardStep === 1 ? "Campaign Type & Setup" : wizardStep === 2 ? "Audience & Spintax Message" : "Account Pool & Concurrency"
                }</p>
              </div>
              <button onClick={() => setShowWizard(false)} className="text-muted-foreground hover:text-foreground text-xs">
                Cancel
              </button>
            </div>

            {/* Step 1: Profile & Type */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Campaign Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. VIP Crypto Leads Outreach #1"
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Campaign Outreach Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "direct_dm", name: "Direct Message (DM)", desc: "1-on-1 private messaging with smart Spintax" },
                      { id: "secret_chat", name: "Secret Chat Outreach", desc: "End-to-end encrypted chats with ephemeral timer" },
                      { id: "group_invite", name: "Group Mass Invite", desc: "Add gathered leads directly into your target group" },
                      { id: "channel_forward", name: "Message Forwarder", desc: "Forward posts to multiple chats & channels" },
                    ].map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setCampaignType(m.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          campaignType === m.id
                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                            : "border-border bg-background/50 hover:bg-background"
                        }`}
                      >
                        <div className="font-bold text-xs text-foreground">{m.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Audience & Message */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Target Audience (Usernames or User IDs, one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={targetsText}
                    onChange={(e) => setTargetsText(e.target.value)}
                    placeholder="@username1&#10;@username2&#10;123456789"
                    className="w-full rounded-xl border border-border bg-background/80 p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Message Template (Spintax Supported: &#123;A|B|C&#125;)
                  </label>
                  <textarea
                    rows={4}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/80 p-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Account Pool & Concurrency */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Select Senders ({selectedAccountIds.length} chosen)</label>
                    <button
                      type="button"
                      onClick={() => setSelectedAccountIds(accounts.map((a) => a.id))}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="max-h-32 overflow-y-auto rounded-xl border border-border bg-background/60 p-2.5 space-y-1.5 custom-scrollbar">
                    {accounts.map((acc) => (
                      <label key={acc.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAccountIds.includes(acc.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAccountIds([...selectedAccountIds, acc.id]);
                            else setSelectedAccountIds(selectedAccountIds.filter((id) => id !== acc.id));
                          }}
                          className="h-3.5 w-3.5 accent-primary rounded"
                        />
                        <span className="font-mono text-muted-foreground">{acc.phone || `Account #${acc.id}`}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Min Delay (s)</label>
                    <input
                      type="number"
                      min={5}
                      value={delayMin}
                      onChange={(e) => setDelayMin(Number(e.target.value) || 5)}
                      className="w-full rounded-xl border border-border bg-background/80 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Max Delay (s)</label>
                    <input
                      type="number"
                      min={10}
                      value={delayMax}
                      onChange={(e) => setDelayMax(Number(e.target.value) || 10)}
                      className="w-full rounded-xl border border-border bg-background/80 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Threads (1-20)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={threads}
                      onChange={(e) => setThreads(Number(e.target.value) || 1)}
                      className="w-full rounded-xl border border-border bg-background/80 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Modal Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-card"
                >
                  Back
                </button>
              ) : <div />}

              {wizardStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="px-5 py-2.5 rounded-xl bg-primary text-black text-xs font-bold shadow-md hover:opacity-90 flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateCampaign}
                  disabled={busy}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{busy ? "Saving Campaign…" : "Launch Campaign"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}