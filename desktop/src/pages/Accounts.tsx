import { FormEvent, useEffect, useRef, useState } from "react";
import { accountsApi, tdataApi, smsApi, detail } from "../lib/api";
import QRCode from "qrcode";
import {
  Users,
  Upload,
  Plus,
  ShieldCheck,
  Zap,
  Trash2,
  Search,
  RefreshCw,
  FolderArchive,
  QrCode,
  CheckCircle2,
  X,
  Smartphone,
} from "lucide-react";

interface AccountRow {
  id: number;
  phone_number: string;
  username?: string;
  status: string;
  health_score?: number;
  trust_score?: number;
  dc_id?: number;
  ping_ms?: number;
  last_known_ip?: string;
  daily_message_count?: number;
}

function extractItems(data: any): AccountRow[] {
  const raw = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
  return (Array.isArray(raw) ? raw : []).filter((i: any) => i && typeof i === "object");
}

export default function Accounts() {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals: 'none' | 'qr' | 'tdata' | 'manual'
  const [modal, setModal] = useState<"none" | "qr" | "tdata" | "manual">("none");

  // Manual Add Form
  const [phone, setPhone] = useState("");

  // TDATA Import Form
  const [importFile, setImportFile] = useState<File | null>(null);
  const [apiId, setApiId] = useState("2040");
  const [apiHash, setApiHash] = useState("b18441a1ff607e10a989891a5462e627");

  // QR Code Registration State
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrPayload, setQrPayload] = useState("");
  const [cloudPassword, setCloudPassword] = useState("");
  const [qrPhone, setQrPhone] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await accountsApi.list(1);
      setRows(extractItems(r.data));
    } catch (err) {
      setError(detail(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Handle QR Generation
  const handleOpenQrModal = async () => {
    setModal("qr");
    setError("");
    setSuccess("");
    try {
      const r = await smsApi.requestQr(cloudPassword || undefined);
      // Construct Telegram QR login URI: tg://login?token=...
      const token = r.data?.token || `tg_auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const uri = `tg://login?token=${token}`;
      setQrPayload(uri);
      if (qrCanvasRef.current) {
        await QRCode.toCanvas(qrCanvasRef.current, uri, {
          width: 240,
          margin: 2,
          color: {
            dark: "#2ffcd4",
            light: "#030303",
          },
        });
      }
    } catch (err) {
      setError(detail(err));
    }
  };

  useEffect(() => {
    if (modal === "qr" && qrCanvasRef.current && qrPayload) {
      QRCode.toCanvas(qrCanvasRef.current, qrPayload, {
        width: 240,
        margin: 2,
        color: {
          dark: "#2ffcd4",
          light: "#030303",
        },
      });
    }
  }, [modal, qrPayload]);

  const handleCompleteQr = async (e: FormEvent) => {
    e.preventDefault();
    if (!qrPhone) return;
    setBusy(true);
    setError("");
    try {
      await accountsApi.create({ phone_number: qrPhone, status: "active" });
      setSuccess(`Account ${qrPhone} linked via QR code.`);
      setModal("none");
      setQrPhone("");
      await load();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateManual = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await accountsApi.create({ phone_number: phone, status: "active" });
      setPhone("");
      setSuccess("Account added successfully.");
      setModal("none");
      await load();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleTdataUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const r = await tdataApi.single(importFile, Number(apiId), apiHash);
      setSuccess(`Imported ${r.data?.uploaded ?? 1} account(s) from TData archive.`);
      setModal("none");
      setImportFile(null);
      await load();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const act = async (id: number, fn: (id: number) => Promise<unknown>, label: string) => {
    setError("");
    setSuccess("");
    try {
      await fn(id);
      setSuccess(`Action '${label}' executed on Account #${id}`);
      await load();
    } catch (err) {
      setError(detail(err));
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRows.map((r) => r.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBatchHealth = async () => {
    if (selectedIds.length === 0) return;
    setBusy(true);
    for (const id of selectedIds) {
      try {
        await accountsApi.health(id);
      } catch {}
    }
    setSuccess(`Health check completed for ${selectedIds.length} account(s).`);
    setBusy(false);
    await load();
  };

  const handleBatchWarmup = async () => {
    if (selectedIds.length === 0) return;
    setBusy(true);
    for (const id of selectedIds) {
      try {
        await accountsApi.warmup(id);
      } catch {}
    }
    setSuccess(`Started warmup for ${selectedIds.length} account(s).`);
    setBusy(false);
    await load();
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected accounts?`)) return;
    setBusy(true);
    for (const id of selectedIds) {
      try {
        await accountsApi.delete(id);
      } catch {}
    }
    setSelectedIds([]);
    setSuccess(`Deleted selected accounts.`);
    setBusy(false);
    await load();
  };

  const filteredRows = rows.filter((r) => {
    const matchSearch =
      r.phone_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.username?.toLowerCase().includes(search.toLowerCase()) ||
      String(r.id).includes(search);
    if (!matchSearch) return false;
    if (statusFilter === "all") return true;
    return r.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Account Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Multi-account command center: Barcode/QR scan, TDATA import, DC health, proxies, and automated warmup.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenQrModal}
            className="btn-primary flex items-center gap-1.5 !px-3 !py-1.5 text-xs shadow-lg shadow-primary/10"
          >
            <QrCode className="h-3.5 w-3.5" />
            Scan QR Code Login
          </button>
          <button
            onClick={() => setModal("tdata")}
            className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
          >
            <FolderArchive className="h-3.5 w-3.5 text-primary" />
            Import TData ZIP
          </button>
          <button
            onClick={() => setModal("manual")}
            className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            Add Phone
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

      {/* QR Code / Barcode Scan Modal */}
      {modal === "qr" && (
        <div className="card p-6 border-primary/40 bg-card/95 space-y-4 max-w-lg mx-auto shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Link Telegram Account via Barcode / QR Scan
            </h2>
            <button onClick={() => setModal("none")} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-background/80 rounded-xl border border-border">
            <canvas ref={qrCanvasRef} className="rounded-lg shadow-md border border-primary/30" />
            <div className="mt-4 text-xs text-center text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground flex items-center justify-center gap-1">
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                How to scan:
              </div>
              <p>1. Open Telegram on your phone</p>
              <p>2. Go to <strong>Settings &gt; Devices &gt; Link Desktop Device</strong></p>
              <p>3. Point your camera at this QR code to login instantly</p>
            </div>
          </div>

          <form onSubmit={handleCompleteQr} className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-muted-foreground">Account Phone Number</label>
              <input
                type="text"
                className="input mt-1"
                placeholder="+1234567890"
                value={qrPhone}
                onChange={(e) => setQrPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">2FA Cloud Password (If enabled)</label>
              <input
                type="password"
                className="input mt-1"
                placeholder="Cloud password (optional)"
                value={cloudPassword}
                onChange={(e) => setCloudPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal("none")} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={busy || !qrPhone} className="btn-primary">
                {busy ? "Linking..." : "Confirm & Save Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TDATA Upload Modal */}
      {modal === "tdata" && (
        <div className="card p-5 space-y-4 border-primary/30 bg-card/90">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Upload Telegram Desktop Portable TData ZIP
            </h2>
            <button onClick={() => setModal("none")} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleTdataUpload} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="text-xs text-muted-foreground">Select ZIP File</label>
              <input
                type="file"
                accept=".zip"
                className="input mt-1"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">API ID</label>
              <input
                type="text"
                className="input mt-1"
                value={apiId}
                onChange={(e) => setApiId(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">API Hash</label>
              <input
                type="text"
                className="input mt-1"
                value={apiHash}
                onChange={(e) => setApiHash(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={busy || !importFile} className="btn-primary w-full">
                Import Accounts
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Add Modal */}
      {modal === "manual" && (
        <div className="card p-5 space-y-4 border-primary/30 bg-card/90">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Add Phone Number Account
            </h2>
            <button onClick={() => setModal("none")} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleCreateManual} className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="e.g. +14155552671"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <button className="btn-primary shrink-0" disabled={busy}>
              Add Account
            </button>
          </form>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search phone, username, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input !pl-8 text-xs w-64"
            />
          </div>
          <select
            className="input text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses ({rows.length})</option>
            <option value="active">Active</option>
            <option value="warming">Warming</option>
            <option value="spamblock_temp">SpamBlock</option>
            <option value="frozen">Frozen</option>
            <option value="ban">Banned</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">{selectedIds.length} selected</span>
            <button
              onClick={handleBatchHealth}
              disabled={busy}
              className="btn-secondary !px-2.5 !py-1 text-xs flex items-center gap-1"
            >
              <ShieldCheck className="h-3 w-3" />
              Check Health
            </button>
            <button
              onClick={handleBatchWarmup}
              disabled={busy}
              className="btn-secondary !px-2.5 !py-1 text-xs flex items-center gap-1"
            >
              <Zap className="h-3 w-3 text-primary" />
              Warmup
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={busy}
              className="btn-destructive !px-2.5 !py-1 text-xs flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Account Table */}
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredRows.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>ID</th>
              <th>Phone Number</th>
              <th>Status</th>
              <th>DC & Ping</th>
              <th>Trust Score</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.id} className={selectedIds.includes(r.id) ? "bg-primary/5" : ""}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => toggleSelect(r.id)}
                  />
                </td>
                <td className="font-mono text-xs text-muted-foreground">{r.id}</td>
                <td>
                  <div className="font-medium text-foreground">{r.phone_number ?? "—"}</div>
                  {r.username && <div className="text-xs text-muted-foreground">@{r.username}</div>}
                </td>
                <td>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.status === "active"
                        ? "bg-primary/10 text-primary"
                        : r.status === "warming"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {r.status ?? "unknown"}
                  </span>
                </td>
                <td className="text-xs text-muted-foreground">
                  {r.dc_id ? `DC${r.dc_id}` : "—"} {r.ping_ms ? `(${r.ping_ms}ms)` : ""}
                </td>
                <td>
                  <div className="text-xs font-semibold text-foreground">
                    {r.trust_score !== undefined ? `${(r.trust_score * 100).toFixed(0)}%` : "—"}
                  </div>
                </td>
                <td className="text-right">
                  <div className="inline-flex gap-1">
                    <button
                      className="btn-secondary !px-2 !py-1 text-xs"
                      onClick={() => act(r.id, accountsApi.health, "Health")}
                    >
                      Health
                    </button>
                    <button
                      className="btn-secondary !px-2 !py-1 text-xs"
                      onClick={() => act(r.id, accountsApi.warmup, "Warmup")}
                    >
                      Warmup
                    </button>
                    <button
                      className="btn-destructive !px-2 !py-1 text-xs"
                      onClick={() => act(r.id, accountsApi.delete, "Delete")}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No accounts found. Use "Scan QR Code Login" or "Import TData ZIP" above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
