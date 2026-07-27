"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Command, Hash, Users, BarChart3, Settings, Zap, Bot, Sparkles, Plus } from "lucide-react";

type Action = {
  id: string;
  label: string;
  desc: string;
  icon: any;
  href?: string;
  action?: () => void;
};

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions: Action[] = [
    { id: "dashboard", label: "Go to Dashboard", desc: "Home overview", icon: Hash, href: "/dashboard" },
    { id: "accounts", label: "Go to Accounts", desc: "Manage accounts", icon: Users, href: "/dashboard/accounts" },
    { id: "campaigns", label: "Go to Campaigns", desc: "View campaigns", icon: Zap, href: "/dashboard/campaigns" },
    { id: "new-campaign", label: "New Campaign", desc: "Create campaign wizard", icon: Plus, href: "/dashboard/campaigns/wizard" },
    { id: "modules", label: "Go to Modules", desc: "All modules", icon: Bot, href: "/dashboard/modules" },
    { id: "analytics", label: "Go to Analytics", desc: "Reports & charts", icon: BarChart3, href: "/dashboard/analytics" },
    { id: "neuro-text", label: "Go to Neuro-Text", desc: "Spintax & AI content", icon: Sparkles, href: "/dashboard/neuro-text" },
    { id: "settings", label: "Go to Settings", desc: "Profile & config", icon: Settings, href: "/dashboard/settings" },
  ];

  const filtered = query
    ? actions.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.desc.toLowerCase().includes(query.toLowerCase()))
    : actions;

  const nav = useCallback((dir: -1 | 1) => {
    setSelectedIdx(i => Math.max(0, Math.min(filtered.length - 1, i + dir)));
  }, [filtered.length]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery("");
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    setSelectedIdx(0);
  }, [open]);

  function execute(a: Action) {
    setOpen(false);
    setQuery("");
    if (a.href) router.push(a.href);
    else a.action?.();
  }

  return open ? (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onKeyDown={e => {
        if (e.key === "ArrowDown") { e.preventDefault(); nav(1); }
        if (e.key === "ArrowUp") { e.preventDefault(); nav(-1); }
        if (e.key === "Enter") { e.preventDefault(); execute(filtered[selectedIdx]); }
      }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
            placeholder="Search actions..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground" />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-secondary text-muted-foreground border border-border">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No results for &quot;{query}&quot;</p>
          )}
          {filtered.map((a, i) => (
            <div key={a.id} onClick={() => execute(a)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors ${
                i === selectedIdx ? "bg-primary/10 text-primary" : "hover:bg-secondary"
              }`}>
              <a.icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{a.label}</p>
                <p className="text-xs text-muted-foreground truncate">{a.desc}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;
}
