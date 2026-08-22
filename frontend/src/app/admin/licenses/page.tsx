"use client";

import { useState, useEffect, FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  KeyRound,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Download,
  Check,
  ShieldCheck,
  Calendar,
  Layers,
  Laptop,
  Trash2,
  Unlock,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";

interface LicenseRecord {
  key: string;
  plan_tier: string;
  duration_days: number;
  max_accounts: number;
  max_campaigns: number;
  team_seats: number;
  allowed_modules: string[];
  customer_email?: string;
  hwid?: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  // Generator form
  const [planTier, setPlanTier] = useState("1yr");
  const [customDays, setCustomDays] = useState<number | "">("");
  const [maxAccounts, setMaxAccounts] = useState(100);
  const [maxCampaigns, setMaxCampaigns] = useState(50);
  const [teamSeats, setTeamSeats] = useState(10);
  const [customerEmail, setCustomerEmail] = useState("");
  const [batchCount, setBatchCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<LicenseRecord[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/licenses/admin/list", {
        params: {
          search: search.trim() || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          plan_tier: tierFilter !== "all" ? tierFilter : undefined,
        },
      });
      setLicenses(res.data?.licenses || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load licenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [statusFilter, tierFilter]);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setGeneratedKeys([]);
    setGenerating(true);

    try {
      const payload = {
        plan_tier: planTier,
        duration_days: customDays !== "" ? Number(customDays) : undefined,
        max_accounts: maxAccounts,
        max_campaigns: maxCampaigns,
        team_seats: teamSeats,
        customer_email: customerEmail.trim() || undefined,
        batch_count: batchCount,
      };

      const res = await api.post("/licenses/admin/generate", payload);
      const output = res.data?.licenses || (res.data?.license ? [res.data.license] : []);
      setGeneratedKeys(output);
      setSuccessMsg(`Generated ${output.length} standalone license key(s)!`);
      await fetchLicenses();
    } catch (err: any) {
      setError(err.response?.data?.detail || "License generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleUnbindHwid = async (key: string) => {
    try {
      await api.post(`/licenses/admin/${encodeURIComponent(key)}/reset-hwid`);
      setSuccessMsg(`Hardware machine lock cleared for ${key}`);
      await fetchLicenses();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset HWID");
    }
  };

  const handleRevoke = async (key: string) => {
    if (!confirm(`Revoke license ${key}?`)) return;
    try {
      await api.post(`/licenses/admin/${encodeURIComponent(key)}/revoke`, {
        reason: "Revoked via Web Admin",
      });
      await fetchLicenses();
      setSuccessMsg(`Revoked ${key}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Revocation failed");
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExport = () => {
    if (licenses.length === 0) return;
    const header = "Key,Plan Tier,Days,Max Accounts,Status,Customer,Expires\n";
    const rows = licenses.map((l) => `"${l.key}","${l.plan_tier}","${l.duration_days}","${l.max_accounts}","${l.status}","${l.customer_email || ""}","${l.expires_at}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `licenses_${Date.now()}.csv`;
    a.click();
  };

  const getTierBadge = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "lifetime":
      case "agency":
        return <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono text-[10px]">👑 {tier.toUpperCase()}</Badge>;
      case "1yr":
      case "2yr":
      case "3yr":
      case "pro":
        return <Badge className="bg-primary/10 text-primary border border-primary/20 font-mono text-[10px]">⚡ {tier.toUpperCase()}</Badge>;
      case "1mo":
      case "starter":
        return <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-[10px]">🚀 {tier.toUpperCase()}</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground font-mono text-[10px]">{tier.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 mb-2 shadow-sm">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Cryptographic Software Licensing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Desktop License Generator
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Generate, machine-bind, extend, and audit cryptographic activation keys (TGGEEKS-XXXX).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLicenses}
            disabled={loading}
            className="border-border/60 hover:bg-secondary/40 font-semibold"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={licenses.length === 0}
            className="border-border/60 hover:bg-secondary/40 font-semibold"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")}>✕</button>
        </div>
      )}

      {/* License Generator & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Generator Form (7 cols) */}
        <Card className="lg:col-span-7 border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Cryptographic Key Minting Engine
            </CardTitle>
            <CardDescription className="text-xs">
              Mints HMAC-SHA256 authenticated license keys with hardware machine-locking logic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Plan Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Duration & Tier Preset</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: "demo", label: "24h Demo" },
                    { id: "1mo", label: "1 Month" },
                    { id: "1yr", label: "1 Year" },
                    { id: "2yr", label: "2 Years" },
                    { id: "3yr", label: "3 Years" },
                    { id: "lifetime", label: "Lifetime" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPlanTier(t.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                        planTier === t.id
                          ? "border-primary bg-primary/15 text-primary shadow-sm"
                          : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Max Accounts</label>
                  <Input
                    type="number"
                    value={maxAccounts}
                    onChange={(e) => setMaxAccounts(Number(e.target.value))}
                    className="bg-secondary/30 border-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Max Campaigns</label>
                  <Input
                    type="number"
                    value={maxCampaigns}
                    onChange={(e) => setMaxCampaigns(Number(e.target.value))}
                    className="bg-secondary/30 border-border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Team Seats</label>
                  <Input
                    type="number"
                    value={teamSeats}
                    onChange={(e) => setTeamSeats(Number(e.target.value))}
                    className="bg-secondary/30 border-border"
                  />
                </div>
              </div>

              {/* Customer Email & Batch Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Customer Email (Optional binding)</label>
                  <Input
                    type="email"
                    placeholder="user@domain.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="bg-secondary/30 border-border text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Batch Quantity</label>
                  <select
                    value={batchCount}
                    onChange={(e) => setBatchCount(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-border bg-secondary/30 px-3 text-xs text-foreground outline-none focus:border-primary"
                  >
                    <option value={1}>1 Single Key</option>
                    <option value={5}>5 Keys (Batch)</option>
                    <option value={10}>10 Keys (Batch)</option>
                    <option value={25}>25 Keys (Bulk)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={generating}
                  className="bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/10"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                  Generate {batchCount} Key(s)
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Output Tray (5 cols) */}
        <Card className="lg:col-span-5 border-border/60 bg-card/60 backdrop-blur-md flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Fresh Minted Keys</span>
              {generatedKeys.length > 0 && (
                <button
                  onClick={() => {
                    const text = generatedKeys.map((k) => k.key).join("\n");
                    navigator.clipboard.writeText(text);
                    setCopiedKey("ALL");
                    setTimeout(() => setCopiedKey(null), 2000);
                  }}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                >
                  {copiedKey === "ALL" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === "ALL" ? "Copied All" : "Copy All"}</span>
                </button>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Newly created keys ready for distribution.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {generatedKeys.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {generatedKeys.map((k, i) => (
                  <div key={i} className="p-3 rounded-xl bg-background/80 border border-primary/20 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-foreground block select-all">{k.key}</span>
                      <span className="text-[10px] text-muted-foreground">{k.plan_tier.toUpperCase()} &bull; Exp: {new Date(k.expires_at).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(k.key)}
                      className="p-1.5 rounded-lg bg-card hover:bg-secondary/40 text-primary transition-colors shrink-0"
                      title="Copy Key"
                    >
                      {copiedKey === k.key ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-xs">
                <KeyRound className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <span>Generated keys will be displayed here with one-click copy.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* License Vault Table */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Cryptographic License Vault ({licenses.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Database of issued activation keys and machine HWID locking states.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search keys..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchLicenses()}
                className="pl-8 h-9 text-xs bg-secondary/30 border-border"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-border bg-secondary/30 px-3 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : licenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No license keys found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 text-xs">
                    <TableHead className="pl-6">License Key</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Customer Binding</TableHead>
                    <TableHead>Machine HWID</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((lic) => (
                    <TableRow key={lic.key} className="border-border/30 hover:bg-secondary/20 transition-colors text-xs">
                      <TableCell className="pl-6 font-mono font-bold select-all">
                        <div className="flex items-center gap-1.5">
                          <span>{lic.key}</span>
                          <button onClick={() => handleCopy(lic.key)} className="text-muted-foreground hover:text-primary">
                            {copiedKey === lic.key ? <Check className="h-3 w-3 text-teal-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </TableCell>

                      <TableCell>{getTierBadge(lic.plan_tier)}</TableCell>

                      <TableCell className="text-muted-foreground text-xs truncate max-w-[150px]">
                        {lic.customer_email || "—"}
                      </TableCell>

                      <TableCell className="font-mono text-[11px]">
                        {lic.hwid ? (
                          <span className="text-teal-400" title={lic.hwid}>{lic.hwid.slice(0, 12)}...</span>
                        ) : (
                          <span className="text-muted-foreground">Unbound</span>
                        )}
                      </TableCell>

                      <TableCell className="text-muted-foreground font-mono text-[11px]">
                        {new Date(lic.expires_at).toLocaleDateString()}
                      </TableCell>

                      <TableCell>
                        {lic.status === "active" ? (
                          <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[10px]">Active</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">Revoked</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          {lic.hwid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnbindHwid(lic.key)}
                              className="h-7 text-[10px] text-muted-foreground hover:text-cyan-400"
                              title="Clear Machine HWID Lock"
                            >
                              <Unlock className="h-3.5 w-3.5 mr-1" />
                              Reset HWID
                            </Button>
                          )}
                          {lic.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(lic.key)}
                              className="h-7 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Revoke License"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
