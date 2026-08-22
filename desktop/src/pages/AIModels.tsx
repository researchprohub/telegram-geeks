import { useState, useEffect } from "react";
import { Brain, Cpu, Sparkles, Key, Zap, CheckCircle2, Sliders, Play, RefreshCw, Layers, Terminal } from "lucide-react";
import { globalConfigApi, neuroTextApi, detail } from "../lib/api";

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", type: "Commercial", models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"], badge: "⚡ Top Quality" },
  { id: "anthropic", name: "Anthropic", type: "Commercial", models: ["claude-3-5-sonnet", "claude-3-haiku"], badge: "🧠 Nuance" },
  { id: "groq", name: "Groq", type: "High-Speed Free", models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"], badge: "🚀 Ultra Fast (Free)" },
  { id: "ollama", name: "Ollama (Local)", type: "Offline / Self-Hosted", models: ["llama3.1", "mistral", "qwen2.5"], badge: "🔒 100% Private" },
  { id: "google_gemini", name: "Google Gemini", type: "Free Tier", models: ["gemini-1.5-flash", "gemini-1.5-pro"], badge: "🆓 Free Tier" },
  { id: "nvidia_nim", name: "NVIDIA NIM", type: "Free Tier", models: ["meta/llama-3.1-70b-instruct"], badge: "⚡ 40 RPM" },
  { id: "cerebras", name: "Cerebras", type: "Free Tier", models: ["llama-3.1-70b", "llama-3.1-8b"], badge: "⚡ 30 RPM" },
  { id: "cloudflare_workers_ai", name: "Cloudflare", type: "Serverless", models: ["@cf/meta/llama-3.1-8b-instruct"], badge: "🌐 Serverless" },
  { id: "openrouter", name: "OpenRouter", type: "Aggregator", models: ["openrouter/auto", "meta-llama/llama-3.3-70b-instruct:free"], badge: "🔀 Multi-Model" },
  { id: "siliconflow", name: "SiliconFlow", type: "Free Tier", models: ["deepseek-ai/DeepSeek-V3", "deepseek-ai/DeepSeek-R1"], badge: "🇨🇳 DeepSeek" },
  { id: "cohere", name: "Cohere", type: "Commercial", models: ["command-r", "command-r-plus"], badge: "🎯 RAG" },
  { id: "mistral_ai", name: "Mistral AI", type: "Commercial", models: ["mistral-small", "mistral-large"], badge: "🇫🇷 European" },
  { id: "github", name: "GitHub Models", type: "Free Tier", models: ["gpt-4o-mini", "Meta-Llama-3.1-70B-Instruct"], badge: "🐙 GitHub Free" },
];

export default function AIModels() {
  const [defaultProvider, setDefaultProvider] = useState("openai");
  const [defaultModel, setDefaultModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(150);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Test prompt
  const [testPrompt, setTestPrompt] = useState("Hello! Introduce yourself in 15 words.");
  const [testSystem, setTestSystem] = useState("You are an enthusiastic crypto trader.");
  const [testOutput, setTestOutput] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await globalConfigApi.get();
      const gpt = res.data?.gpt || {};
      if (gpt.default_provider) setDefaultProvider(gpt.default_provider);
      if (gpt.model) setDefaultModel(gpt.model);
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await globalConfigApi.update({
        section: "gpt",
        key: "default_provider",
        value: defaultProvider,
      });
      await globalConfigApi.update({
        section: "gpt",
        key: "model",
        value: defaultModel,
      });
      setMsg("AI configuration saved successfully!");
      setTimeout(() => setMsg(""), 3500);
    } catch (err) {
      setMsg("Failed to save: " + detail(err));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestOutput("");
    try {
      const res = await neuroTextApi.generate({
        prompt: testPrompt,
        tone: "casual",
        persona_context: testSystem,
        spin_count: 1,
      });
      setTestOutput(res.data?.text || res.data?.variations?.[0] || "Response received successfully.");
    } catch (err) {
      setTestOutput("Generation failed: " + detail(err));
    } finally {
      setTesting(false);
    }
  };

  const currentProvider = AI_PROVIDERS.find(p => p.id === defaultProvider) || AI_PROVIDERS[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              AI Models & Multi-Provider Settings
              <span className="text-xs bg-primary/10 border border-primary/30 text-primary px-2.5 py-0.5 rounded-full">
                13 Providers
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure AI engines, models, API credentials, and failover cascading across all 13 providers.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          {saving ? "Saving..." : "Save AI Defaults"}
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-primary/10 border border-primary/30 text-primary text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Box (5 cols) */}
        <div className="lg:col-span-5 bg-card/80 border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" /> Active Default Engine
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">Provider</label>
            <select
              value={defaultProvider}
              onChange={e => {
                setDefaultProvider(e.target.value);
                const prov = AI_PROVIDERS.find(p => p.id === e.target.value);
                if (prov?.models[0]) setDefaultModel(prov.models[0]);
              }}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            >
              {AI_PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">Model</label>
            <select
              value={defaultModel}
              onChange={e => setDefaultModel(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-primary"
            >
              {currentProvider.models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4 pt-3 border-t border-border/60">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Temperature</span>
              <span className="text-primary font-mono">{temperature}</span>
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

            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Max Tokens</span>
              <span className="text-primary font-mono">{maxTokens}</span>
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
        </div>

        {/* Playground Box (7 cols) */}
        <div className="lg:col-span-7 bg-card/80 border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" /> Live Test Playground
          </h2>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase">Persona System Instruction</label>
            <input
              type="text"
              value={testSystem}
              onChange={e => setTestSystem(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase">Input Prompt</label>
            <input
              type="text"
              value={testPrompt}
              onChange={e => setTestPrompt(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              {testing ? "Testing..." : "Test Generation"}
            </button>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[11px] font-medium text-muted-foreground uppercase">Output Result</label>
            <div className="w-full min-h-[120px] bg-background/90 border border-border rounded-xl p-3 text-xs font-mono text-emerald-300">
              {testOutput || <span className="text-muted-foreground/40 italic">Click test to generate...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
