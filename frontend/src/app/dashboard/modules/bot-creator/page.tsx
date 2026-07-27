"use client";

import { useState, useEffect } from "react";
import { Bot, ArrowLeft, Play, Loader2, User, Hash, FileText, Terminal, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function BotCreatorPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [mode, setMode] = useState<"create_bot" | "manage_bot">("create_bot");
  const [botToken, setBotToken] = useState("");
  const [botName, setBotName] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [botDescription, setBotDescription] = useState("");
  const [botCommands, setBotCommands] = useState("");
  const [minDelay, setMinDelay] = useState(5);
  const [maxDelay, setMaxDelay] = useState(15);
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } }).then(r => setAccounts(r.data?.items || r.data || [])).catch(() => {});
  }, []);

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  async function handleExecute() {
    if (mode === "create_bot" && (!accountId || !botName || !botUsername)) { setError("Fill account, bot name and username"); return; }
    if (mode === "manage_bot" && !botToken) { setError("Enter bot token"); return; }
    setExecuting(true); setError("");
    try {
      const op = mode === "create_bot" ? "create_bot" : "update_bot";
      const commands = botCommands.split("\n").map(s => s.trim()).filter(Boolean);
      addLog(`${mode === "create_bot" ? "Creating" : "Updating"} bot...`);
      const r = await api.post("/modules/bot_creator/execute", {
        operation: op,
        params: {
          account_id: accountId, bot_token: botToken, bot_name: botName,
          bot_username: botUsername, description: botDescription,
          commands, delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });
      const res = r.data?.result || r.data;
      addLog(`Bot ${mode === "create_bot" ? "created" : "updated"}: @${res.username || botUsername}`, "success");
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Bot className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Bot Tools</h1><p className="text-xs text-muted-foreground">Create Telegram bots and manage bot tokens</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {[
              { id: "create_bot", label: "Create Bot", icon: User },
              { id: "manage_bot", label: "Manage Bot", icon: Terminal },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mode === "create_bot" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Account</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select account...</option>
                  {accounts.map((a: any) => (<option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>))}
                </select>
              </div>
            )}
            {mode === "manage_bot" ? (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Bot Token</label>
                <input type="text" value={botToken} onChange={e => setBotToken(e.target.value)} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-mono" />
              </div>
            ) : (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Bot Token (optional)</label>
                <input type="text" value={botToken} onChange={e => setBotToken(e.target.value)} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-mono" />
              </div>
            )}
          </div>

          {mode === "create_bot" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Bot Name</label>
                  <input type="text" value={botName} onChange={e => setBotName(e.target.value)} placeholder="My Awesome Bot"
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Bot Username</label>
                  <div className="flex items-center gap-1 bg-secondary rounded-lg px-3 py-2 text-sm text-muted-foreground">
                    <span>@</span>
                    <input type="text" value={botUsername} onChange={e => setBotUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))} placeholder="my_awesome_bot"
                      className="flex-1 bg-transparent border-0 text-foreground outline-none" />
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-muted-foreground mb-1">Description</label>
                <textarea value={botDescription} onChange={e => setBotDescription(e.target.value)} rows={3} placeholder="Describe what your bot does..."
                  className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="mt-3">
                <label className="block text-xs text-muted-foreground mb-1">Bot Commands (one per line — command - description)</label>
                <textarea value={botCommands} onChange={e => setBotCommands(e.target.value)} rows={4} placeholder="start - Start the bot&#10;help - Show help&#10;settings - Open settings"
                  className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
              </div>
            </>
          )}

          <button onClick={handleExecute} disabled={executing || (mode === "create_bot" && (!accountId || !botName || !botUsername)) || (mode === "manage_bot" && !botToken)}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} {executing ? "Processing..." : mode === "create_bot" ? "Create Bot" : "Update Bot Info"}
          </button>
        </div>

        <FloodControlPanel minDelay={minDelay} maxDelay={maxDelay} onMinDelayChange={setMinDelay} onMaxDelayChange={setMaxDelay} />

        <LogPanel entries={log} />

        <CrossLinkFooter links={[
          { label: "Referrals to Bots", href: "/dashboard/modules/referrals-to-bots" },
          { label: "Parameter Generator", href: "/dashboard/modules/parameter-generator" },
          { label: "Universal Registrar", href: "/dashboard/modules/universal-registrar" },
        ]} />

        <ModuleFooter manualSlug="sozdanie-botov" />
      </div>
    </div>
  );
}
