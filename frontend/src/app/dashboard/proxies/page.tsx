"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Network,
  Activity,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Zap,
  SlidersHorizontal,
  Search,
  Upload,
  Loader2,
  Clock,
  Shield,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface ProxyItem {
  id: number;
  host: string;
  port: number;
  username?: string;
  proxy_type: string;
  status: string;
  latency_ms?: number;
  fail_count: number;
  country?: string;
  last_checked?: string;
  added_at?: string;
}

interface ProxyStats {
  total: number;
  alive: number;
  dead: number;
  suspect: number;
  untested: number;
  avg_latency_ms: number;
  coverage_pct: number;
}

export default function ProxiesPage() {
  const [proxies, setProxies] = useState<ProxyItem[]>([]);
  const [stats, setStats] = useState<ProxyStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [testing, setTesting] = useState<boolean>(false);
  const [assigning, setAssigning] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>("");
  const [importType, setImportType] = useState<string>("socks5");
  const [assignStrategy, setAssignStrategy] = useState<string>("round_robin");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchProxiesAndStats = useCallback(async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        api.get("/proxies/"),
        api.get("/proxies/stats"),
      ]);
      setProxies(pRes.data?.items || []);
      setStats(sRes.data || null);
    } catch (e) {
      console.error("Error fetching proxies", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProxiesAndStats();
  }, [fetchProxiesAndStats]);

  const handleTestAll = async () => {
    setTesting(true);
    setStatusMessage(null);
    try {
      const res = await api.post("/proxies/test-all", { concurrency: 25 });
      setStatusMessage(`Tested ${res.data.total} proxies: ${res.data.alive} alive, ${res.data.dead} dead`);
      await fetchProxiesAndStats();
    } catch (e: any) {
      setStatusMessage("Error running proxy test probe");
    } finally {
      setTesting(false);
    }
  };

  const handleAssignProxies = async () => {
    setAssigning(true);
    setStatusMessage(null);
    try {
      const res = await api.post("/proxies/assign", {
        account_ids: [],
        strategy: assignStrategy,
      });
      setStatusMessage(`Assigned alive proxies to ${res.data.assigned_count} accounts (${assignStrategy})`);
      setShowAssignModal(false);
      await fetchProxiesAndStats();
    } catch (e: any) {
      setStatusMessage("Error assigning proxies");
    } finally {
      setAssigning(false);
    }
  };

  const handleBulkImport = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    setStatusMessage(null);
    try {
      const res = await api.post("/proxies/bulk-import", {
        raw_text: importText,
        proxy_type: importType,
      });
      setStatusMessage(`Imported ${res.data.added} proxies (${res.data.invalid} invalid lines skipped)`);
      setShowImportModal(false);
      setImportText("");
      await fetchProxiesAndStats();
    } catch (e: any) {
      setStatusMessage("Error during bulk proxy import");
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteProxy = async (id: number) => {
    try {
      await api.delete(`/proxies/${id}`);
      setProxies((prev) => prev.filter((p) => p.id !== id));
      fetchProxiesAndStats();
    } catch (e) {
      console.error("Error deleting proxy", e);
    }
  };

  const filteredProxies = proxies.filter((p) => {
    const matchesSearch =
      p.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.port.toString().includes(searchQuery) ||
      (p.country && p.country.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === "all" || p.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            Proxy Infrastructure & Routing Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real MTProto SOCKS5/HTTP probe engine, auto-rotation on ban detection, and geo-matching
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-secondary flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Upload className="h-4 w-4 text-primary" />
            Bulk Import
          </button>

          <button
            onClick={() => setShowAssignModal(true)}
            className="px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-secondary flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Layers className="h-4 w-4 text-accent" />
            Assign to Accounts
          </button>

          <button
            onClick={handleTestAll}
            disabled={testing}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing Pool...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Test All Proxies
              </>
            )}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-xs font-semibold text-foreground flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-muted-foreground hover:text-foreground text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Total Proxies
          </span>
          <span className="text-2xl font-black text-foreground mt-1 block">
            {stats?.total || 0}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-success block">
            Alive (Active)
          </span>
          <span className="text-2xl font-black text-success mt-1 block">
            {stats?.alive || 0}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-destructive block">
            Dead (Failed)
          </span>
          <span className="text-2xl font-black text-destructive mt-1 block">
            {stats?.dead || 0}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-warning block">
            Suspect (Rotated)
          </span>
          <span className="text-2xl font-black text-warning mt-1 block">
            {stats?.suspect || 0}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Avg DC2 Ping
          </span>
          <span className="text-2xl font-black text-foreground mt-1 block">
            {stats?.avg_latency_ms || 0} ms
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
            Health Ratio
          </span>
          <span className="text-2xl font-black text-primary mt-1 block">
            {stats?.coverage_pct || 0}%
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-3.5 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search host, port, country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["all", "alive", "dead", "untested", "suspect"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all",
                filterStatus === st
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Proxies Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Host / Port</th>
                <th className="py-3 px-4">Authentication</th>
                <th className="py-3 px-4">Latency (DC2)</th>
                <th className="py-3 px-4">Fail Count</th>
                <th className="py-3 px-4">Last Checked</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading proxies...
                  </td>
                </tr>
              ) : filteredProxies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No proxies found. Use "Bulk Import" to add your SOCKS5/HTTP proxy list.
                  </td>
                </tr>
              ) : (
                filteredProxies.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      {p.status === "alive" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success/15 text-success font-bold text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> ALIVE
                        </span>
                      ) : p.status === "dead" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-bold text-[10px]">
                          <XCircle className="h-3 w-3" /> DEAD
                        </span>
                      ) : p.status === "suspect" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warning/15 text-warning font-bold text-[10px]">
                          <AlertTriangle className="h-3 w-3" /> SUSPECT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-bold text-[10px]">
                          <HelpCircle className="h-3 w-3" /> UNTESTED
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold uppercase text-[11px] text-foreground">
                      {p.proxy_type}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-foreground">
                      {p.host}:{p.port}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {p.username ? (
                        <span className="px-2 py-0.5 rounded bg-secondary border border-border">
                          {p.username}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">No Auth</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {p.latency_ms ? (
                        <span
                          className={cn(
                            "font-mono font-bold text-xs",
                            p.latency_ms < 200
                              ? "text-success"
                              : p.latency_ms < 500
                              ? "text-warning"
                              : "text-destructive"
                          )}
                        >
                          {p.latency_ms} ms
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {p.fail_count || 0}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      {p.last_checked
                        ? new Date(p.last_checked).toLocaleTimeString()
                        : "Never"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteProxy(p.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete proxy"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Bulk Import Proxies
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Default Protocol
                </label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground"
                >
                  <option value="socks5">SOCKS5</option>
                  <option value="socks4">SOCKS4</option>
                  <option value="http">HTTP</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Proxy List (One per line)
                </label>
                <textarea
                  rows={8}
                  placeholder={`192.168.1.1:1080\n10.0.0.1:8080:username:password\nsocks5://user:pass@proxy.example.com:9050`}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-secondary border border-border text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Supported Formats:</p>
                <p>• host:port</p>
                <p>• host:port:username:password</p>
                <p>• socks5://username:password@host:port</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={importing || !importText.trim()}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-md shadow-primary/20 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import Proxies"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-accent" />
                Assign Proxies to Accounts
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Routing Strategy
                </label>
                <select
                  value={assignStrategy}
                  onChange={(e) => setAssignStrategy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground"
                >
                  <option value="round_robin">Round Robin (Even Distribution)</option>
                  <option value="least_used">Least Used (Prioritize Unassigned Proxies)</option>
                  <option value="geo_match">Geo Match (Match Account Country Code)</option>
                  <option value="random">Random Selection</option>
                </select>
              </div>

              <p className="text-xs text-muted-foreground">
                This will iterate through your accounts in the database and assign the lowest-latency active proxies from your pool.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignProxies}
                disabled={assigning}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-md shadow-primary/20 disabled:opacity-50"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Execute Assignment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
