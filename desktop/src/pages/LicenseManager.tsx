import { useState, useEffect, FormEvent } from "react";
import { licensesApi, detail } from "../lib/api";
import {
  KeyRound,
  ShieldCheck,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Download,
  Calendar,
  Layers,
  Users,
  Check,
  X,
  Lock,
  Unlock,
  ShieldAlert,
  Clock,
  Laptop,
  Cpu,
  Zap,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface LicenseRecord {
  key: string;
  plan_tier: string;
  duration_days: number;
  max_accounts: number;
  max_campaigns: number;
  team_seats: number;
  allowed_modules: string[];
  hwid?: string;
  customer_email?: string;
  notes?: string;
  status: string;
  created_at: string;
  activated_at?: string;
  expires_at: string;
}

export default function LicenseManager() {
  const [activeTab, setActiveTab] = useState<"generator" | "vault" | "validator">("generator");
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [currentHWID, setCurrentHWID] = useState<string>("");

  // Generator Form State
  const [planTier, setPlanTier] = useState("1yr");
  const [customDays, setCustomDays] = useState<number | "">("");
  const [maxAccounts, setMaxAccounts] = useState(100);
  const [maxCampaigns, setMaxCampaigns] = useState(50);
  const [teamSeats, setTeamSeats] = useState(10);
  const [allModules, setAllModules] = useState(true);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [hwidLock, setHwidLock] = useState("");
  const [notes, setNotes] = useState("");
  const [batchCount, setBatchCount] = useState(1);
  const [generatedResult, setGeneratedResult] = useState<LicenseRecord[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Validator Sandbox State
  const [testKey, setTestKey] = useState("");
  const [testHwid, setTestHwid] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [actionType, setActionType] = useState<"verify" | "activate">("verify");

  const MODULE_OPTIONS = [
    { id: "registrar", name: "Universal Registrar" },
    { id: "forwarder", name: "Message Forwarder" },
    { id: "booster", name: "Account Booster & Warmup" },
    { id: "interceptor", name: "Message Interceptor" },
    { id: "invite_via_admin", name: "Invite via Administrator" },
    { id: "channel_cloner", name: "Channel Cloner" },
    { id: "chat_cloner", name: "Chat Cloner" },
    { id: "reporter", name: "The Reporter" },
    { id: "duplicator", name: "Session Duplicator" },
    { id: "converter", name: "Format Converter" },
  ];

  // Fetch machine HWID
  useEffect(() => {
    (async () => {
      try {
        if ((window as any).api?.getHWID) {
          const hw = await (window as any).api.getHWID();
          if (hw) {
            setCurrentHWID(hw);
            setTestHwid(hw);
          }
        } else {
          setCurrentHWID("HWID-LOCAL-DEV-0001");
          setTestHwid("HWID-LOCAL-DEV-0001");
        }
      } catch {
        setCurrentHWID("HWID-DEFAULT-0001");
      }
    })();
  }, []);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const res = await licensesApi.list({
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        plan_tier: tierFilter !== "all" ? tierFilter : undefined,
      });
      setLicenses(res.data?.licenses || []);
    } catch (err) {
      setError(detail(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, [statusFilter, tierFilter]);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    setGeneratedResult([]);

    try {
      const payload = {
        plan_tier: planTier,
        duration_days: customDays !== "" ? Number(customDays) : undefined,
        max_accounts: maxAccounts,
        max_campaigns: maxCampaigns,
        team_seats: teamSeats,
        allowed_modules: allModules ? ["*"] : selectedModules,
        customer_email: customerEmail.trim() || undefined,
        hwid: hwidLock.trim() || undefined,
        notes: notes.trim() || undefined,
        batch_count: batchCount,
      };

      const res = await licensesApi.generate(payload);
      const output = res.data?.licenses || (res.data?.license ? [res.data.license] : []);
      setGeneratedResult(output);
      setSuccessMsg(`Successfully generated ${output.length} license key(s)!`);
      await loadLicenses();
    } catch (err) {
      setError(detail(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (key: string) => {
    if (!confirm(`Are you sure you want to revoke license ${key}?`)) return;
    setError("");
    try {
      await licensesApi.revoke(key, "Revoked via Desktop License Manager");
      await loadLicenses();
      setSuccessMsg(`License ${key} revoked successfully.`);
    } catch (err) {
      setError(detail(err));
    }
  };

  const handleUnbindHwid = async (key: string) => {
    if (!confirm(`Clear HWID lock for license ${key}? The user will be able to bind to a new machine.`)) return;
    setError("");
    try {
      await licensesApi.unbindHwid(key);
      await loadLicenses();
      setSuccessMsg(`HWID lock cleared for ${key}.`);
    } catch (err) {
      setError(detail(err));
    }
  };

  const handleExtend = async (key: string, days: number) => {
    setError("");
    try {
      await licensesApi.extend(key, days);
      await loadLicenses();
      setSuccessMsg(`Extended validity for ${key} by +${days} days.`);
    } catch (err) {
      setError(detail(err));
    }
  };

  const handleValidateOrActivate = async (mode: "verify" | "activate") => {
    if (!testKey.trim()) {
      setError("Please enter a license key.");
      return;
    }
    setValidating(true);
    setValidationResult(null);
    setError("");
    setActionType(mode);

    try {
      if (mode === "verify") {
        const res = await licensesApi.verify(testKey.trim(), testHwid.trim() || undefined);
        setValidationResult(res.data);
      } else {
        const res = await licensesApi.activate(testKey.trim(), testHwid.trim() || undefined);
        setValidationResult({ valid: true, status: "activated", license: res.data?.license });
        setSuccessMsg(`License ${testKey} successfully activated on this machine!`);
        await loadLicenses();
      }
    } catch (err) {
      setValidationResult({ valid: false, status: "error", message: detail(err) });
    } finally {
      setValidating(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportCSV = () => {
    if (licenses.length === 0) return;
    const headers = "Key,Plan Tier,Days,Max Accounts,Max Campaigns,Status,HWID,Email,Expires At\n";
    const rows = licenses
      .map(
        (l) =>
          `"${l.key}","${l.plan_tier}","${l.duration_days}","${l.max_accounts}","${l.max_campaigns}","${l.status}","${l.hwid || ""}","${l.customer_email || ""}","${l.expires_at}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tggeeks_licenses_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <KeyRound className="h-6 w-6 text-primary" />
            Windows License Generator & Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cryptographic license key engine with HWID machine binding, module permissions, and batch export tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentHWID && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground font-mono">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              <span>Machine: <strong className="text-foreground">{currentHWID}</strong></span>
              <button
                onClick={() => handleCopyKey(currentHWID)}
                className="text-muted-foreground hover:text-primary transition-colors ml-1"
                title="Copy Machine HWID"
              >
                {copiedKey === currentHWID ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          )}

          <button
            onClick={loadLicenses}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-card/80 text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-card border border-border hover:bg-card/80 text-foreground font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("generator")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "generator"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>Key Generator Bot</span>
        </button>

        <button
          onClick={() => setActiveTab("vault")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "vault"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>License Vault ({licenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("validator")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "validator"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Server Validation Sandbox</span>
        </button>
      </div>

      {/* ─── Generator Tab ─── */}
      {activeTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleGenerate} className="lg:col-span-7 rounded-2xl border border-border bg-card/40 backdrop-blur-md p-6 space-y-5">
            <div className="border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Issue New License Key(s)</h3>
              <p className="text-xs text-muted-foreground">Select plan duration presets and specify custom resource limits.</p>
            </div>

            {/* Plan Preset */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">Duration Tier Preset</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: "demo", label: "24h Demo", days: 1 },
                  { id: "1mo", label: "1 Month", days: 30 },
                  { id: "1yr", label: "1 Year", days: 365 },
                  { id: "2yr", label: "2 Years", days: 730 },
                  { id: "3yr", label: "3 Years", days: 1095 },
                  { id: "lifetime", label: "Lifetime", days: 36500 },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      setPlanTier(tier.id);
                      setCustomDays("");
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      planTier === tier.id && customDays === ""
                        ? "border-primary bg-primary/15 text-primary font-bold shadow-sm"
                        : "border-border bg-background/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resource Quotas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Max Accounts</label>
                <input
                  type="number"
                  value={maxAccounts}
                  onChange={(e) => setMaxAccounts(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Max Campaigns</label>
                <input
                  type="number"
                  value={maxCampaigns}
                  onChange={(e) => setMaxCampaigns(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Team Seats</label>
                <input
                  type="number"
                  value={teamSeats}
                  onChange={(e) => setTeamSeats(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Module Entitlements */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">PRO Module Permissions</label>
                <label className="flex items-center gap-1.5 text-xs text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allModules}
                    onChange={(e) => setAllModules(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <span>Unlock All Modules (*)</span>
                </label>
              </div>

              {!allModules && (
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-border bg-background/60">
                  {MODULE_OPTIONS.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModules.includes(m.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedModules([...selectedModules, m.id]);
                          else setSelectedModules(selectedModules.filter((id) => id !== m.id));
                        }}
                        className="accent-primary rounded"
                      />
                      <span>{m.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Customer & Machine Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Customer Email (Optional)</label>
                <input
                  type="email"
                  placeholder="client@agency.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Hardware Lock HWID (Optional)</label>
                  {currentHWID && (
                    <button
                      type="button"
                      onClick={() => setHwidLock(currentHWID)}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Use My HWID
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. HWID-4B89-FA12-C890-E001"
                  value={hwidLock}
                  onChange={(e) => setHwidLock(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Batch Count */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-muted-foreground">Batch Generation:</label>
                <select
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value))}
                  className="rounded-xl border border-border bg-background/80 px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value={1}>1 Key</option>
                  <option value={5}>5 Keys</option>
                  <option value={10}>10 Keys</option>
                  <option value={25}>25 Keys</option>
                  <option value={50}>50 Keys</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>{loading ? "Generating…" : `Generate ${batchCount} Key(s)`}</span>
              </button>
            </div>
          </form>

          {/* Generated Result Card */}
          <div className="lg:col-span-5 rounded-2xl border border-border bg-card/30 backdrop-blur-md p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground">Generated Keys Output</h3>
                {generatedResult.length > 0 && (
                  <button
                    onClick={() => {
                      const allKeys = generatedResult.map((r) => r.key).join("\n");
                      navigator.clipboard.writeText(allKeys);
                      setCopiedKey("ALL");
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    {copiedKey === "ALL" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey === "ALL" ? "Copied All" : "Copy All"}</span>
                  </button>
                )}
              </div>

              {generatedResult.length > 0 ? (
                <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar">
                  {generatedResult.map((lic, i) => (
                    <div key={i} className="p-3 rounded-xl bg-background/80 border border-primary/20 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-foreground block select-all">{lic.key}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {lic.plan_tier.toUpperCase()} • {lic.max_accounts} Accs • Expires: {new Date(lic.expires_at).toLocaleDateString()}
                        </span>
                        {lic.hwid && <span className="text-[9px] text-cyan-400 font-mono block">Lock: {lic.hwid}</span>}
                      </div>
                      <button
                        onClick={() => handleCopyKey(lic.key)}
                        className="p-1.5 rounded-lg bg-card hover:bg-card/80 text-primary transition-colors shrink-0"
                        title="Copy Key"
                      >
                        {copiedKey === lic.key ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 text-muted-foreground text-xs">
                  Configure privileges on the left and click Generate to produce cryptographic license keys.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Signature: <strong>HMAC-SHA256</strong></span>
              <span className="text-emerald-400">HWID Binding Protected</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Vault Tab ─── */}
      {activeTab === "vault" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card/40 backdrop-blur-md">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search keys, emails, notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadLicenses()}
                className="w-full rounded-xl border border-border bg-background/80 pl-9 pr-3.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-border bg-background/80 px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="rounded-xl border border-border bg-background/80 px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">All Tiers</option>
                <option value="demo">Demo (24h)</option>
                <option value="1mo">1 Month</option>
                <option value="1yr">1 Year</option>
                <option value="2yr">2 Years</option>
                <option value="3yr">3 Years</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>
          </div>

          {/* Licenses Table */}
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-card/60 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-medium">License Key</th>
                  <th className="px-5 py-3 font-medium">Tier & Quotas</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Hardware Lock (HWID)</th>
                  <th className="px-5 py-3 font-medium">Customer / Expiry</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {licenses.map((lic) => (
                  <tr key={lic.key} className="hover:bg-card/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground select-all">{lic.key}</span>
                        <button
                          onClick={() => handleCopyKey(lic.key)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Copy"
                        >
                          {copiedKey === lic.key ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold uppercase text-primary">{lic.plan_tier}</span>
                      <span className="text-muted-foreground block text-[11px]">
                        {lic.max_accounts} Accs • {lic.max_campaigns} Camps
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        lic.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : lic.status === "expired"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}>
                        {lic.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {lic.hwid ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-cyan-400 truncate max-w-[140px]" title={lic.hwid}>
                            {lic.hwid}
                          </span>
                          <button
                            onClick={() => handleUnbindHwid(lic.key)}
                            className="p-1 rounded text-muted-foreground hover:text-amber-400 transition-colors"
                            title="Unbind / Reset HWID"
                          >
                            <Unlock className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60 italic">Unbound (Float)</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <div>{lic.customer_email || "—"}</div>
                      <span className="text-[10px] text-muted-foreground/80 block">Exp: {new Date(lic.expires_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleExtend(lic.key, 30)}
                        className="px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-semibold transition-colors"
                        title="+30 Days"
                      >
                        +30d
                      </button>
                      {lic.status === "active" && (
                        <button
                          onClick={() => handleRevoke(lic.key)}
                          className="px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 text-[10px] font-semibold transition-colors"
                          title="Revoke License"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {licenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                      No licenses found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Server Validation Sandbox Tab ─── */}
      {activeTab === "validator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">Server License Verification Sandbox</h3>
              <p className="text-xs text-muted-foreground">
                Perform dry-run inspection against server HMAC signatures, expiration timestamps, quotas, and machine HWID binding.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">License Key String</label>
                <input
                  type="text"
                  placeholder="TGGEEKS-XXXX-XXXX-XXXX-XXXX"
                  value={testKey}
                  onChange={(e) => setTestKey(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Client Machine HWID</label>
                  {currentHWID && (
                    <button
                      type="button"
                      onClick={() => setTestHwid(currentHWID)}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Use Current Machine ({currentHWID.slice(0, 12)}…)
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="HWID-XXXX-XXXX-XXXX-XXXX"
                  value={testHwid}
                  onChange={(e) => setTestHwid(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleValidateOrActivate("verify")}
                disabled={validating}
                className="flex-1 py-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{validating && actionType === "verify" ? "Scanning Server…" : "Test Key (Dry Run)"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleValidateOrActivate("activate")}
                disabled={validating}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="h-4 w-4" />
                <span>{validating && actionType === "activate" ? "Binding…" : "Activate & Lock HWID"}</span>
              </button>
            </div>
          </div>

          {/* Validation Result Inspection Card */}
          <div className="lg:col-span-6 rounded-2xl border border-border bg-card/30 backdrop-blur-md p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Entitlement & Cryptographic Audit</h3>
                {validationResult && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    validationResult.valid || validationResult.status === "valid" || validationResult.status === "active" || validationResult.status === "activated"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}>
                    {validationResult.status || (validationResult.valid ? "ACTIVE" : "INVALID")}
                  </span>
                )}
              </div>

              {validationResult ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                    validationResult.valid || validationResult.status === "valid" || validationResult.status === "active" || validationResult.status === "activated"
                      ? "bg-emerald-500/[0.06] border-emerald-500/30 text-foreground"
                      : "bg-destructive/10 border-destructive/30 text-destructive"
                  }`}>
                    <div className="font-bold flex items-center gap-2">
                      {validationResult.valid || validationResult.status === "valid" || validationResult.status === "active" || validationResult.status === "activated" ? (
                        <><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> {validationResult.message || "License is valid and verified against server HMAC."}</>
                      ) : (
                        <><AlertCircle className="h-4 w-4 text-destructive shrink-0" /> {validationResult.message || "License verification rejected."}</>
                      )}
                    </div>

                    {validationResult.license && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Tier & Duration</span>
                          <strong className="text-primary capitalize">{validationResult.license.plan_tier} ({validationResult.license.duration_days || 365} Days)</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Remaining Validity</span>
                          <strong className="text-foreground">{validationResult.license.remaining_days ?? "—"} Days</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Accounts & Campaigns</span>
                          <strong className="text-foreground">{validationResult.license.max_accounts} Accs / {validationResult.license.max_campaigns} Camps</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Machine HWID Lock</span>
                          <strong className={`text-[10px] font-mono ${validationResult.license.hwid_status === "bound_mismatch" ? "text-destructive" : "text-cyan-400"}`}>
                            {validationResult.license.bound_hwid || "Unbound"}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <details className="text-[11px] text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">View Raw Payload</summary>
                    <pre className="font-mono text-[10px] p-2.5 rounded-xl bg-background/80 border border-border mt-2 overflow-x-auto text-foreground">
                      {JSON.stringify(validationResult, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground text-xs space-y-2">
                  <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p>Enter a license key and click <strong>Test Key (Dry Run)</strong> to inspect server-side status without consuming an activation.</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Engine Status: <strong>Online</strong></span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Zero-Trust HWID Enforcement
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

