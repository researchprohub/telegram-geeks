"use client";

import { useState, useEffect } from "react";
import { Bot, ArrowLeft, Play, Loader2, Upload, FileSpreadsheet, Smartphone, Key, TestTube, DollarSign, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ModuleHeader } from "@/components/modules/ModuleHeader";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel, LogEntry } from "@/components/modules/LogPanel";
import { ModuleExecutionCard } from "@/components/modules/ModuleExecutionCard";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { cn } from "@/lib/utils";

export default function UniversalRegistrarPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"auto_sms" | "manual" | "batch">("auto_sms");
  const [smsProvider, setSmsProvider] = useState("sms-activate");
  const [countryCode, setCountryCode] = useState("US");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [apiId, setApiId] = useState("2040");
  const [apiHash, setApiHash] = useState("b18441a1ff607e10a989891a5462e627");
  const [proxyString, setProxyString] = useState("");
  const [firstName, setFirstName] = useState("Alex");
  const [lastName, setLastName] = useState("Smith");
  const [twoFaPassword, setTwoFaPassword] = useState("SecurePass2026!");
  const [batchData, setBatchData] = useState("");

  // Concurrency & delays
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("custom");
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(8);

  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [registeredAccounts, setRegisteredAccounts] = useState<any[]>([]);
  const [error, setError] = useState("");

  function addLog(text: string, level: "info" | "success" | "warn" | "error" | "flood" = "info") {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  async function handleExecute() {
    setExecuting(true);
    setError("");

    if (mode === "manual" && (!phoneNumber || !apiId || !apiHash)) {
      setError("Please fill phone number and MTProto API credentials");
      setExecuting(false);
      return;
    }

    addLog(`Initiating registration pipeline in ${mode.toUpperCase()} mode...`, "info");

    try {
      if (mode === "auto_sms") {
        addLog(`Requesting virtual SMS number from ${smsProvider} (${countryCode})...`, "info");
        const r = await api.post("/modules/registrar/execute", {
          operation: "register_auto_sms",
          params: {
            provider: smsProvider,
            country: countryCode,
            first_name: firstName,
            last_name: lastName,
            password_2fa: twoFaPassword,
            proxy_string: proxyString || undefined,
            thread_count: threadCount,
          },
        });
        const res = r.data?.result || r.data;
        addLog(`Account registered successfully: ${res.phone || "Session active"}`, "success");
        setRegisteredAccounts((prev) => [...prev, res]);
      } else if (mode === "manual") {
        addLog(`Registering manual account ${phoneNumber}...`, "info");
        const r = await api.post("/modules/registrar/execute", {
          operation: "register_account",
          params: {
            phone: phoneNumber,
            api_id: parseInt(apiId),
            api_hash: apiHash,
            proxy_string: proxyString || undefined,
            first_name: firstName,
            last_name: lastName,
          },
        });
        addLog(r.data?.message || `Account ${phoneNumber} registered`, "success");
        setRegisteredAccounts((prev) => [...prev, { phone: phoneNumber, status: "active" }]);
      } else {
        const entries = batchData.split("\n").map((s) => s.trim()).filter(Boolean);
        addLog(`Batch registering ${entries.length} account rows...`, "info");
        const r = await api.post("/modules/registrar/execute", {
          operation: "batch_register",
          params: {
            accounts: entries.map((e) => {
              const p = e.split(",");
              return { phone: p[0], api_id: parseInt(p[1] || apiId), api_hash: p[2] || apiHash, proxy: p[3] || proxyString };
            }),
            thread_count: threadCount,
          },
        });
        const res = r.data?.result || r.data;
        addLog(`Batch completed: ${res.registered || entries.length} registered`, "success");
      }
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(`Registration error: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ModuleHeader
        title="Universal Account Registrar"
        description="Automated Telegram account registration with 25+ SMS OTP APIs, proxy binding, 2FA setup, and session creation"
        icon={<Bot className="h-6 w-6" />}
        category="Account Operations"
        planRequired="pro"
        status={executing ? "running" : "ready"}
      />

      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-xs font-semibold text-destructive">
          {error}
        </div>
      )}

      {/* Split Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-7 space-y-5">
          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "auto_sms", label: "Auto SMS API", icon: Smartphone, desc: "Instant OTP polling" },
              { id: "manual", label: "Manual OTP", icon: Key, desc: "Single custom phone" },
              { id: "batch", label: "Batch CSV / Sheet", icon: Upload, desc: "Bulk register pool" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id as any)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  mode === m.id
                    ? "bg-primary/10 border-primary shadow-xs"
                    : "bg-secondary/40 border-border hover:bg-secondary"
                )}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <m.icon className={cn("h-4 w-4", mode === m.id ? "text-primary" : "text-muted-foreground")} />
                  <span className={mode === m.id ? "text-primary" : "text-foreground"}>{m.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{m.desc}</p>
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Registration Credentials & Profile
              </h3>
            </div>

            {mode === "auto_sms" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">SMS Activation Provider</label>
                  <select
                    value={smsProvider}
                    onChange={(e) => setSmsProvider(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="sms-activate">SMS-Activate (Global)</option>
                    <option value="5sim">5SIM.net</option>
                    <option value="vak-sms">VAK-SMS</option>
                    <option value="smspva">SMSPVA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Target Country Profile</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="US">United States (+1)</option>
                    <option value="UK">United Kingdom (+44)</option>
                    <option value="CA">Canada (+1)</option>
                    <option value="DE">Germany (+49)</option>
                    <option value="BR">Brazil (+55)</option>
                    <option value="ID">Indonesia (+62)</option>
                  </select>
                </div>
              </div>
            ) : mode === "manual" ? (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Phone Number (International Format) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+15551234567"
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  CSV Rows (phone,api_id,api_hash,proxy)
                </label>
                <textarea
                  value={batchData}
                  onChange={(e) => setBatchData(e.target.value)}
                  placeholder="+15551110001,2040,b18441a1ff,socks5://1.1.1.1:1080"
                  rows={4}
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                />
              </div>
            )}

            {/* Profile Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Cloud 2FA Password</label>
                <input
                  type="text"
                  value={twoFaPassword}
                  onChange={(e) => setTwoFaPassword(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Proxy & Concurrency */}
          <ThreadProxyPanel
            threadCount={threadCount}
            onThreadChange={setThreadCount}
            proxyMode={proxyMode}
            onProxyChange={setProxyMode}
            proxyStr={proxyString}
            onProxyStrChange={setProxyString}
          />
        </div>

        {/* Right Column: Execution & Terminal */}
        <div className="lg:col-span-5 space-y-5">
          <ModuleExecutionCard
            onExecute={handleExecute}
            isExecuting={executing}
            buttonText={mode === "auto_sms" ? "Acquire Number & Register" : "Execute Registration"}
            hasResults={registeredAccounts.length > 0}
            stats={{
              total: registeredAccounts.length,
              success: registeredAccounts.length,
            }}
          />

          <LogPanel
            entries={logs}
            title="Registration Telemetry Terminal"
            maxHeight="320px"
            onClear={() => setLogs([])}
          />
        </div>
      </div>

      <CrossLinkFooter
        links={[
          { label: "TDATA Converter", href: "/dashboard/converter" },
          { label: "Parameter Generator", href: "/dashboard/generator" },
          { label: "Proxies Management", href: "/dashboard/proxies" },
        ]}
      />

      <ModuleFooter manualSlug="universal-registrar" />
    </div>
  );
}
