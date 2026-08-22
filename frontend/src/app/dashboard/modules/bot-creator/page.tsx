"use client";

import { useState, useEffect } from "react";
import { Bot, Play, Loader2, User, Terminal, Copy, Check, Sparkles, Key, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ModuleHeader } from "@/components/modules/ModuleHeader";
import { AccountPicker, AccountItem } from "@/components/modules/AccountPicker";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel, LogEntry } from "@/components/modules/LogPanel";
import { ModuleExecutionCard } from "@/components/modules/ModuleExecutionCard";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { cn } from "@/lib/utils";

export default function BotCreatorPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([]);
  const [mode, setMode] = useState<"create_bot" | "manage_bot">("create_bot");
  const [botToken, setBotToken] = useState("");
  const [botName, setBotName] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [botDescription, setBotDescription] = useState("");
  const [botCommands, setBotCommands] = useState("start - Launch bot assistant\nhelp - View commands list");
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(8);

  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [createdBot, setCreatedBot] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);
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
    if (mode === "create_bot" && (selectedAccounts.length === 0 || !botName || !botUsername)) {
      setError("Please select an account and specify Bot Name & Username");
      return;
    }
    if (mode === "manage_bot" && !botToken) {
      setError("Please provide a valid Bot Token");
      return;
    }

    setExecuting(true);
    setError("");
    addLog(`Communicating with @BotFather via MTProto session...`, "info");

    try {
      const op = mode === "create_bot" ? "create_bot" : "update_bot";
      const commands = botCommands.split("\n").map((s) => s.trim()).filter(Boolean);

      const r = await api.post("/modules/bot_creator/execute", {
        operation: op,
        params: {
          account_id: selectedAccounts[0],
          bot_token: botToken,
          bot_name: botName,
          bot_username: botUsername.endsWith("_bot") || botUsername.endsWith("Bot") ? botUsername : `${botUsername}_bot`,
          description: botDescription,
          commands,
          delay_before_action: `${minDelay}-${maxDelay}`,
        },
      });

      const res = r.data?.result || r.data;
      setCreatedBot(res);
      addLog(`Bot ${mode === "create_bot" ? "created" : "updated"}: @${res.username || botUsername}`, "success");
      if (res.token) {
        addLog(`Bot token generated: ${res.token.slice(0, 10)}...`, "info");
      }
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      addLog(`Bot creation failed: ${msg}`, "error");
    } finally {
      setExecuting(false);
    }
  }

  const handleCopyToken = () => {
    if (!createdBot?.token) return;
    navigator.clipboard.writeText(createdBot.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ModuleHeader
        title="Bot Creator & Token Engine"
        description="Automated @BotFather interaction engine for registering Telegram bots, managing tokens, and setting commands"
        icon={<Bot className="h-6 w-6" />}
        category="Growth & Bots"
        planRequired="pro"
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
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "create_bot", label: "Create New Bot", icon: Sparkles, desc: "Registers new bot with @BotFather" },
              { id: "manage_bot", label: "Update Bot Settings", icon: Terminal, desc: "Edit description & commands" },
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

          {/* Account Picker */}
          {mode === "create_bot" && (
            <AccountPicker
              accounts={accounts}
              selectedIds={selectedAccounts}
              onSelectionChange={setSelectedAccounts}
              singleSelect
              label="Bot Owner Account"
            />
          )}

          {/* Bot Parameters Form */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Bot Details & Metadata
              </h3>
            </div>

            {mode === "manage_bot" ? (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Telegram Bot API Token <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Bot Display Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="Crypto Signals Assistant"
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Bot Username (@...bot) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={botUsername}
                    onChange={(e) => setBotUsername(e.target.value)}
                    placeholder="cryptosignals_bot"
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                About / Description Text
              </label>
              <textarea
                value={botDescription}
                onChange={(e) => setBotDescription(e.target.value)}
                placeholder="Official automated helper bot for notifications and group support."
                rows={2}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Commands List (command - description)
              </label>
              <textarea
                value={botCommands}
                onChange={(e) => setBotCommands(e.target.value)}
                rows={3}
                className="w-full bg-secondary border border-border rounded-xl p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
            </div>
          </div>

          <FloodControlPanel
            minDelay={minDelay}
            maxDelay={maxDelay}
            onMinDelayChange={setMinDelay}
            onMaxDelayChange={setMaxDelay}
          />
        </div>

        {/* Right Column: Execution & Generated Bot Token */}
        <div className="lg:col-span-5 space-y-5">
          <ModuleExecutionCard
            onExecute={handleExecute}
            isExecuting={executing}
            buttonText={mode === "create_bot" ? "Deploy Bot via @BotFather" : "Update Bot Configuration"}
          />

          {/* Generated Token Card */}
          {createdBot && (
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-success flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Bot Successfully Created
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  @{createdBot.username || botUsername}
                </span>
              </div>

              {createdBot.token && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">HTTP API Token</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdBot.token}
                      className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-mono text-primary outline-none"
                    />
                    <button
                      onClick={handleCopyToken}
                      className="px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1"
                    >
                      {copiedToken ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terminal */}
          <LogPanel
            entries={logs}
            title="@BotFather Communication Terminal"
            maxHeight="320px"
            onClear={() => setLogs([])}
          />
        </div>
      </div>

      <CrossLinkFooter
        links={[
          { label: "Referrals to Bots", href: "/dashboard/modules/referrals-to-bots" },
          { label: "PostBot Creator", href: "/dashboard/modules/postbot" },
          { label: "Channel Cloner", href: "/dashboard/modules/channel-cloner" },
        ]}
      />

      <ModuleFooter manualSlug="bot-creator" />
    </div>
  );
}
