"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Cpu, Sparkles, Key, Zap, CheckCircle2,
  XCircle, Sliders, Play, RefreshCw, Layers,
  Terminal, Shield, AlertTriangle, ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";

const AI_PROVIDERS = [
  {
    id: "openai", name: "OpenAI", type: "Commercial",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo", "o1-mini"],
    isFree: false, badge: "⚡ Top Quality",
    description: "Industry-standard reasoning and conversational fidelity.",
    keyPlaceholder: "sk-proj-...",
  },
  {
    id: "anthropic", name: "Anthropic", type: "Commercial",
    models: ["claude-3-5-sonnet", "claude-3-haiku", "claude-3-opus"],
    isFree: false, badge: "🧠 Best Nuance",
    description: "Exceptional persona adherence, nuance, and safety.",
    keyPlaceholder: "sk-ant-api03-...",
  },
  {
    id: "groq", name: "Groq", type: "High-Speed Free",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    isFree: true, badge: "🚀 Ultra Fast (Free)",
    description: "Hardware-accelerated LPU inference with zero latency.",
    keyPlaceholder: "gsk_...",
  },
  {
    id: "ollama", name: "Ollama (Local)", type: "Offline / Self-Hosted",
    models: ["llama3.1", "mistral", "qwen2.5", "phi3", "gemma2"],
    isFree: true, badge: "🔒 100% Private (Local)",
    description: "Run local quantized models directly inside your container or GPU.",
    keyPlaceholder: "http://localhost:11434",
  },
  {
    id: "google_gemini", name: "Google Gemini", type: "Free Tier",
    models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"],
    isFree: true, badge: "🆓 Free Tier (AI Studio)",
    description: "Massive context window with high reasoning throughput.",
    keyPlaceholder: "AIzaSy...",
  },
  {
    id: "nvidia_nim", name: "NVIDIA NIM", type: "Free Tier",
    models: ["meta/llama-3.1-70b-instruct", "meta/llama-3.1-8b-instruct", "mistralai/mixtral-8x7b-instruct-v0.1"],
    isFree: true, badge: "⚡ 40 RPM (No Cap)",
    description: "NVIDIA cloud-hosted microservices for open models.",
    keyPlaceholder: "nvapi-...",
  },
  {
    id: "cerebras", name: "Cerebras", type: "Free Tier",
    models: ["llama-3.1-70b", "llama-3.1-8b"],
    isFree: true, badge: "⚡ 30 RPM (Free)",
    description: "Wafer-scale cluster inference delivering 1,800+ tokens/sec.",
    keyPlaceholder: "csk-...",
  },
  {
    id: "cloudflare_workers_ai", name: "Cloudflare Workers AI", type: "Serverless",
    models: ["@cf/meta/llama-3.1-8b-instruct", "@cf/mistral/mistral-7b-instruct-v0.1"],
    isFree: true, badge: "🌐 Edge Serverless",
    description: "Serverless model inference distributed across Cloudflare's edge.",
    keyPlaceholder: "Cloudflare API Token",
  },
  {
    id: "openrouter", name: "OpenRouter", type: "Aggregator",
    models: ["openrouter/auto", "meta-llama/llama-3.3-70b-instruct:free", "google/gemini-flash-1.5:free"],
    isFree: false, badge: "🔀 100+ Models in 1 Key",
    description: "Single unified API key accessing hundreds of AI models.",
    keyPlaceholder: "sk-or-v1-...",
  },
  {
    id: "siliconflow", name: "SiliconFlow", type: "Free Tier",
    models: ["Qwen/Qwen2.5-7B-Instruct", "deepseek-ai/DeepSeek-V3", "deepseek-ai/DeepSeek-R1"],
    isFree: true, badge: "🇨🇳 DeepSeek & Qwen",
    description: "High-performance inference for DeepSeek and Qwen open models.",
    keyPlaceholder: "sk-...",
  },
  {
    id: "cohere", name: "Cohere", type: "Commercial",
    models: ["command-r", "command-r-plus"],
    isFree: false, badge: "🎯 RAG Specialized",
    description: "Enterprise conversational and retrieval-augmented generation.",
    keyPlaceholder: "cohere_api_key",
  },
  {
    id: "mistral_ai", name: "Mistral AI", type: "Commercial / Free",
    models: ["mistral-small", "mistral-large", "codestral"],
    isFree: false, badge: "🇫🇷 European Sovereign",
    description: "Efficient frontier European multilingual open-weight models.",
    keyPlaceholder: "mistral_api_key",
  },
  {
    id: "github", name: "GitHub Models", type: "Free Tier",
    models: ["gpt-4o-mini", "Meta-Llama-3.1-70B-Instruct", "Mistral-large"],
    isFree: true, badge: "🐙 Free with GitHub PAT",
    description: "Azure AI-backed model catalog for GitHub developers.",
    keyPlaceholder: "ghp_...",
  },
];

export default function AIModelsPage() {
  const [defaultProvider, setDefaultProvider] = useState("openai");
  const [defaultModel, setDefaultModel] = useState("gpt-4o-mini");
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(150);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");

  // Test Playground State
  const [testPrompt, setTestPrompt] = useState("Hey bro, did you see that new Solana DeFi protocol? Thoughts?");
  const [testSystem, setTestSystem] = useState("You are Crypto Dave, an informal Web3 degen trader. Keep it punchy under 25 words.");
  const [testOutput, setTestOutput] = useState("");
  const [testing, setTesting] = useState(false);
  const [testLatency, setTestLatency] = useState<number | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await api.get("/global-config");
      const gpt = res.data?.gpt || {};
      if (gpt.default_provider) setDefaultProvider(gpt.default_provider);
      if (gpt.model) setDefaultModel(gpt.model);
    } catch {
      // ignore
    }
  }

  async function handleSaveConfig() {
    setSaving(true);
    try {
      await api.put("/global-config", {
        section: "gpt",
        key: "default_provider",
        value: defaultProvider,
      });
      await api.put("/global-config", {
        section: "gpt",
        key: "model",
        value: defaultModel,
      });
      setNotification("AI configuration updated successfully!");
      setTimeout(() => setNotification(""), 4000);
    } catch (err: any) {
      setNotification("Failed to save AI configuration");
      setTimeout(() => setNotification(""), 4000);
    } finally {
      setSaving(false);
    }
  }

  async function handleRunTest() {
    setTesting(true);
    setTestOutput("");
    const startTime = Date.now();
    try {
      const res = await api.post("/neuro-text/generate", {
        prompt: testPrompt,
        tone: "casual",
        persona_context: testSystem,
        spin_count: 1,
      });
      setTestLatency(Date.now() - startTime);
      setTestOutput(res.data?.text || res.data?.variations?.[0] || "Response received successfully.");
    } catch (err: any) {
      setTestLatency(Date.now() - startTime);
      setTestOutput(err.response?.data?.detail || "Error connecting to AI Provider. Verify API key and fallback chain.");
    } finally {
      setTesting(false);
    }
  }

  const activeProviderMeta = AI_PROVIDERS.find(p => p.id === defaultProvider) || AI_PROVIDERS[0];

  return (
    <div className="min-h-screen p-8 space-y-8 bg-background text-foreground">

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              AI Multi-Provider Engine & Model Routing
              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-xs">
                13 Providers Supported
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure paid APIs, free cloud models, and local Ollama inference with automatic failover routing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSaveConfig} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Sparkles className="w-4 h-4" /> {saving ? "Saving..." : "Save AI Defaults"}
          </Button>
        </div>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {notification}
        </motion.div>
      )}

      {/* ── Fallback Chain Banner ───────────────────────────────────────────── */}
      <Card className="bg-gradient-to-r from-blue-500/10 via-primary/10 to-teal-500/10 border border-primary/30 p-5 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Zero-Downtime Smart Fallback Chain</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                If your primary provider hits rate limits or API outages, requests seamlessly cascade to the next free provider.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-primary bg-background/60 border border-border px-3 py-1.5 rounded-xl">
            <span className="font-semibold text-white">OpenAI</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-white">Groq</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-white">NVIDIA NIM</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-white">Ollama (Local)</span>
          </div>
        </div>
      </Card>

      {/* ── Main 2-Column Grid: Settings & Playground ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Column 1: Primary Model Selector & Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-card/70 border border-border p-6 space-y-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" /> Active Default AI Provider
            </h2>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Primary Provider</label>
              <select
                value={defaultProvider}
                onChange={e => {
                  setDefaultProvider(e.target.value);
                  const p = AI_PROVIDERS.find(x => x.id === e.target.value);
                  if (p && p.models[0]) setDefaultModel(p.models[0]);
                }}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary font-medium"
              >
                {AI_PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isFree ? "(Free / Open)" : "(Commercial)"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Default Model</label>
              <select
                value={defaultModel}
                onChange={e => setDefaultModel(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-primary"
              >
                {activeProviderMeta.models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-border/50 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Creativity / Temperature</span>
                <span className="text-primary font-mono font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />

              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Max Outbound Tokens</span>
                <span className="text-primary font-mono font-bold">{maxTokens} tokens</span>
              </div>
              <input
                type="range"
                min="30"
                max="500"
                step="10"
                value={maxTokens}
                onChange={e => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </Card>

          {/* Provider API Keys Quick Config */}
          <Card className="bg-card/70 border border-border p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" /> Provider API Keys & Tokens
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {AI_PROVIDERS.map(p => (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-white">{p.name}</span>
                    <span className="text-muted-foreground text-[10px]">{p.isFree ? "Free Tier" : "API Key"}</span>
                  </div>
                  <input
                    type="password"
                    placeholder={p.keyPlaceholder}
                    value={apiKeys[p.id] || ""}
                    onChange={e => setApiKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-muted-foreground/40 font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Column 2: Interactive Test Playground (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-card/70 border border-border p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" /> Live Model Inference Playground
              </h2>
              {testLatency && (
                <Badge variant="outline" className="font-mono text-[10px] text-emerald-400 border-emerald-500/30">
                  {testLatency}ms latency
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">System Persona Context</label>
              <textarea
                value={testSystem}
                onChange={e => setTestSystem(e.target.value)}
                rows={2}
                className="w-full bg-background/80 border border-border rounded-xl p-3 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Simulated User / Community Input</label>
              <textarea
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                rows={2}
                className="w-full bg-background/80 border border-border rounded-xl p-3 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleRunTest} disabled={testing} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Play className={`w-4 h-4 ${testing ? "animate-spin" : ""}`} />
                {testing ? "Generating Response..." : "Test Generation"}
              </Button>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Model Output Stream</label>
              <div className="w-full min-h-[140px] bg-background/90 border border-border rounded-xl p-4 text-sm font-mono text-emerald-300">
                {testOutput ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{testOutput}</p>
                ) : (
                  <p className="text-muted-foreground/40 italic">Click &quot;Test Generation&quot; to test your active AI provider...</p>
                )}
              </div>
            </div>
          </Card>

          {/* Provider Cards Catalog Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AI_PROVIDERS.slice(0, 6).map(p => (
              <Card key={p.id} className="bg-card/50 border border-border/60 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{p.name}</h4>
                  <span className="text-[10px] text-primary font-mono">{p.badge}</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{p.description}</p>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
