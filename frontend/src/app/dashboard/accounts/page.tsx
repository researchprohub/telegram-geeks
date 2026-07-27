"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Search, Plus, RefreshCw,
  CheckCircle2, XCircle, AlertCircle, Snowflake, Archive,
  Clock, Eye, Trash2, Edit, Shield, HeartPulse,
  Loader2, Upload, Smartphone, Download, ChevronDown
} from "lucide-react";
import api, { accountsApiExtended } from "@/lib/api";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import HealthBar from "@/components/HealthBar";

interface Account {
  id: number;
  phone_number: string;
  status: string;
  trust_score: number;
  daily_message_count: number;
  created_at: string;
  spamblock_until?: string | null;
  health_check_at?: string | null;
  health_score?: number | null;
  dc_id?: number | null;
  ping_ms?: number | null;
  proxy_config?: Record<string, any>;
  last_activity?: string | null;
}

const FOLDER_TABS = [
  { id: "all",             label: "All",        icon: Users },
  { id: "active",          label: "Active",     icon: CheckCircle2 },
  { id: "spamblock_temp",  label: "Temp Block", icon: Clock },
  { id: "banned",          label: "Banned",     icon: XCircle },
  { id: "frozen",          label: "Frozen",     icon: Snowflake },
  { id: "archived",        label: "Archive",    icon: Archive },
];

const STATUS_ICONS: Record<string, React.ElementType> = {
  active: CheckCircle2,
  spamblock_temp: Clock,
  spamblock_perm: AlertCircle,
  frozen: Snowflake,
  archived: Archive,
  banned: XCircle,
  suspended: Shield,
  warming: HeartPulse,
  deleted: XCircle,
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [checkingAll, setCheckingAll] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const fetchAccounts = useCallback(async (status?: string) => {
    try {
      const params: any = { page_size: 200 };
      if (status && status !== "all") params.status_filter = status;
      const response = await api.get("/accounts/", { params });
      setAccounts(response.data.items || response.data || []);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatusCounts = useCallback(async () => {
    try {
      const res = await accountsApiExtended.statusCounts();
      setStatusCounts(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchAccounts(selectedFolder);
    fetchStatusCounts();
  }, []);

  useEffect(() => {
    fetchAccounts(selectedFolder);
  }, [selectedFolder]);

  const filteredAccounts = accounts.filter(a => {
    const q = searchQuery.toLowerCase();
    return !q || a.phone_number.toLowerCase().includes(q) || a.status.toLowerCase().includes(q);
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAccounts.map(a => a.id)));
    }
  };

  const handleBulkHealthCheck = async () => {
    setCheckingAll(true);
    try {
      const ids = selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
      await accountsApiExtended.bulkHealthCheck(ids);
      await fetchAccounts(selectedFolder);
      setSelectedIds(new Set());
    } catch { /* ignore */ }
    setCheckingAll(false);
  };

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      await accountsApiExtended.bulkStatus(ids, "archived");
      await fetchAccounts(selectedFolder);
      await fetchStatusCounts();
      setSelectedIds(new Set());
    } catch { /* ignore */ }
  };

  const SelectIcon = STATUS_ICONS[selectedFolder] || Users;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SelectIcon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Accounts</h1>
            <span className="text-xs text-muted-foreground">
              {statusCounts[selectedFolder] ?? accounts.length} total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setAddMenuOpen(!addMenuOpen)}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Upload className="h-3.5 w-3.5" /> Add Account
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </button>
              {addMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg min-w-[180px] z-50 animate-fade-in">
                  <Link
                    href="/dashboard/accounts/upload"
                    className="block px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors"
                    onClick={() => setAddMenuOpen(false)}
                  >
                    <Upload className="h-3.5 w-3.5 inline mr-2" /> Upload TData
                  </Link>
                  <a
                    href="/dashboard/accounts/import-session"
                    className="block px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors"
                    onClick={() => setAddMenuOpen(false)}
                  >
                    <Download className="h-3.5 w-3.5 inline mr-2" /> Import Session
                  </a>
                  <a
                    href="/dashboard/modules/qr-login"
                    className="block px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors"
                    onClick={() => setAddMenuOpen(false)}
                  >
                    <Smartphone className="h-3.5 w-3.5 inline mr-2" /> QR Login
                  </a>
                  <a
                    href="/dashboard/modules/manual-registration"
                    className="block px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors"
                    onClick={() => setAddMenuOpen(false)}
                  >
                    <Plus className="h-3.5 w-3.5 inline mr-2" /> Manual Registration
                  </a>
                  <a
                    href="/dashboard/modules/universal-registrar"
                    className="block px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors"
                    onClick={() => setAddMenuOpen(false)}
                  >
                    <Users className="h-3.5 w-3.5 inline mr-2" /> Universal Registrar
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={() => { handleBulkHealthCheck(); }}
              disabled={checkingAll}
              className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
              aria-label="Check All Health"
            >
              {checkingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <HeartPulse className="h-4 w-4 text-muted-foreground" />}
            </button>
            <button
              onClick={() => { fetchAccounts(selectedFolder); fetchStatusCounts(); }}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:bg-card outline-none transition-colors pl-9"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {FOLDER_TABS.map(f => {
            const Icon = f.icon;
            const count = statusCounts[f.id];
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedFolder === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {f.label}
                {count !== undefined && <span>({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="sticky top-[140px] z-30 mx-4 mt-2 bg-primary/10 border border-primary/30 backdrop-blur rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={handleBulkHealthCheck} disabled={checkingAll} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
              {checkingAll ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
              Health Check
            </button>
            <button onClick={handleBulkArchive} className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg hover:bg-secondary/80">
              Archive
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-muted-foreground px-2 py-1.5 hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="px-4 py-4">
        {filteredAccounts.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No accounts found</p>
            <p className="text-xs text-muted-foreground/60">Import accounts to get started</p>
            <Link href="/dashboard/accounts/upload" className="mt-4 inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors hover:opacity-90">
              <Plus className="h-4 w-4" />
              Import Accounts
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAccounts.map(account => {
              const StatusIcon = STATUS_ICONS[account.status] || Users;
              return (
                <div
                  key={account.id}
                  className={`bg-card rounded-xl border p-4 transition-all hover:shadow-md ${
                    selectedIds.has(account.id) ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => toggleSelect(account.id)}
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selectedIds.has(account.id)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30 hover:border-muted-foreground/60"
                        }`}
                      >
                        {selectedIds.has(account.id) && (
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                        )}
                      </button>
                      <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center flex-shrink-0">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => router.push(`/dashboard/accounts/${account.id}`)}
                            className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors text-left"
                          >
                            {account.phone_number}
                          </button>
                          <StatusBadge status={account.status} />
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <HealthBar score={account.health_score} />
                          {account.dc_id && (
                            <span className="text-xs text-muted-foreground/60">DC{account.dc_id}</span>
                          )}
                          {account.ping_ms && (
                            <span className="text-xs text-muted-foreground/60">{account.ping_ms}ms</span>
                          )}
                          {account.spamblock_until && (
                            <span className="text-xs text-warning">Recovers: {new Date(account.spamblock_until).toLocaleTimeString()}</span>
                          )}
                          {account.proxy_config && Object.keys(account.proxy_config).length > 0 && (
                            <span className="text-xs text-success">Proxy ✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/accounts/${account.id}`); }}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={async (e) => { e.stopPropagation(); await accountsApiExtended.updateStatus(account.id, "archived"); fetchAccounts(selectedFolder); fetchStatusCounts(); }}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                        aria-label="Archive"
                      >
                        <Archive className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
