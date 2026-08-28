"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, AlertTriangle, XCircle,
  Snowflake, Star, Archive, Trash2,
  RefreshCw, Shield, Wifi, User,
  ChevronRight, MoreHorizontal, Search,
  Sliders, Plus, Loader2, Download, Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ── Folder Config ─────────────────────────────────────────────────────────────
const FOLDERS = [
  {
    id: "active",
    label: "Active",
    icon: CheckCircle,
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    glow: "shadow-emerald-500/20",
    description: "Ready for operations",
  },
  {
    id: "temp_spam",
    label: "Temp SpamBlock",
    icon: AlertTriangle,
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    glow: "shadow-amber-500/20",
    description: "Temporary restriction active",
  },
  {
    id: "perm_ban",
    label: "Perm Ban",
    icon: XCircle,
    color: "text-destructive",
    border: "border-destructive/30",
    bg: "bg-destructive/10",
    glow: "shadow-destructive/20",
    description: "Permanently restricted by Telegram",
  },
  {
    id: "frozen",
    label: "Frozen",
    icon: Snowflake,
    color: "text-sky-400",
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
    glow: "shadow-sky-500/20",
    description: "Inactive — warming or resting",
  },
  {
    id: "premium",
    label: "Premium",
    icon: Star,
    color: "text-warning",
    border: "border-warning/30",
    bg: "bg-warning/10",
    glow: "shadow-warning/20",
    description: "Telegram Premium accounts",
  },
  {
    id: "archive",
    label: "Archive",
    icon: Archive,
    color: "text-muted-foreground",
    border: "border-border",
    bg: "bg-secondary",
    glow: "shadow-black/20",
    description: "Stored — not in active use",
  },
  {
    id: "deleted",
    label: "Deleted",
    icon: Trash2,
    color: "text-muted-foreground/60",
    border: "border-border/50",
    bg: "bg-secondary/50",
    glow: "shadow-black/20",
    description: "Removed or self-deleted accounts",
  },
] as const;

type FolderID = typeof FOLDERS[number]["id"];

interface Account {
  id: string;
  phone: string;
  username: string | null;
  first_name: string;
  folder: FolderID;
  premium: boolean;
  has_proxy: boolean;
  last_check: string | null;
  flood_until: string | null;
  trust_score: number;
  session_format: "session+json" | "tdata";
}

interface FolderCounts {
  active: number;
  temp_spam: number;
  perm_ban: number;
  frozen: number;
  premium: number;
  archive: number;
  deleted: number;
}

// ── Bulk Actions ──────────────────────────────────────────────────────────────
const BULK_ACTIONS = [
  { id: "check",         label: "Run Health Check" },
  { id: "warm",          label: "Start Warming" },
  { id: "assign_proxy",  label: "Assign Proxy" },
  { id: "move_folder",   label: "Move to Folder" },
  { id: "export",        label: "Export Sessions" },
  { id: "delete",        label: "Delete Selected" },
] as const;

export default function AccountsPage() {
  const [activeFolder, setActiveFolder] = useState<FolderID>("active");
  const [accounts, setAccounts]         = useState<Account[]>([]);
  const [counts, setCounts]             = useState<FolderCounts | null>(null);
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(false);
  const [bulkAction, setBulkAction]     = useState("");
  const [runningCheck, setRunningCheck] = useState(false);
  const [warmingAccountIds, setWarmingAccountIds] = useState<Set<string>>(new Set());

  // Edit Modal State
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Fetch accounts & warming jobs ───────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, warmRes] = await Promise.allSettled([
        api.get(`/accounts?folder=${activeFolder}&search=${encodeURIComponent(search)}`),
        api.get("/warmup/jobs"),
      ]);
      if (accRes.status === "fulfilled") {
        setAccounts(accRes.value.data.accounts || []);
        setCounts(accRes.value.data.counts || null);
      }
      if (warmRes.status === "fulfilled" && warmRes.value.data?.jobs) {
        const activeWarm = new Set<string>(
          warmRes.value.data.jobs
            .filter((j: any) => j.status === "running")
            .map((j: any) => String(j.account_id))
        );
        setWarmingAccountIds(activeWarm);
      }
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [activeFolder, search]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // ── Bulk Status Check + Auto-Sort ────────────────────────────────────────
  const runBulkCheck = async () => {
    setRunningCheck(true);
    try {
      await api.post("/workflow/run-step", {
        stage_number: 2,
        step_id: "2A",
        operation: "check_all_accounts",
        params: {},
      });
      await fetchAccounts();
    } catch (e) {
      console.error("Bulk check failed", e);
    } finally {
      setRunningCheck(false);
    }
  };

  // ── Select / Deselect ────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(accounts.map((a) => a.id)));
  };

  const clearSelection = () => setSelected(new Set());

  // ── Execute Bulk Action ──────────────────────────────────────────────────
  const executeBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return;
    const ids = Array.from(selected);

    const actionMap: Record<string, { stage: number; step: string; action: string }> = {
      check:        { stage: 2, step: "2A", action: "check_all_accounts" },
      warm:         { stage: 2, step: "2C", action: "start_warmup" },
      assign_proxy: { stage: 2, step: "2B", action: "check_proxies" },
      move_folder:  { stage: 1, step: "1D", action: "bulk_folder_sort" },
    };

    const mapped = actionMap[bulkAction];
    if (mapped) {
      try {
        await api.post("/workflow/run-step", {
          stage_number: mapped.stage,
          step_id: mapped.step,
          operation: mapped.action,
          params: { account_ids: ids },
        });
      } catch (e) {
        console.error("Bulk action failed", e);
      }
    }
    clearSelection();
    await fetchAccounts();
  };

  const folder = FOLDERS.find((f) => f.id === activeFolder) || FOLDERS[0];

  const handleSaveEdit = async () => {
    if (!editingAccount) return;
    setSavingEdit(true);
    try {
      await api.put(`/accounts/${editingAccount.id}`, {
        first_name: editFirstName,
        username: editUsername,
      });
      await fetchAccounts();
      setEditingAccount(null);
    } catch (e) {
      console.error("Failed to save account", e);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Account Arsenal
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all Telegram MTProto sessions across 7 smart status folders
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/accounts/upload"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary border border-border text-foreground text-xs font-bold hover:bg-surface transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Account
          </Link>
          <button
            onClick={runBulkCheck}
            disabled={runningCheck}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-primary/10 border border-primary/30
                       text-primary text-xs font-bold hover:bg-primary/20
                       transition disabled:opacity-50 shadow-sm"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", runningCheck && "animate-spin")}
            />
            {runningCheck ? "Inspecting Accounts..." : "Run Bulk Status Check"}
          </button>
        </div>
      </div>

      {/* ── Folder Tabs ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {FOLDERS.map((f) => {
          const Icon = f.icon;
          const isActive = f.id === activeFolder;
          const count = counts?.[f.id] ?? 0;
          return (
            <button
              key={f.id}
              onClick={() => {
                setActiveFolder(f.id as FolderID);
                clearSelection();
              }}
              className={cn(
                "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left",
                isActive
                  ? `${f.bg} ${f.border} shadow-lg ${f.glow}`
                  : "bg-card border-border hover:bg-secondary/60"
              )}
            >
              <Icon
                className={cn("w-5 h-5", isActive ? f.color : "text-muted-foreground")}
              />
              <span
                className={cn(
                  "text-xs font-bold text-center leading-tight",
                  isActive ? f.color : "text-muted-foreground"
                )}
              >
                {f.label}
              </span>
              {count > 0 && (
                <span
                  className={cn(
                    "absolute -top-1.5 -right-1.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm",
                    isActive ? `${f.bg} ${f.color} border ${f.border}` : "bg-secondary text-muted-foreground border border-border"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Folder Description + Controls ────────────────────────────── */}
      <div
        className={cn(
          "flex items-center justify-between p-4 rounded-xl border",
          folder.bg, folder.border
        )}
      >
        <div className="flex items-center gap-3">
          <folder.icon className={cn("w-5 h-5", folder.color)} />
          <div>
            <p className={cn("text-sm font-bold", folder.color)}>
              {folder.label} Folder
            </p>
            <p className="text-xs text-muted-foreground">{folder.description}</p>
          </div>
        </div>
        <span className={cn("text-xl font-extrabold", folder.color)}>
          {counts?.[activeFolder] ?? 0} accounts
        </span>
      </div>

      {/* ── Search + Bulk Action Bar ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone, username, name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card
                       border border-border text-sm text-foreground
                       placeholder:text-muted-foreground focus:outline-none
                       focus:border-primary/50"
          />
        </div>

        {selected.size > 0 && (
          <>
            <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
              {selected.size} selected
            </span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-2 rounded-xl bg-card border
                         border-border text-xs text-foreground font-semibold
                         focus:outline-none focus:border-primary/50"
            >
              <option value="">— Bulk Action —</option>
              {BULK_ACTIONS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            <button
              onClick={executeBulkAction}
              disabled={!bulkAction}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground
                         text-xs font-bold hover:opacity-95 transition
                         disabled:opacity-40 shadow-sm"
            >
              Execute
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-2 rounded-xl border border-border
                         text-muted-foreground text-xs font-semibold hover:text-foreground transition"
            >
              Clear
            </button>
          </>
        )}

        {selected.size === 0 && accounts.length > 0 && (
          <button
            onClick={selectAll}
            className="text-xs text-muted-foreground hover:text-primary
                       transition whitespace-nowrap font-semibold"
          >
            Select all
          </button>
        )}
      </div>

      {/* ── Account Table ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    checked={
                      selected.size === accounts.length && accounts.length > 0
                    }
                    onChange={() =>
                      selected.size === accounts.length
                        ? clearSelection()
                        : selectAll()
                    }
                    className="accent-primary"
                  />
                </th>
                <th className="text-left px-3 py-3 text-muted-foreground font-semibold text-xs">
                  Account
                </th>
                <th className="text-left px-3 py-3 text-muted-foreground font-semibold text-xs">
                  Phone
                </th>
                <th className="text-left px-3 py-3 text-muted-foreground font-semibold text-xs">
                  Trust Score
                </th>
                <th className="text-left px-3 py-3 text-muted-foreground font-semibold text-xs">
                  Proxy
                </th>
                <th className="text-left px-3 py-3 text-muted-foreground font-semibold text-xs">
                  Format
                </th>
                <th className="text-left px-3 py-3 text-muted-foreground font-semibold text-xs">
                  FloodWait
                </th>
                <th className="text-left px-3 py-3 text-muted-foreground font-semibold text-xs">
                  Last Check
                </th>
                <th className="w-10 p-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-3 py-4">
                        <div className="h-3 rounded bg-secondary animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : accounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-16 text-center text-muted-foreground"
                  >
                    No accounts currently in this folder
                  </td>
                </tr>
              ) : (
                accounts.map((account) => {
                  const isSelected = selected.has(account.id);
                  const isFlooded =
                    account.flood_until &&
                    new Date(account.flood_until) > new Date();

                  return (
                    <tr
                      key={account.id}
                      className={cn(
                        "group border-b border-border/40 hover:bg-secondary/40 transition",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(account.id)}
                          className="accent-primary"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-secondary
                                          flex items-center justify-center border border-border">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-foreground font-bold text-xs flex items-center gap-1">
                                {account.first_name}
                                {account.premium && (
                                  <Star className="inline w-3 h-3 text-warning fill-current" />
                                )}
                                <button
                                  onClick={() => {
                                    setEditingAccount(account);
                                    setEditFirstName(account.first_name.replace(/^User #\d+$/, ""));
                                    setEditUsername(account.username || "");
                                  }}
                                  className="text-muted-foreground hover:text-foreground p-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </p>
                              {warmingAccountIds.has(account.id) && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black bg-primary/20 text-primary border border-primary/30">
                                  🔥 WARMING
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground text-[11px]">
                              {account.username
                                ? `@${account.username}`
                                : "no username"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-foreground/80">
                        {account.phone}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-secondary max-w-16 overflow-hidden">
                            <div
                              className={cn(
                                "h-1.5 rounded-full transition-all",
                                account.trust_score >= 70
                                  ? "bg-emerald-400"
                                  : account.trust_score >= 40
                                  ? "bg-amber-400"
                                  : "bg-destructive"
                              )}
                              style={{
                                width: `${account.trust_score}%`,
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-mono font-bold text-muted-foreground">
                            {account.trust_score}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {account.has_proxy ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                            <Wifi className="w-3.5 h-3.5" /> Bound
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Wifi className="w-3.5 h-3.5" /> Direct
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[11px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded border border-border">
                          {account.session_format}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {isFlooded ? (
                          <span className="text-[11px] text-warning font-mono bg-warning/10 px-1.5 py-0.5 rounded border border-warning/20">
                            ⏳ {Math.max(
                              0,
                              Math.ceil(
                                (new Date(account.flood_until!).getTime() -
                                  Date.now()) /
                                  1000 /
                                  60
                              )
                            )}m
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[11px] text-muted-foreground font-mono">
                        {account.last_check
                          ? new Date(account.last_check).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/dashboard/accounts/${account.id}`} className="text-muted-foreground hover:text-foreground transition p-1">
                          <MoreHorizontal className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="first_name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="first_name"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                <Input
                  id="username"
                  className="pl-7"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="username"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
