"use client";

import { useState, useEffect } from "react";
import { BarChart3, ArrowLeft, Loader2, Calculator, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function ReportsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"calculator" | "report">("calculator");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [numAccounts, setNumAccounts] = useState(10);
  const [proxyCost, setProxyCost] = useState(0);
  const [smsCost, setSmsCost] = useState(0);
  const [accountCost, setAccountCost] = useState(0);
  const [profit, setProfit] = useState(0);
  const [calcResult, setCalcResult] = useState<{ label: string; value: string; positive: boolean } | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [moduleType, setModuleType] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } })
      .then(r => setAccounts(r.data?.items || r.data || []))
      .catch(() => {});
  }, []);

  function addLog(text: string, level = "info") {
    setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  function handleCalculate() {
    const totalCost = proxyCost + smsCost * numAccounts + accountCost;
    const net = profit - totalCost;
    setCalcResult({
      label: net >= 0 ? "Net Profit" : "Net Loss",
      value: `$${Math.abs(net).toFixed(2)}`,
      positive: net >= 0,
    });
    addLog(`Calculation: cost $${totalCost.toFixed(2)}, revenue $${profit.toFixed(2)}, net ${net >= 0 ? "+" : "-"}$${Math.abs(net).toFixed(2)}`, net >= 0 ? "success" : "warn");
  }

  async function handleGenerateReport() {
    setGenerating(true); setError("");
    try {
      addLog(`Generating report: ${moduleType}, ${startDate} - ${endDate}`);
      const r = await api.post("/modules/reports/generate", {
        params: { start_date: startDate, end_date: endDate, module_type: moduleType, account_id: selectedAccount || undefined },
      });
      addLog(r.data?.message || "Report generated", "success");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(msg, "error");
    } finally { setGenerating(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Reports</h1>
            <p className="text-xs text-muted-foreground">Reports and statistics module</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {[
              { id: "calculator", label: "Calculator", icon: Calculator },
              { id: "report", label: "Report Generator", icon: FileText },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>

          {mode === "calculator" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Number of Accounts</label>
                  <input type="number" min={1} value={numAccounts} onChange={e => setNumAccounts(parseInt(e.target.value) || 1)}
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Proxies Cost / Month ($)</label>
                  <input type="number" min={0} step={0.01} value={proxyCost} onChange={e => setProxyCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">SMS Verification Cost / Account ($)</label>
                  <input type="number" min={0} step={0.01} value={smsCost} onChange={e => setSmsCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Accounts Cost (if bought) ($)</label>
                  <input type="number" min={0} step={0.01} value={accountCost} onChange={e => setAccountCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Profit from Completed Tasks ($)</label>
                  <input type="number" min={0} step={0.01} value={profit} onChange={e => setProfit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <button onClick={handleCalculate}
                className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5" /> Calculate
              </button>

              {calcResult && (
                <div className={`rounded-xl p-4 ${calcResult.positive ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"}`}>
                  <p className="text-xs text-muted-foreground">{calcResult.label}</p>
                  <p className={`text-2xl font-bold ${calcResult.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{calcResult.positive ? "+" : "-"}{calcResult.value}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Module Type</label>
                  <select value={moduleType} onChange={e => setModuleType(e.target.value)}
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                    <option value="all">All Modules</option>
                    <option value="mass-messaging">Mass Messaging</option>
                    <option value="audience-collector">Audience Collector</option>
                    <option value="invite">Invite</option>
                    <option value="mass-subscriptions">Mass Subscriptions</option>
                    <option value="reactions">Reactions</option>
                    <option value="views-booster">Views Booster</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Account</label>
                  <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                    <option value="">All Accounts</option>
                    {accounts.map((a: any) => (
                      <option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button onClick={handleGenerateReport} disabled={generating || !startDate || !endDate}
                className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                {generating ? "Generating..." : "Generate Report"}
              </button>
            </div>
          )}
        </div>

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Analytics", href: "/dashboard/analytics" },
          { label: "Database Tools", href: "/dashboard/modules/database-tools" },
          { label: "Console Log", href: "/dashboard/modules/console-log" },
        ]} />

        <ModuleFooter manualSlug="generator-otchetov" />
      </div>
    </div>
  );
}
