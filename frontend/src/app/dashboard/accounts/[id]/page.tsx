"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Play, Pause, RefreshCw, Trash2, Eye, AlertTriangle, CheckCircle2, ArrowLeft, Loader2, Clock, Snowflake, HeartPulse } from "lucide-react";
import { accountsApi, analyticsApi } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import HealthBar from "@/components/HealthBar";

import TelegramWebClient from "@/components/telegram-web/TelegramWebClient";
import { Globe, LayoutGrid, ListFilter } from "lucide-react";

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = parseInt(params.id as string);

  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"web" | "overview" | "logs">("web");

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const res = await accountsApi.get(accountId);
      setAccount(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load account");
    } finally {
      setLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    setLoadingAction("health");
    try {
      const res = await accountsApi.health(accountId);
      setAccount((prev: any) => ({ ...prev, trust_score: res.data.trust_score, daily_message_count: res.data.daily_messages }));
    } catch { /* ignore */ }
    setLoadingAction(null);
  };

  const handleSuspend = async () => {
    setLoadingAction("suspend");
    try {
      await accountsApi.suspend(accountId);
      setAccount((prev: any) => ({ ...prev, status: "suspended" }));
    } catch { /* ignore */ }
    setLoadingAction(null);
  };

  const handleResume = async () => {
    setLoadingAction("resume");
    try {
      await accountsApi.unsuspend(accountId);
      setAccount((prev: any) => ({ ...prev, status: "active" }));
    } catch { /* ignore */ }
    setLoadingAction(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error || "Account not found"}</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/accounts")}>Back to Accounts</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/accounts")}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">
                  {account.first_name || account.username || account.phone_number || account.phone}
                </h1>
                <StatusBadge status={account.status} />
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {account.phone_number || account.phone} · Account #{accountId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {account.status === "active" && (
              <button
                onClick={handleSuspend}
                disabled={loadingAction === "suspend"}
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                {loadingAction === "suspend" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pause className="h-3.5 w-3.5" />}
                Suspend
              </button>
            )}
            {account.status === "suspended" && (
              <button
                onClick={handleResume}
                disabled={loadingAction === "resume"}
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {loadingAction === "resume" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Resume
              </button>
            )}
            <button
              onClick={handleHealthCheck}
              disabled={loadingAction === "health"}
              className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              {loadingAction === "health" ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Health Check
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-border/60">
          <button
            onClick={() => setActiveTab("web")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "web"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Telegram Web UI
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "overview"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Account Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "logs"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            Activity & Security
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-7xl mx-auto">
        {/* Tab 1: Live Telegram Web Client */}
        {activeTab === "web" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <TelegramWebClient
              accountId={accountId}
              accountPhone={account.phone_number || account.phone}
              accountName={account.first_name || account.username}
            />
          </div>
        )}

        {/* Tab 2: Overview & Metrics */}
        {activeTab === "overview" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Status & Health Bar */}
            <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between flex-wrap gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <StatusBadge status={account.status} />
                <HealthBar score={account.health_score} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                {account.dc_id && <span>Data Center: DC{account.dc_id}</span>}
                {account.ping_ms && <span>Ping: {account.ping_ms}ms</span>}
                {account.spamblock_until && (
                  <span className="text-warning flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    SpamBlock Until: {new Date(account.spamblock_until).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-card rounded-2xl border border-border p-4 shadow-xs">
                <p className="text-xs font-bold text-muted-foreground uppercase">Trust Score</p>
                <div className="text-2xl font-mono font-bold text-foreground mt-1">
                  {account.trust_score || 100}
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${account.trust_score || 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-4 shadow-xs">
                <p className="text-xs font-bold text-muted-foreground uppercase">Daily Messages</p>
                <div className="text-2xl font-mono font-bold text-foreground mt-1">
                  {account.daily_message_count || 0}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Active MTProto rate tracking</p>
              </div>

              <div className="bg-card rounded-2xl border border-border p-4 shadow-xs">
                <p className="text-xs font-bold text-muted-foreground uppercase">Account Folder</p>
                <div className="text-2xl font-mono font-bold text-primary mt-1 capitalize">
                  {account.folder || "Active"}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Assigned pipeline category</p>
              </div>

              <div className="bg-card rounded-2xl border border-border p-4 shadow-xs">
                <p className="text-xs font-bold text-muted-foreground uppercase">Registered / Imported</p>
                <div className="text-sm font-mono font-bold text-foreground mt-1">
                  {account.created_at ? new Date(account.created_at).toLocaleDateString() : "-"}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  {account.flood_wait_until
                    ? `Flood wait: ${new Date(account.flood_wait_until).toLocaleTimeString()}`
                    : "No active flood waits"}
                </p>
              </div>
            </div>

            {/* Proxy Info */}
            {account.proxy_config && Object.keys(account.proxy_config).length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-4 shadow-xs">
                <h4 className="text-xs font-bold text-foreground uppercase mb-2">Dedicated Proxy Route</h4>
                <pre className="text-xs font-mono text-muted-foreground bg-secondary/40 p-3 rounded-xl overflow-x-auto">
                  {JSON.stringify(account.proxy_config, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Activity Logs */}
        {activeTab === "logs" && (
          <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-foreground">Session Activity History</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/60">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <span className="text-xs font-bold text-foreground">Account Authorized & Synced</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {account.created_at ? new Date(account.created_at).toLocaleString() : "-"}
                </span>
              </div>
              {account.last_activity && (
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/60">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-foreground">Last MTProto Action</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {new Date(account.last_activity).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
