"use client";

import { useState } from "react";
import { Bot, Play, CheckCircle2, Loader2, Link2, Sparkles, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function BotCreatorPage() {
  const [botName, setBotName] = useState<string>("Geeks Assistant");
  const [botUsername, setBotUsername] = useState<string>("geeks_support_bot");
  const [description, setDescription] = useState<string>("Official Support & Info Bot powered by Telegram Geeks Pro.");
  const [linkAutoresponder, setLinkAutoresponder] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const handleCreateBot = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/workflow/run-step", {
        stage_number: 7,
        step_id: "7A",
        operation: "create_bot",
        params: {
          name: botName,
          username: botUsername,
          description,
          link_autoresponder: linkAutoresponder,
        },
      });
      setResult(res.data);
    } catch (e: any) {
      setResult({ status: "error", message: e.message || "Bot creation failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          Automated Bot Creator
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create, configure, and wire Telegram bots automatically via BotFather API with autoresponder and webhook bindings
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Bot Display Name</label>
            <input
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Bot Username (must end in 'bot')</label>
            <input
              value={botUsername}
              onChange={(e) => setBotUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">About / Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground"
          />
        </div>

        <div className="p-4 rounded-xl bg-secondary border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-bold text-foreground">Link to Autoresponder & Unified Inbox</p>
              <p className="text-[11px] text-muted-foreground">Automatically route incoming user queries to AI responders</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={linkAutoresponder}
            onChange={(e) => setLinkAutoresponder(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-border">
          <button
            onClick={handleCreateBot}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            {loading ? "Registering Bot..." : "Create Bot via BotFather"}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <CheckCircle2 className="h-4 w-4" /> Bot Created Successfully
          </div>
          <pre className="p-3 bg-secondary rounded-lg font-mono text-xs text-foreground overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
