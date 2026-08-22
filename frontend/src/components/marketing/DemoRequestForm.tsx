"use client";

import { useState } from "react";
import {
  Sparkles,
  Clock,
  Gift,
  CheckCircle2,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Zap,
  ArrowRight,
  Laptop,
  MessageSquare,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import axios from "axios";

export function DemoRequestForm() {
  const [selectedProgram, setSelectedProgram] = useState<"tggeeks" | "sphere">("tggeeks");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoKey, setDemoKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleRequestDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProgram === "sphere") {
      window.open("https://sphere.chat/", "_blank");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Request demo key from backend API
      const res = await axios.post("/api/v1/licenses/admin/generate", {
        plan_tier: "demo",
        duration_days: 1,
        max_accounts: 100,
        max_campaigns: 50,
        team_seats: 5,
        allowed_modules: ["*"],
        customer_email: email.trim() || "demo-user@telegramgeekspro.com",
        notes: "Self-service 24h web demo key",
        batch_count: 1,
      });

      const key = res.data?.license?.key || (res.data?.licenses && res.data.licenses[0]?.key);
      if (key) {
        setDemoKey(key);
      } else {
        // Fallback demo key format
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        setDemoKey(`TGGEEKS-DEMO-24H0-${rand}-0001`);
      }
    } catch (err: any) {
      // If backend is offline, generate local validatable demo key
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      setDemoKey(`TGGEEKS-DEMO-24H0-${rand}-0001`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!demoKey) return;
    navigator.clipboard.writeText(demoKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/[0.12] bg-[#070a0a]/90 backdrop-blur-xl p-6 sm:p-8 shadow-[0_0_50px_rgba(47,252,212,0.06)] space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2ffcd4]/30 bg-[#2ffcd4]/10 text-xs font-semibold text-[#2ffcd4] mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Select Program for 24-Hour Access</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white">Choose Your Automation Tool</h3>
      </div>

      {/* Program Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Telegram Geeks Option */}
        <div
          onClick={() => setSelectedProgram("tggeeks")}
          className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
            selectedProgram === "tggeeks"
              ? "border-[#2ffcd4] bg-[#2ffcd4]/[0.08] shadow-[0_0_20px_rgba(47,252,212,0.15)]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#2ffcd4]" />
                <span className="font-bold text-sm text-white">TelegramGeeks Pro</span>
              </div>
              <input
                type="radio"
                name="program"
                checked={selectedProgram === "tggeeks"}
                onChange={() => setSelectedProgram("tggeeks")}
                className="accent-[#2ffcd4]"
              />
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Complete Windows automation suite with 77+ modules, SMS registration, group scraping, and AI persona warmup.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/[0.06] text-[11px] font-semibold text-[#2ffcd4]">
            ✓ All 77+ Modules Included
          </div>
        </div>

        {/* Sphere Chat Option */}
        <div
          onClick={() => setSelectedProgram("sphere")}
          className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
            selectedProgram === "sphere"
              ? "border-[#2ffcd4] bg-[#2ffcd4]/[0.08] shadow-[0_0_20px_rgba(47,252,212,0.15)]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#2ffcd4]" />
                <span className="font-bold text-sm text-white">Sphere.Chat</span>
              </div>
              <input
                type="radio"
                name="program"
                checked={selectedProgram === "sphere"}
                onChange={() => setSelectedProgram("sphere")}
                className="accent-[#2ffcd4]"
              />
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Encrypted private messenger & community of 5,000+ professional Telegram marketers and traffic operators.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/[0.06] text-[11px] font-semibold text-white/50">
            External Community Registration
          </div>
        </div>
      </div>

      {/* Generated Result Card or Request Form */}
      {demoKey ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Your 24-Hour Demo License Is Ready!</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
              VALID FOR 24H
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/60 border border-white/[0.1] flex items-center justify-between gap-3">
            <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wider select-all">
              {demoKey}
            </span>
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-lg bg-[#2ffcd4] text-[#071412] text-xs font-bold hover:bg-[#38ecd6] transition-all flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(47,252,212,0.25)]"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Key"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href="/download"
              className="py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition-all"
            >
              <Download className="w-4 h-4 text-[#2ffcd4]" />
              <span>Download Windows App</span>
            </a>
            <a
              href="/manuals"
              className="py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition-all"
            >
              <span>Quick Start Manual</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="text-[11px] text-white/50 space-y-1 pt-2 border-t border-white/[0.06]">
            <div>1. Launch the Telegram Geeks desktop app on your PC.</div>
            <div>2. Open <strong>License Manager</strong> from the sidebar.</div>
            <div>3. Paste your demo key and click <strong>Activate</strong>.</div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRequestDemo} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-white/70 block mb-1.5">
              Your Email Address (Optional for receiving key backup)
            </label>
            <input
              type="email"
              placeholder="you@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#2ffcd4] focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2ffcd4] to-[#12d6aa] text-[#071412] font-bold text-xs sm:text-sm hover:opacity-95 transition-all shadow-[0_0_25px_rgba(47,252,212,0.25)] hover:shadow-[0_0_35px_rgba(47,252,212,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>{loading ? "Generating 24h Demo Key…" : selectedProgram === "sphere" ? "Open Sphere.Chat Website" : "Get 24-Hour Demo Access Free"}</span>
          </button>

          <p className="text-[11px] text-white/40 text-center">
            Demo keys are activated instantly and provide full access for 24 hours. No credit card required.
          </p>
        </form>
      )}
    </div>
  );
}
