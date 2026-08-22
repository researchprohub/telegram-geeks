"use client";

import { useState } from "react";
import {
  Monitor, Globe, Shield, Terminal, Zap, CheckCircle2, Play,
  Cpu, Database, Sparkles, Layers, Sliders, RefreshCw, Send,
  Users, MessageSquare, ArrowRight, Activity, Smartphone, Server
} from "lucide-react";

interface ManualSystemPreviewProps {
  slug: string;
  title: string;
}

export function ManualSystemPreview({ slug, title }: ManualSystemPreviewProps) {
  const [platform, setPlatform] = useState<"desktop" | "web">("desktop");

  const getModuleMeta = () => {
    switch (slug) {
      case "invayt-v2":
      case "invayt-v1":
        return {
          moduleCode: "INV-V2",
          engineType: "MTProto Direct Concurrency",
          threads: 50,
          targetCount: "14,280 Members",
          speed: "120 invites / min",
          desktopFeatures: [
            "Direct MTProto socket connection without webhooks",
            "Pre-invite existence check & automated auto-skip",
            "Auto-stop on Spamblock, FloodWait, or DC rate limit",
            "Multi-account round-robin distribution with proxy binding"
          ],
          sampleLogs: [
            { time: "11:04:21", level: "INFO", text: "[Worker-01] Initializing DC4 session (+12025550193) via SOCKS5 185.220.101.4:1080" },
            { time: "11:04:22", level: "CHECK", text: "[Worker-01] Validating target @crypto_alex: verified not in target group" },
            { time: "11:04:23", level: "SUCCESS", text: "[Worker-01] INVITE_SUCCESS -> @crypto_alex added to @defi_alpha_vip (Latency: 138ms)" },
            { time: "11:04:24", level: "INFO", text: "[Worker-02] Rotating session -> +447911123456 (Task count: 18/45)" },
            { time: "11:04:25", level: "SUCCESS", text: "[Worker-02] INVITE_SUCCESS -> @solana_dev added to @defi_alpha_vip (Latency: 152ms)" },
          ]
        };
      case "otpravka-sms":
        return {
          moduleCode: "MASS-DM",
          engineType: "Neuro-Text Spintax Engine",
          threads: 60,
          targetCount: "38,500 Users",
          speed: "350 DMs / min",
          desktopFeatures: [
            "Advanced nested spintax {Hello|Hi|Hey} {friend|trader}",
            "Media attachments (Photos, Audio, Video, Files) with hash randomization",
            "Auto-repost from public/private Telegram channels",
            "Dynamic delay throttle with humanized typing imitation"
          ],
          sampleLogs: [
            { time: "14:20:01", level: "INFO", text: "[DM-Engine] Spintax variations compiled: 4,800 unique messages ready" },
            { time: "14:20:02", level: "SUCCESS", text: "[Thread-04] DM delivered to @whale_investor from +14155552671 (DC2)" },
            { time: "14:20:03", level: "SUCCESS", text: "[Thread-07] DM delivered to @defi_yield from +491512345678 (DC4)" },
            { time: "14:20:05", level: "INFO", text: "[Rate-Guard] Account +14155552671 sleeping 32s (Anti-Spam safety buffer)" },
          ]
        };
      case "sbor-auditorii":
        return {
          moduleCode: "PARSER-PRO",
          engineType: "High-Speed Member Scraper",
          threads: 20,
          targetCount: "12 Groups",
          speed: "1,500 members / sec",
          desktopFeatures: [
            "Active-member filtering by last seen timestamp (< 24h, < 3 days)",
            "Bio keyword filter (e.g. trader | investor | developer)",
            "Administrator exclusion & spam account detection",
            "One-click export to SQLite, JSON, and CSV databases"
          ],
          sampleLogs: [
            { time: "09:15:10", level: "INFO", text: "[Scraper] Connected to target supergroup: @solana_community (145,000 members)" },
            { time: "09:15:12", level: "INFO", text: "[Scraper] Applying filter: Last seen within 48 hours + Has valid username" },
            { time: "09:15:14", level: "SUCCESS", text: "[Scraper] Collected 12,450 active users. Database saved: solana_active_aug.json" },
          ]
        };
      case "dublikator-sessiy":
      case "dobavit-akkaunt":
      case "massovaya-proverka":
        return {
          moduleCode: "ACC-MGR",
          engineType: "MTProto Session Manager",
          threads: 100,
          targetCount: "250 Accounts",
          speed: "Zero-latency local cache",
          desktopFeatures: [
            "Automatic categorization: Active, Warm-up, Temp Block, Spamblock, Banned",
            "Full Telethon & Pyrogram session compatibility with TData bridge",
            "Batch proxy assignment with automatic failover",
            "Detailed DC ID, Ping, Trust Score, and Spamblock countdown timers"
          ],
          sampleLogs: [
            { time: "08:00:01", level: "INFO", text: "[SessionManager] Scanned ./sessions directory: 250 session files found" },
            { time: "08:00:03", level: "SUCCESS", text: "[HealthCheck] 242 accounts Active (Health: 98.4%), 8 in Temp Cooldown" },
            { time: "08:00:04", level: "INFO", text: "[ProxyCheck] All 50 IPv4 mobile proxies responding with ping < 160ms" },
          ]
        };
      case "proverka-dobavlenie-i-udalenie-proksi":
        return {
          moduleCode: "PROXY-HUB",
          engineType: "Multi-Protocol Proxy Pool",
          threads: 80,
          targetCount: "150 Proxies",
          speed: "100 checks / 5s",
          desktopFeatures: [
            "Supports HTTP, HTTPS, SOCKS5, and MTProto secret proxies",
            "Automated IP rotation via HTTP reboot webhooks",
            "Real-time latency ping matrix & country geo-location tags",
            "Zero-leak proxy fallback & strict IP isolation mode"
          ],
          sampleLogs: [
            { time: "16:10:02", level: "CHECK", text: "[ProxyTester] Testing proxy 185.120.45.12:1080 (SOCKS5)..." },
            { time: "16:10:03", level: "SUCCESS", text: "[ProxyTester] Proxy 185.120.45.12:1080 -> Latency: 92ms | IP: 185.120.45.12 (Germany)" },
            { time: "16:10:04", level: "INFO", text: "[Rotation] Webhook trigger sent to mobile proxy modem #4 (New IP acquired)" },
          ]
        };
      case "buster-akkauntov":
        return {
          moduleCode: "BOOSTER-AI",
          engineType: "30-Day Progressive Warmup",
          threads: 40,
          targetCount: "60 Accounts",
          speed: "Humanized interval dynamics",
          desktopFeatures: [
            "Multi-stage warming: Read Only -> Reactions -> Brief Reply -> Full Chat",
            "Automated dialog simulation between user account clusters",
            "Natural reading delays and variable typing speeds",
            "Significant reduction in Telegram anti-spam detection"
          ],
          sampleLogs: [
            { time: "18:05:12", level: "INFO", text: "[Booster] Account cluster #2 entering Stage 3 (Brief Reply simulation)" },
            { time: "18:05:14", level: "SUCCESS", text: "[Booster] +12025550144 replied with reaction 👍 to +447911123899 in private chat" },
            { time: "18:05:16", level: "SUCCESS", text: "[TrustScore] Account +12025550144 trust score increased: 84 -> 86 (+2)" },
          ]
        };
      case "konverter-v-tdata":
        return {
          moduleCode: "CONV-MATRIX",
          engineType: "Bidirectional Session Converter",
          threads: 30,
          targetCount: "Batch Mode",
          speed: "Instant conversion",
          desktopFeatures: [
            "Convert Telethon (.session) <-> Telegram Desktop (tdata)",
            "JSON metadata extraction & parameter injection",
            "Bulk folder export for easy migration into multi-account tools",
            "Integrity check & corrupted auth key detection"
          ],
          sampleLogs: [
            { time: "12:30:01", level: "INFO", text: "[Converter] Reading input directory: 50 .session files detected" },
            { time: "12:30:03", level: "SUCCESS", text: "[Converter] 50/50 accounts successfully converted to Telegram Desktop tdata format" },
            { time: "12:30:04", level: "INFO", text: "[Export] Saved output archive: telegramgeeks_tdata_export.zip" },
          ]
        };
      case "universalnyiy-registrator":
      case "ruchnaya-registratsiya-sim":
        return {
          moduleCode: "REG-SUITE",
          engineType: "Automated SMS & SIM Registrar",
          threads: 15,
          targetCount: "SMS Provider Pool",
          speed: "Sub-minute registration",
          desktopFeatures: [
            "Direct integration with 5SIM, SMS-Activate, Grizzly SMS, and SMSPool",
            "Automated country/operator selection with price optimization",
            "Device fingerprint spoofing (Samsung, iPhone, Xiaomi, Google Pixel)",
            "Automated 2FA cloud password setup & profile randomization"
          ],
          sampleLogs: [
            { time: "13:12:00", level: "INFO", text: "[SMS-Gateway] Requesting virtual number from 5SIM (Country: Brazil, Service: Telegram)" },
            { time: "13:12:04", level: "SUCCESS", text: "[SMS-Gateway] Number acquired: +5511987654321 (Order #849201)" },
            { time: "13:12:12", level: "SUCCESS", text: "[SMS-Gateway] SMS code received: 84920 -> Telegram account created successfully" },
            { time: "13:12:15", level: "SUCCESS", text: "[2FA] Cloud password applied: ****** | Session saved to ./sessions/+5511987654321.session" },
          ]
        };
      default:
        return {
          moduleCode: "TG-MODULE",
          engineType: "Direct MTProto Automation",
          threads: 50,
          targetCount: "High Throughput",
          speed: "Optimized execution",
          desktopFeatures: [
            "Hardware-accelerated concurrency engine with socket multiplexing",
            "Smart proxy binding with automatic health failover",
            "Granular rate limit safeguards and FloodWait auto-pause",
            "Real-time telemetry and structured diagnostic logging"
          ],
          sampleLogs: [
            { time: "10:00:01", level: "INFO", text: `[Engine] Initializing ${title} module with 50 active worker threads...` },
            { time: "10:00:03", level: "SUCCESS", text: "[Engine] All worker threads connected to Telegram MTProto datacenters" },
            { time: "10:00:05", level: "SUCCESS", text: `[Engine] Module task executing with 100% success rate` },
          ]
        };
    }
  };

  const meta = getModuleMeta();

  return (
    <div className="my-8 rounded-2xl border border-white/10 bg-[#07090E] overflow-hidden shadow-2xl shadow-black/50">
      {/* ── System Header & Platform Selector ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-white/10 bg-[#0A0E17]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono text-white/40 border-l border-white/10 pl-3 hidden sm:inline">
            TelegramGeeks Pro Live System Interface
          </span>
        </div>

        {/* Platform View Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/40 border border-white/10">
          <button
            onClick={() => setPlatform("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              platform === "desktop"
                ? "bg-[hsl(var(--primary))] text-black shadow-sm font-semibold"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Native App</span>
          </button>
          <button
            onClick={() => setPlatform("web")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              platform === "web"
                ? "bg-[hsl(var(--primary))] text-black shadow-sm font-semibold"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web Cloud Dashboard</span>
          </button>
        </div>
      </div>

      {/* ── System Preview Body ── */}
      <div className="p-5 sm:p-6 space-y-6">
        {platform === "desktop" ? (
          /* ──────── DESKTOP APP INTERFACE PREVIEW ──────── */
          <div className="space-y-4">
            {/* Desktop Control Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30 flex items-center justify-center text-[hsl(var(--primary))]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">TelegramGeeks Pro Desktop v2.4.0</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      HWID LOCKED
                    </span>
                  </div>
                  <p className="text-xs text-white/50 font-mono mt-0.5">
                    Module: <span className="text-[hsl(var(--primary))]">{title}</span> ({meta.moduleCode}) • Concurrency: {meta.threads} Threads
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-white/[0.05] text-white/80 border border-white/10">
                  <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>Speed: {meta.speed}</span>
                </span>
              </div>
            </div>

            {/* Desktop App Window Grid Mockup */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Configuration Pane */}
              <div className="lg:col-span-5 rounded-xl border border-white/10 bg-black/40 p-4 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[hsl(var(--primary))]" /> Parameter Configuration
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">✓ Ready to Run</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <span className="text-white/60">Execution Engine:</span>
                    <span className="font-mono font-medium text-white">{meta.engineType}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <span className="text-white/60">Target Database / Pool:</span>
                    <span className="font-mono font-medium text-[hsl(var(--primary))]">{meta.targetCount}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <span className="text-white/60">Anti-Ban Safeguards:</span>
                    <span className="font-mono font-medium text-emerald-400">FloodWait Auto-Pause (45s)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <span className="text-white/60">Proxy Mode:</span>
                    <span className="font-mono font-medium text-white">SOCKS5 / Mobile Rotation</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="p-3 rounded-lg bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/20 space-y-1.5">
                    <div className="text-[11px] font-semibold text-[hsl(var(--primary))] flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Key Desktop Features
                    </div>
                    <ul className="text-[11px] text-white/60 space-y-1">
                      {meta.desktopFeatures.map((feat, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold leading-none mt-0.5">•</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Live Execution Console */}
              <div className="lg:col-span-7 rounded-xl border border-white/10 bg-black/60 p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-1.5 font-mono">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Real-time Execution Console
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Socket Feed
                  </span>
                </div>

                {/* Console Log Feed */}
                <div className="font-mono text-[11px] space-y-1.5 p-3 rounded-lg bg-[#04060A] border border-white/5 text-white/70 overflow-x-auto min-h-[160px]">
                  {meta.sampleLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-white/30 shrink-0">[{log.time}]</span>
                      <span
                        className={`px-1 rounded text-[9px] font-bold shrink-0 ${
                          log.level === "SUCCESS"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : log.level === "CHECK"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-white/80 break-all">{log.text}</span>
                    </div>
                  ))}
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between text-xs text-white/50 pt-1 border-t border-white/5 font-mono">
                  <span>Threads Active: 50 / 50</span>
                  <span className="text-emerald-400">Success Rate: 99.8%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ──────── WEB CLOUD DASHBOARD PREVIEW ──────── */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">TelegramGeeks Pro Cloud Web Panel</h4>
                  <p className="text-xs text-white/50">
                    Cloud Task Orchestrator • PostgreSQL High-Availability Cluster
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Cloud Synchronized
                </span>
              </div>
            </div>

            {/* Web App Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                <div className="text-xs text-white/40 mb-1">Active Tasks</div>
                <div className="text-xl font-bold font-mono text-white">12</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">+100% Online</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                <div className="text-xs text-white/40 mb-1">Daily Throughput</div>
                <div className="text-xl font-bold font-mono text-[hsl(var(--primary))]">48,200</div>
                <div className="text-[10px] text-white/50 mt-0.5">Actions Processed</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                <div className="text-xs text-white/40 mb-1">Connected Sessions</div>
                <div className="text-xl font-bold font-mono text-emerald-400">242 / 250</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">96.8% Health</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                <div className="text-xs text-white/40 mb-1">Proxy Latency</div>
                <div className="text-xl font-bold font-mono text-white">114ms</div>
                <div className="text-[10px] text-white/50 mt-0.5">Global Avg Ping</div>
              </div>
            </div>

            {/* Cloud Workflow Pipeline Card */}
            <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-white/80">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" /> Automated Cloud Workflow Pipeline
                </span>
                <span className="text-[11px] font-mono text-white/40">Auto-Scaling Enabled</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="font-bold text-[hsl(var(--primary))] mb-1">1. Data Ingestion</div>
                  <p className="text-[11px] text-white/50">Uploads session archives or connects audience lists</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="font-bold text-[hsl(var(--primary))] mb-1">2. Health Validation</div>
                  <p className="text-[11px] text-white/50">Tests proxy ping, DC connection, and spam limits</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="font-bold text-[hsl(var(--primary))] mb-1">3. Concurrency Run</div>
                  <p className="text-[11px] text-white/50">Dispatches tasks across multi-threaded workers</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="font-bold text-[hsl(var(--primary))] mb-1">4. Telemetry Report</div>
                  <p className="text-[11px] text-white/50">Real-time execution stats and exportable logs</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
