"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, QrCode, Smartphone, Shield, Loader2, Key, CheckCircle2, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { ModuleHeader } from "@/components/modules/ModuleHeader";
import { LogPanel, LogEntry } from "@/components/modules/LogPanel";
import { ModuleExecutionCard } from "@/components/modules/ModuleExecutionCard";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { cn } from "@/lib/utils";

export default function QrLoginPage() {
  const router = useRouter();
  const [apiId, setApiId] = useState("2040");
  const [apiHash, setApiHash] = useState("b18441a1ff607e10a989891a5462e627");
  const [cloudPassword, setCloudPassword] = useState("");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [loginId, setLoginId] = useState("");
  const [executing, setExecuting] = useState(false);
  const [status, setStatus] = useState<"idle" | "waiting_scan" | "waiting_password" | "success" | "error">("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function addLog(text: string, level: "error" | "info" | "success" | "warn" | "flood" = "info") {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  const startPolling = (currentLoginId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/accounts/login/qr/status/${currentLoginId}`);
        const data = res.data;
        if (data.status === "awaiting_password") {
          setStatus("waiting_password");
          addLog("QR Scanned successfully — Cloud 2FA Password Required", "warn");
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "authorized") {
          setStatus("success");
          addLog(`Login authorized successfully! Connected Phone: ${data.phone || "Active"}`, "success");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (err: any) {
        // polling interval
      }
    }, 2000);
  };

  const requestQr = async () => {
    setExecuting(true);
    setQrSvg(null);
    setStatus("waiting_scan");
    addLog("Requesting Telegram MTProto QR login token...", "info");

    try {
      const res = await api.post("/accounts/login/qr/start", {
        api_id: Number(apiId),
        api_hash: apiHash,
      });
      const data = res.data;
      setLoginId(data.login_id);
      setQrSvg(data.qr_data_uri);
      addLog("QR Token generated! Scan with Telegram > Settings > Devices", "success");
      startPolling(data.login_id);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to generate QR code";
      setStatus("error");
      addLog(`QR Login error: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  };

  const submitPassword = async () => {
    if (!cloudPassword || !loginId) return;
    setExecuting(true);
    addLog("Verifying 2FA password...", "info");

    try {
      const res = await api.post(`/accounts/login/qr/password/${loginId}`, {
        password: cloudPassword,
      });
      const data = res.data;
      setStatus("success");
      addLog(`2FA verified! Account authorized: ${data.phone || "Active"}`, "success");
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Invalid 2FA password";
      addLog(msg, "error");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ModuleHeader
        title="QR Code Account Login"
        description="Instant mobile authentication using official Telegram QR scanning protocol"
        icon={<QrCode className="h-6 w-6" />}
        category="Account Operations"
        planRequired="starter"
        status={status === "waiting_scan" ? "running" : "ready"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                MTProto API Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Telegram App ID</label>
                <input
                  type="text"
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Telegram App Hash</label>
                <input
                  type="text"
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {/* QR Display Card */}
          <div className="bg-card rounded-2xl border border-border p-6 text-center space-y-4 shadow-sm">
            <div className="flex flex-col items-center justify-center p-6 bg-secondary/30 rounded-2xl border border-border/80 min-h-[260px]">
              {executing ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-xs font-medium text-muted-foreground">Requesting QR from Telegram MTProto...</p>
                </div>
              ) : status === "waiting_scan" && qrSvg ? (
                <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 bg-white rounded-2xl shadow-lg border border-border">
                    <img src={qrSvg} alt="Telegram QR Code" className="w-52 h-52 object-contain" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Awaiting scan from Telegram app (Settings → Devices → Link Desktop)
                  </div>
                </div>
              ) : status === "waiting_password" ? (
                <div className="w-full max-w-sm space-y-4 text-center">
                  <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary">
                    <Key className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Cloud 2FA Password Required</h4>
                  <input
                    type="password"
                    value={cloudPassword}
                    onChange={(e) => setCloudPassword(e.target.value)}
                    placeholder="Enter 2FA password"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={submitPassword}
                    className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-xs hover:opacity-90 transition-opacity"
                  >
                    Confirm 2FA Password
                  </button>
                </div>
              ) : status === "success" ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-success/15 border border-success/30 flex items-center justify-center text-success">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Account Successfully Connected!</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Session saved to accounts database</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/accounts")}
                    className="mt-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                  >
                    View in Accounts Hub
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Generate New QR Session</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Click below to generate a live QR token</p>
                  </div>
                  <button
                    type="button"
                    onClick={requestQr}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    Generate QR Code
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-5">
          <ModuleExecutionCard
            onExecute={requestQr}
            isExecuting={executing || status === "waiting_scan"}
            buttonText={status === "waiting_scan" ? "Refreshing QR..." : "Generate New QR Token"}
          />

          <LogPanel
            entries={logs}
            title="QR MTProto Auth Stream"
            maxHeight="320px"
            onClear={() => setLogs([])}
          />
        </div>
      </div>

      <CrossLinkFooter
        links={[
          { label: "Accounts Hub", href: "/dashboard/accounts" },
          { label: "Universal Registrar", href: "/dashboard/modules/universal-registrar" },
          { label: "TDATA Converter", href: "/dashboard/converter" },
        ]}
      />

      <ModuleFooter manualSlug="qr-login" />
    </div>
  );
}