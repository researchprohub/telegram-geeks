"use client";

import { useState, useEffect } from "react";
import { Smartphone, ArrowLeft, Loader2, Sparkles, Phone, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

const sendModes = [
  { id: "plain", label: "Plain SMS", icon: Smartphone, desc: "Send a text message to phone numbers" },
  { id: "gpt", label: "GPT SMS", icon: Sparkles, desc: "AI-generated SMS messages (GPT prompt)" },
];

export default function SmsSenderPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [mode, setMode] = useState("plain");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [messageText, setMessageText] = useState("");
  const [gptPrompt, setGptPrompt] = useState("");
  const [threadCount, setThreadCount] = useState(3);
  const [proxyMode, setProxyMode] = useState("account");
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
    setExecuting(true); setError(""); setLog([]);
    try {
      if (mode === "plain") {
        if (!phoneNumbers.trim()) { setError("Enter phone numbers"); setExecuting(false); return; }
        if (!messageText.trim()) { setError("Enter message text"); setExecuting(false); return; }
        addLog(`Sending SMS to recipients...`);
        const r = await api.post("/modules/sms_sender/execute", {
          params: {
            mode: "plain",
            phone_numbers: phoneNumbers.split("\n").filter(n => n.trim()),
            message: messageText,
            account_id: accountId || undefined,
            thread_count: threadCount,
            proxy_mode: proxyMode,
          },
        });
        const count = r.data?.sent || r.data?.result?.sent || 0;
        addLog(`Sent SMS to ${count} recipients`, count > 0 ? "success" : "warn");
      } else {
        if (!phoneNumbers.trim()) { setError("Enter phone numbers"); setExecuting(false); return; }
        if (!gptPrompt.trim()) { setError("Enter GPT prompt"); setExecuting(false); return; }
        addLog(`Generating SMS with GPT...`);
        const r = await api.post("/modules/sms_sender/execute", {
          params: {
            mode: "gpt",
            phone_numbers: phoneNumbers.split("\n").filter(n => n.trim()),
            prompt: gptPrompt,
            account_id: accountId || undefined,
            thread_count: threadCount,
            proxy_mode: proxyMode,
          },
        });
        const count = r.data?.sent || r.data?.result?.sent || 0;
        addLog(`GPT SMS sent to ${count} recipients`, count > 0 ? "success" : "warn");
      }
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(msg, "error");
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
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">SMS Sender (GPT)</h1>
            <p className="text-xs text-muted-foreground">Send SMS through linked services, with GPT-generated messages</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {sendModes.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                title={m.desc}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
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

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Phone Numbers (one per line)</label>
              <textarea value={phoneNumbers} onChange={e => setPhoneNumbers(e.target.value)}
                placeholder="+1234567890&#10;+0987654321"
                rows={3}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>

            {mode === "plain" ? (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Message Text</label>
                <textarea value={messageText} onChange={e => setMessageText(e.target.value)}
                  placeholder="Your SMS message..."
                  rows={3}
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>
            ) : (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">GPT Prompt</label>
                <textarea value={gptPrompt} onChange={e => setGptPrompt(e.target.value)}
                  placeholder="Write a friendly SMS about a product launch..."
                  rows={3}
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>
            )}

            <button onClick={handleExecute} disabled={executing}
              className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Smartphone className="h-3.5 w-3.5" />}
              {executing ? "Sending..." : "Send SMS"}
            </button>
          </div>
        </div>

        <ThreadProxyPanel threadCount={threadCount} onThreadChange={setThreadCount} proxyMode={proxyMode} onProxyChange={setProxyMode} />

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Universal Registrar", href: "/dashboard/modules/universal-registrar" },
          { label: "Manual Registration", href: "/dashboard/modules/manual-registration" },
          { label: "Account Cleanup", href: "/dashboard/modules/account-cleanup" },
        ]} />

        <ModuleFooter manualSlug="sms-sender-gpt" />
      </div>
    </div>
  );
}