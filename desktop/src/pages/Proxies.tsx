import { useEffect, useState } from "react";
import { proxiesApi, detail } from "../lib/api";
import { Network, ShieldCheck, RefreshCw, Plus, Upload, Trash2, Globe, Activity, CheckCircle2, XCircle } from "lucide-react";

export default function Proxies() {
  const [proxies, setProxies] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tabs: 'list' | 'add' | 'bulk' | 'assign'
  const [tab, setTab] = useState<"list" | "add" | "bulk" | "assign">("list");

  // Single Add Form
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [proxyType, setProxyType] = useState("socks5");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");

  // Bulk Import Form
  const [bulkText, setBulkText] = useState("");
  const [bulkType, setBulkType] = useState("socks5");

  // Assign Form
  const [accountId, setAccountId] = useState("");
  const [assignCountry, setAssignCountry] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [listRes, statsRes] = await Promise.allSettled([
        proxiesApi.listAll(),
        proxiesApi.stats(),
      ]);
      if (listRes.status === "fulfilled") {
        const raw = listRes.value.data?.proxies ?? listRes.value.data ?? [];
        setProxies(Array.isArray(raw) ? raw : []);
      }
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
    } catch (err) {
      setError(detail(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host || !port) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await proxiesApi.createProxy({
        host: host.trim(),
        port: parseInt(port, 10),
        proxy_type: proxyType,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        country: country.trim().toUpperCase() || undefined,
      });
      setSuccess(`Added proxy ${host}:${port} successfully.`);
      setHost("");
      setPort("");
      setUsername("");
      setPassword("");
      setCountry("");
      setTab("list");
      await load();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const r = await proxiesApi.bulkImport(bulkText, bulkType);
      setSuccess(`Imported ${r.data?.created ?? 0} proxy servers successfully.`);
      setBulkText("");
      setTab("list");
      await load();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Delete proxy #${id}?`)) return;
    setBusy(true);
    try {
      await proxiesApi.deleteProxy(id);
      setSuccess(`Proxy #${id} deleted.`);
      await load();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleHealthCheck = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await proxiesApi.healthCheck();
      setSuccess("Triggered global proxy pool health check.");
      await load();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const r = await proxiesApi.assign(Number(accountId), assignCountry || undefined);
      setSuccess(`Proxy assigned to Account #${accountId}: ${JSON.stringify(r.data?.proxy ?? r.data)}`);
      setAccountId("");
      setAssignCountry("");
      await load();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            Proxy Infrastructure
          </h1>
          <p className="text-sm text-muted-foreground">
            SOCKS5 & HTTP pool management, bulk import, latency benchmarking, and auto-allocation.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("add")}
            className={`btn-secondary flex items-center gap-1.5 !px-3 !py-1.5 text-xs ${tab === "add" ? "bg-primary/20 text-primary border-primary/40" : ""}`}
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            Add Single Proxy
          </button>
          <button
            onClick={() => setTab("bulk")}
            className={`btn-secondary flex items-center gap-1.5 !px-3 !py-1.5 text-xs ${tab === "bulk" ? "bg-primary/20 text-primary border-primary/40" : ""}`}
          >
            <Upload className="h-3.5 w-3.5 text-primary" />
            Bulk Import
          </button>
          <button
            onClick={handleHealthCheck}
            disabled={busy}
            className="btn-primary flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Check Latency
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {error && <div className="card border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
      {success && <div className="card border-primary/50 bg-primary/10 p-3 text-xs text-primary">{success}</div>}

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs font-medium text-muted-foreground">Configured Proxies</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{proxies.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-medium text-muted-foreground">Healthy in Pool</div>
          <div className="mt-1 text-2xl font-bold text-primary">
            {stats?.healthy ?? proxies.filter((p) => p.status === "healthy").length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-medium text-muted-foreground">Allocated to Accounts</div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {proxies.filter((p) => p.allocated_to_account_id).length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-medium text-muted-foreground">Average Latency</div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {stats?.avg_latency_ms ? `${Math.round(stats.avg_latency_ms)} ms` : "—"}
          </div>
        </div>
      </div>

      {/* Single Add Form Card */}
      {tab === "add" && (
        <div className="card p-5 space-y-4 border-primary/30 bg-card/90">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Add Single Proxy Server
            </h2>
            <button onClick={() => setTab("list")} className="text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreateSingle} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs text-muted-foreground">Protocol Type</label>
              <select className="input mt-1" value={proxyType} onChange={(e) => setProxyType(e.target.value)}>
                <option value="socks5">SOCKS5</option>
                <option value="http">HTTP / HTTPS</option>
                <option value="socks4">SOCKS4</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Host / IP Address</label>
              <input
                type="text"
                className="input mt-1"
                placeholder="192.168.1.1 or proxy.domain.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Port</label>
              <input
                type="number"
                className="input mt-1"
                placeholder="1080, 8080, etc."
                value={port}
                onChange={(e) => setPort(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Username (Optional)</label>
              <input
                type="text"
                className="input mt-1"
                placeholder="Proxy username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Password (Optional)</label>
              <input
                type="password"
                className="input mt-1"
                placeholder="Proxy password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Country Code (Optional)</label>
              <input
                type="text"
                className="input mt-1 uppercase"
                placeholder="US, DE, GB, SG, etc."
                maxLength={3}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setTab("list")} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="btn-primary">
                {busy ? "Saving..." : "Save Proxy"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Import Form Card */}
      {tab === "bulk" && (
        <div className="card p-5 space-y-4 border-primary/30 bg-card/90">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Bulk Import Proxy List
            </h2>
            <button onClick={() => setTab("list")} className="text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste proxy lines in any standard format: <br />
            <code>ip:port</code> or <code>ip:port:user:pass</code> or <code>socks5://user:pass@ip:port</code>
          </p>
          <form onSubmit={handleBulkImport} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Default Protocol</label>
              <select className="input mt-1 max-w-xs" value={bulkType} onChange={(e) => setBulkType(e.target.value)}>
                <option value="socks5">SOCKS5</option>
                <option value="http">HTTP</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Proxy List (One per line)</label>
              <textarea
                className="input mt-1 font-mono min-h-36 text-xs"
                placeholder={"192.168.1.100:1080\n192.168.1.101:1080:username:password\nsocks5://admin:secret@10.0.0.1:1080"}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTab("list")} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="btn-primary">
                {busy ? "Importing..." : "Import Proxies"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Proxy List Table */}
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>ID</th>
              <th>Protocol</th>
              <th>Server Host : Port</th>
              <th>Auth</th>
              <th>Country</th>
              <th>Status</th>
              <th>Latency</th>
              <th>Assigned Account</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {proxies.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs text-muted-foreground">{p.id}</td>
                <td>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase font-bold">
                    {p.proxy_type || "SOCKS5"}
                  </span>
                </td>
                <td className="font-mono text-xs font-medium text-foreground">
                  {p.host}:{p.port}
                </td>
                <td className="text-xs text-muted-foreground">{p.username ? p.username : "No Auth"}</td>
                <td className="text-xs font-semibold text-foreground">{p.country || "—"}</td>
                <td>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.status === "healthy"
                        ? "bg-primary/10 text-primary"
                        : p.status === "failed"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.status || "untested"}
                  </span>
                </td>
                <td className="text-xs text-muted-foreground">
                  {p.response_time_ms ? `${Math.round(p.response_time_ms)} ms` : "—"}
                </td>
                <td className="text-xs text-muted-foreground">
                  {p.allocated_to_account_id ? `Account #${p.allocated_to_account_id}` : "Unallocated"}
                </td>
                <td className="text-right">
                  <button
                    className="btn-destructive !px-2 !py-1 text-xs"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
            {proxies.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  No proxy servers configured yet. Click "Add Single Proxy" or "Bulk Import" above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
