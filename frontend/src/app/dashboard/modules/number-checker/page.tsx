"use client";

import { useState, useEffect } from "react";
import { Phone, ArrowLeft, Play, Loader2, Search, CheckCircle2, XCircle, Download, Users, Check, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ModuleHeader } from "@/components/modules/ModuleHeader";
import { AccountPicker, AccountItem } from "@/components/modules/AccountPicker";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel, LogEntry } from "@/components/modules/LogPanel";
import { ModuleExecutionCard } from "@/components/modules/ModuleExecutionCard";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { cn } from "@/lib/utils";

export default function NumberCheckerPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([]);
  const [numbers, setNumbers] = useState("");

  // Concurrency & delays
  const [threadCount, setThreadCount] = useState(3);
  const [proxyMode, setProxyMode] = useState("account");
  const [proxyStr, setProxyStr] = useState("");
  const [minDelay, setMinDelay] = useState(2);
  const [maxDelay, setMaxDelay] = useState(5);

  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } })
      .then((r) => {
        const items = r.data?.items || r.data || [];
        setAccounts(items);
        if (items.length > 0) {
          setSelectedAccounts([items[0].id]);
        }
      })
      .catch(() => {});
  }, []);

  function addLog(text: string, level: "info" | "success" | "warn" | "error" | "flood" = "info") {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  async function handleExecute() {
    if (!numbers.trim()) {
      setError("Please enter at least one phone number to verify");
      return;
    }
    if (selectedAccounts.length === 0) {
      setError("Please select a checker account");
      return;
    }

    setExecuting(true);
    setError("");
    setResults(null);

    const phoneList = numbers.split("\n").map((s) => s.trim()).filter(Boolean);
    addLog(`Checking ${phoneList.length} phone numbers against Telegram user directory...`, "info");

    try {
      const r = await api.post("/modules/number_checker/execute", {
        params: {
          account_id: selectedAccounts[0],
          account_ids: selectedAccounts,
          numbers: phoneList,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });

      const res = r.data?.result || r.data?.items || [];
      const list = Array.isArray(res) ? res : [res];
      setResults(list);
      const existsCount = list.filter((item) => item.exists || item.registered).length;
      addLog(`Check completed: ${existsCount} of ${list.length} numbers registered on Telegram`, "success");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(`Number check failed: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  }

  function handleExportCsv() {
    if (!results || results.length === 0) return;
    const csv =
      "phone,registered,username,id,first_name\n" +
      results
        .map(
          (r: any) =>
            `"${r.phone || ""}","${r.exists || r.registered ? "YES" : "NO"}","${r.username || ""}","${r.id || ""}","${r.first_name || ""}"`
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `number_check_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const phoneCount = numbers.split("\n").map((s) => s.trim()).filter(Boolean).length;
  const verifiedCount = results?.filter((r) => r.exists || r.registered).length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ModuleHeader
        title="Phone Number Presence Checker"
        description="Verify whether phone number lists exist on Telegram without notifying target users"
        icon={<Phone className="h-6 w-6" />}
        category="Audience & Parsing"
        planRequired="starter"
        accountCount={accounts.length}
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
          {/* Account Picker */}
          <AccountPicker
            accounts={accounts}
            selectedIds={selectedAccounts}
            onSelectionChange={setSelectedAccounts}
            singleSelect
            label="Checker Account"
          />

          {/* Numbers Input */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Phone Numbers List (International E.164)
              </h3>
              <span className="font-mono text-xs text-primary font-bold">{phoneCount} numbers</span>
            </div>

            <div>
              <textarea
                value={numbers}
                onChange={(e) => setNumbers(e.target.value)}
                placeholder="+15551234567&#10;+447911123456&#10;+4915123456789"
                rows={6}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Enter phone numbers with country code prefix (e.g. +1..., +44...), one per line.
              </p>
            </div>
          </div>

          {/* Concurrency & Delays */}
          <ThreadProxyPanel
            threadCount={threadCount}
            onThreadChange={setThreadCount}
            proxyMode={proxyMode}
            onProxyChange={setProxyMode}
            proxyStr={proxyStr}
            onProxyStrChange={setProxyStr}
          />

          <FloodControlPanel
            minDelay={minDelay}
            maxDelay={maxDelay}
            onMinDelayChange={setMinDelay}
            onMaxDelayChange={setMaxDelay}
          />
        </div>

        {/* Right Column: Execution & Results */}
        <div className="lg:col-span-5 space-y-5">
          <ModuleExecutionCard
            onExecute={handleExecute}
            isExecuting={executing}
            buttonText={`Verify ${phoneCount} Phone Numbers`}
            hasResults={!!results}
            onExportCsv={handleExportCsv}
            stats={{
              total: results ? results.length : phoneCount,
              success: verifiedCount,
              rate: executing ? "60 check/min" : undefined,
            }}
          />

          {/* Terminal */}
          <LogPanel
            entries={logs}
            title="Verification Stream Terminal"
            maxHeight="260px"
            onClear={() => setLogs([])}
          />

          {/* Results Table */}
          {results && (
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Results ({verifiedCount} Found)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Download className="h-3 w-3" /> Export CSV
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                    <tr>
                      <th className="py-2 px-3">Phone</th>
                      <th className="py-2 px-3">Registered</th>
                      <th className="py-2 px-3">Username / ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {results.map((r: any, i: number) => {
                      const isFound = r.exists || r.registered;
                      return (
                        <tr key={i} className="hover:bg-secondary/40 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-foreground text-[11px]">
                            {r.phone || `Row #${i + 1}`}
                          </td>
                          <td className="py-2 px-3">
                            {isFound ? (
                              <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[10px] font-bold flex items-center gap-1 w-fit">
                                <CheckCircle2 className="h-3 w-3" /> YES
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-bold flex items-center gap-1 w-fit">
                                <XCircle className="h-3 w-3" /> NO
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground text-[11px]">
                            {r.username ? `@${r.username}` : r.id || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <CrossLinkFooter
        links={[
          { label: "Audience Collector", href: "/dashboard/modules/audience-collector" },
          { label: "Mass Messaging", href: "/dashboard/modules/mass-messaging" },
          { label: "Invite Module", href: "/dashboard/modules/invite-v1" },
        ]}
      />

      <ModuleFooter manualSlug="number-checker" />
    </div>
  );
}