"use client";

import { useState, useEffect } from "react";
import { BookOpen, ArrowLeft, Play, Loader2, Users, UserPlus, UserMinus, Download, Send, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

const MODES = [
  { id: "add", label: "Add", icon: UserPlus },
  { id: "delete", label: "Delete", icon: UserMinus },
  { id: "export", label: "Export", icon: Download },
  { id: "invite", label: "Invite", icon: Send },
  { id: "send", label: "Send", icon: Mail },
] as const;

type Mode = (typeof MODES)[number]["id"];

export default function ContactBookPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [mode, setMode] = useState<Mode>("add");
  const [textInput, setTextInput] = useState("");
  const [groupLink, setGroupLink] = useState("");
  const [exportCount, setExportCount] = useState(100);
  const [threadCount, setThreadCount] = useState(2);
  const [proxyMode, setProxyMode] = useState("account");
  const [minDelay, setMinDelay] = useState(5);
  const [maxDelay, setMaxDelay] = useState(15);
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

  async function handleExecute() {
    if (!accountId) { setError("Select an account"); return; }
    if ((mode === "invite" || mode === "send") && !textInput.trim()) { setError("Enter contact data"); return; }
    if (mode === "invite" && !groupLink.trim()) { setError("Enter group link"); return; }
    setExecuting(true); setError(""); setLog([]);
    try {
      addLog(`Starting ${mode} operation...`);
      const r = await api.post("/modules/contact_book/execute", {
        operation: mode,
        params: {
          account_id: accountId,
          text: textInput ? textInput.split("\n").filter(Boolean) : undefined,
          chat_id: groupLink || undefined,
          count: mode === "export" ? exportCount : undefined,
          thread_count: threadCount,
          proxy_mode: proxyMode,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });
      const res = r.data?.result || r.data;
      addLog(`${mode} completed: ${res.processed || res.count || "?"} items`, "success");
      if (res.failed > 0) addLog(`${res.failed} failed`, "warn");
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg); addLog(msg, "error");
    } finally { setExecuting(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Contact Book</h1>
            <p className="text-xs text-muted-foreground">Manage Telegram contacts — add, delete, export, invite, and message</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Account</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select account...</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>
                ))}
              </select>
            </div>

            {mode === "invite" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Group Link</label>
                <input type="text" value={groupLink} onChange={e => setGroupLink(e.target.value)} placeholder="https://t.me/group or @username"
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
            )}

            {mode === "export" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Count</label>
                <input type="number" min={1} value={exportCount} onChange={e => setExportCount(parseInt(e.target.value) || 100)}
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
            )}
          </div>

          {mode !== "export" && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">
                {mode === "send" ? "Message Text" : "Phone Numbers (one per line)"}
              </label>
              <textarea value={textInput} onChange={e => setTextInput(e.target.value)} rows={4}
                placeholder={mode === "send" ? "Enter your message..." : mode === "invite" ? "Enter invite message..." : "+1234567890\n+9876543210"}
                className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
          )}

          <button onClick={handleExecute} disabled={executing || !accountId}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Processing..." : `Execute ${mode}`}
          </button>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />
        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Mass Messaging", href: "/modules/mass-messaging" },
          { label: "Audience Collector", href: "/modules/audience-collector" },
          { label: "Invite V1", href: "/modules/invite-v1" },
        ]} />

        <ModuleFooter manualSlug="dobavlenie-kontaktov" />
      </div>
    </div>
  );
}
