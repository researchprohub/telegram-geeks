"use client";

import { useState, useEffect } from "react";
import { Flag, ArrowLeft, Play, Loader2, AlertTriangle, FileText, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function ReporterPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [chatId, setChatId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [reason, setReason] = useState("spam");
  const [mode, setMode] = useState<"single" | "mass" | "channel">("single");
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("account");
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } }).then(r => setAccounts(r.data?.items || r.data || [])).catch(() => {});
  }, []);

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  async function handleExecute() {
    if (!accountId || !chatId) { setError("Select account and enter target"); return; }
    setExecuting(true); setError("");
    try {
      addLog(`Reporting ${mode} to ${chatId}...`);
      const r = await api.post("/modules/safety_reporter/execute", {
        operation: mode === "single" ? "report_message" : mode === "mass" ? "mass_report" : "report_channel",
        params: { account_id: accountId, chat_id: chatId, message_id: messageId || undefined, reason, thread_count: threadCount, proxy_mode: proxyMode },
      });
      const res = r.data?.result || r.data;
      addLog(res.message || `Reported ${res.count || ""} successfully`, "success");
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Flag className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Reporter</h1><p className="text-xs text-muted-foreground">Report messages, users, and channels</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {[
              { id: "single", label: "Single", icon: AlertTriangle },
              { id: "mass", label: "Mass Report", icon: Users },
              { id: "channel", label: "Channel", icon: Flag },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Account</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select account...</option>
                {accounts.map((a: any) => (<option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Reason</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="spam">Spam</option>
                <option value="violence">Violence</option>
                <option value="pornography">Pornography</option>
                <option value="impersonation">Impersonation</option>
                <option value="copyright">Copyright</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Target Chat ID / Username</label>
              <input type="text" value={chatId} onChange={e => setChatId(e.target.value)} placeholder="-1001234567890 or @user" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Message ID (optional)</label>
              <input type="text" value={messageId} onChange={e => setMessageId(e.target.value)} placeholder="123" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <button onClick={handleExecute} disabled={executing || !accountId || !chatId}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} {executing ? "Reporting..." : "Report"}
          </button>
        </div>
        <LogPanel entries={log} />
        <CrossLinkFooter links={[{ label: "Audience Collector", href: "/dashboard/modules/audience-collector" }]} />
        <ModuleFooter />
      </div>
    </div>
  );
}
