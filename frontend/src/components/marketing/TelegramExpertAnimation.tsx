"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Zap,
  Users,
  MessageCircle,
  Search,
  Globe,
  Sparkles,
  Shield,
  KeyRound,
  FileCode,
  Share2,
  Flame,
  Crown,
  FolderSync,
  Bot,
  Activity,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";

// ─── Three.js / Canvas Particle Background ──────────────────────────────
export function ParticleMeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || 600;
    };
    window.addEventListener("resize", onResize);

    // Particle nodes
    const count = 45;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 0.8,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connecting lines
      ctx.strokeStyle = "rgba(47, 252, 212, 0.08)";
      ctx.lineWidth = 0.8;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and move nodes
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = "rgba(47, 252, 212, 0.4)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-70"
    />
  );
}

// ─── Stat Counter Ticker ───────────────────────────────────────────────────
interface StatItemProps {
  label: string;
  value: number;
  suffix?: string;
  sublabel: string;
}

export function StatCounter({ label, value, suffix = "", sublabel }: StatItemProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1400;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center p-4">
      <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-mono text-[#2ffcd4] tracking-tight drop-shadow-[0_0_15px_rgba(47,252,212,0.3)]">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs uppercase tracking-wider font-semibold text-white/90 mt-1">{label}</div>
      <div className="text-[11px] text-white/50">{sublabel}</div>
    </div>
  );
}

// ─── Interactive Live Simulator Demo ─────────────────────────────────────────
export function LiveModuleSimulator() {
  const [activeTab, setActiveTab] = useState<"scraper" | "warmer" | "interceptor" | "registrar">("scraper");

  const SIM_DATA = {
    scraper: {
      title: "Audience Scraper & Parser",
      badge: "Target Filter: Online 24h",
      steps: [
        { time: "00:01", msg: "Connecting to t.me/cryptoleads via MTProto TLS 1.3...", color: "text-white/60" },
        { time: "00:02", msg: "Resolving 14,890 members list (Admin right bypass)", color: "text-[#2ffcd4]" },
        { time: "00:03", msg: "Applying filters: Activity < 24h, Premium status, Phone hidden", color: "text-yellow-400" },
        { time: "00:04", msg: "Extracted 2,840 high-intent active leads. Exported to DB/CSV.", color: "text-emerald-400" },
      ],
    },
    warmer: {
      title: "AI Persona Warmup & Booster",
      badge: "P2P Autonomous Dialogue",
      steps: [
        { time: "00:01", msg: "Allocating 10 mobile proxies (4G US / EU rotation)...", color: "text-white/60" },
        { time: "00:02", msg: "Spawning Persona: 'Sarah - Crypto Trader' & 'Alex - Dev'", color: "text-[#2ffcd4]" },
        { time: "00:04", msg: "Generating natural conversational exchange with GPT Neuro-Text", color: "text-yellow-400" },
        { time: "00:06", msg: "Account trust score elevated: 98/100 (Zero flood risk)", color: "text-emerald-400" },
      ],
    },
    interceptor: {
      title: "Real-Time Message Interceptor",
      badge: "Keyword Trigger: 'Looking for vendor'",
      steps: [
        { time: "00:01", msg: "Listening to 35 public marketing groups in background...", color: "text-white/60" },
        { time: "00:03", msg: "MATCH: User @mark_trader: 'Where can I buy bulk accounts?'", color: "text-[#2ffcd4]" },
        { time: "00:04", msg: "Triggering instant direct DM via warm operator account #14", color: "text-yellow-400" },
        { time: "00:05", msg: "Lead captured & notified to operator Telegram bot in 420ms.", color: "text-emerald-400" },
      ],
    },
    registrar: {
      title: "Universal SMS Registrar & 2FA",
      badge: "10+ Virtual SMS Gateways",
      steps: [
        { time: "00:01", msg: "Acquiring virtual numbers from SMS-Activate & 5SIM...", color: "text-white/60" },
        { time: "00:02", msg: "Emulating Android 14 Samsung S24 Ultra fingerprint spec", color: "text-[#2ffcd4]" },
        { time: "00:03", msg: "SMS code received: 84920. Generating 2FA cloud password.", color: "text-yellow-400" },
        { time: "00:05", msg: "Session generated & converted to TData / Telethon SQLite.", color: "text-emerald-400" },
      ],
    },
  };

  const cur = SIM_DATA[activeTab];

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-white/[0.12] bg-[#07090a] p-6 shadow-[0_0_50px_rgba(47,252,212,0.06)] backdrop-blur-xl">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-4 mb-4">
        {[
          { id: "scraper", label: "Audience Scraper", icon: Search },
          { id: "warmer", label: "AI Persona Booster", icon: Flame },
          { id: "interceptor", label: "Lead Interceptor", icon: Sparkles },
          { id: "registrar", label: "SMS Registrar", icon: KeyRound },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? "bg-[#2ffcd4]/15 text-[#2ffcd4] border border-[#2ffcd4]/40 shadow-[0_0_15px_rgba(47,252,212,0.15)]"
                  : "bg-white/[0.03] text-white/60 hover:text-white border border-white/[0.06]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Terminal Display */}
      <div className="rounded-xl bg-[#020404] border border-white/[0.08] p-4 font-mono text-xs space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-white/40 pb-2 border-b border-white/[0.06]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>MODULE: {cur.title.toUpperCase()}</span>
          </span>
          <span className="text-[#2ffcd4] bg-[#2ffcd4]/10 px-2 py-0.5 rounded border border-[#2ffcd4]/20">
            {cur.badge}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 pt-1"
          >
            {cur.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="text-white/30 text-[10px] select-none">[{step.time}]</span>
                <span className={`${step.color} leading-relaxed`}>{step.msg}</span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
