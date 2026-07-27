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

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = parseInt(params.id as string);

  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

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
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-muted-foreground">{error || "Account not found"}</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/accounts")}>Back to Accounts</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/accounts")}
            className="p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{account.phone_number || account.phone}</h1>
            <p className="text-xs text-muted-foreground">Account #{accountId}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-2">
          {account.status === "active" && (
            <Button variant="outline" size="sm" onClick={handleSuspend} disabled={loadingAction === "suspend"}>
              {loadingAction === "suspend" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4 mr-1" />}
              Suspend
            </Button>
          )}
          {account.status === "suspended" && (
            <Button variant="outline" size="sm" onClick={handleResume} disabled={loadingAction === "resume"}>
              {loadingAction === "resume" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
              Resume
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleHealthCheck} disabled={loadingAction === "health"}>
            {loadingAction === "health" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Health Check
          </Button>
        </div>

        {/* Status + Health */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={account.status} />
          <HealthBar score={account.health_score} />
          {account.dc_id && <span className="text-xs text-muted-foreground">DC{account.dc_id}</span>}
          {account.ping_ms && <span className="text-xs text-muted-foreground">{account.ping_ms}ms</span>}
          {account.spamblock_until && (
            <span className="text-xs text-warning flex items-center gap-1"><Clock className="h-3 w-3" />Recovers: {new Date(account.spamblock_until).toLocaleString()}</span>
          )}
          {account.health_check_at && (
            <span className="text-xs text-muted-foreground/60">Last check: {new Date(account.health_check_at).toLocaleString()}</span>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Trust Score</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{account.trust_score || 0}</div>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${account.trust_score || 0}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Daily Messages</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{account.daily_message_count || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Created</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{account.created_at ? new Date(account.created_at).toLocaleDateString() : "-"}</div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Health Score</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{account.health_score ?? "-"}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {account.flood_wait_until ? `Flood wait until: ${new Date(account.flood_wait_until).toLocaleString()}` : "No flood wait"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Proxy & Ban Info */}
        {account.ban_reason && (
          <Card className="border-destructive/50 border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-destructive">Ban Info</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm">{account.ban_reason}</p>
            </CardContent>
          </Card>
        )}
        {account.proxy_config && Object.keys(account.proxy_config).length > 0 && (
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Proxy Config</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{JSON.stringify(account.proxy_config, null, 2)}</pre>
            </CardContent>
          </Card>
        )}

        {/* Activity Log */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-foreground">Account created</span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{account.created_at ? new Date(account.created_at).toLocaleString() : "-"}</span>
              </div>
              {account.last_activity && (
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-foreground">Last activity</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{new Date(account.last_activity).toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
