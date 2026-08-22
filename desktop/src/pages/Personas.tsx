import { useState, useEffect, FormEvent } from "react";
import { personasApi, detail } from "../lib/api";
import {
  Bot,
  Sparkles,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Sliders,
  Send,
  UserCheck,
  Zap,
  BookOpen,
  Smile,
  Copy,
} from "lucide-react";

interface PersonaItem {
  id: number;
  name: string;
  role?: string;
  system_prompt?: string;
  tone?: string;
  temperature?: number;
  memory_window?: number;
  knowledge_base?: string;
  created_at?: string;
}

interface ChatMessage {
  sender: "user" | "persona";
  text: string;
  time: string;
}

export default function Personas() {
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<PersonaItem | null>(null);

  // Form State for editing / creating
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("crypto_closer");
  const [systemPrompt, setSystemPrompt] = useState("You are an experienced Web3 trader and community builder. Speak casually, use short sentences, and build genuine trust with the lead before suggesting project links.");
  const [tone, setTone] = useState("friendly_peer");
  const [temperature, setTemperature] = useState(0.7);
  const [memoryWindow, setMemoryWindow] = useState(10);
  const [knowledgeBase, setKnowledgeBase] = useState("");

  // Sandbox State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: "persona", text: "Hey! What kind of projects have you been looking into lately?", time: "Just now" },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const TEMPLATES = [
    {
      id: "crypto_closer",
      name: "Web3 Deal Closer",
      tone: "friendly_peer",
      prompt: "You are an experienced crypto trader and community investor. Build rapport, discuss market sentiment, and naturally introduce the platform when relevant.",
    },
    {
      id: "saas_sales",
      name: "B2B SaaS Consultant",
      tone: "professional",
      prompt: "You are a professional growth consultant. Ask questions about the lead's current marketing bottleneck and offer tailored automation solutions.",
    },
    {
      id: "support_rep",
      name: "24/7 Customer Support",
      tone: "helpful_empathic",
      prompt: "You are a helpful customer support agent. Answer inquiries quickly, patiently resolve issues, and provide step-by-step guidance.",
    },
    {
      id: "mod_hypeman",
      name: "Community Mod & Hype",
      tone: "enthusiastic",
      prompt: "You are an energetic Telegram group moderator. Welcome newcomers, answer questions with enthusiasm, and keep chat activity vibrant.",
    },
  ];

  const loadData = async () => {
    try {
      const res = await personasApi.list(1);
      const d = res.data as any;
      const raw = d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
      const list = Array.isArray(raw) ? raw : [];
      setPersonas(list);
      if (list.length > 0 && !selectedPersona) {
        setSelectedPersona(list[0]);
        fillForm(list[0]);
      }
    } catch (err) {
      setError(detail(err));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fillForm = (p: PersonaItem) => {
    setName(p.name || "");
    setRole(p.role || "crypto_closer");
    setSystemPrompt(p.system_prompt || "");
    setTone(p.tone || "friendly_peer");
    setTemperature(p.temperature ?? 0.7);
    setMemoryWindow(p.memory_window ?? 10);
    setKnowledgeBase(p.knowledge_base || "");
  };

  const handleSelectPersona = (p: PersonaItem) => {
    setSelectedPersona(p);
    fillForm(p);
    setIsEditing(false);
    setChatMessages([
      { sender: "persona", text: `Hello! I'm ${p.name}. How can I help you today?`, time: "Just now" },
    ]);
  };

  const handleApplyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setName(tmpl.name);
    setTone(tmpl.tone);
    setSystemPrompt(tmpl.prompt);
  };

  const handleSavePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a persona name.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccessMsg("");

    try {
      if (isEditing && selectedPersona) {
        await personasApi.update(selectedPersona.id, {
          name: name.trim(),
          role,
          system_prompt: systemPrompt,
          tone,
          temperature,
          memory_window: memoryWindow,
          knowledge_base: knowledgeBase,
        });
        setSuccessMsg(`Persona "${name}" updated successfully!`);
      } else {
        await personasApi.create({
          name: name.trim(),
          role,
          system_prompt: systemPrompt,
          tone,
          temperature,
          memory_window: memoryWindow,
          knowledge_base: knowledgeBase,
        });
        setSuccessMsg(`Persona "${name}" created!`);
      }
      setIsEditing(false);
      await loadData();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePersona = async (id: number) => {
    if (!confirm("Are you sure you want to delete this persona?")) return;
    setError("");
    try {
      await personasApi.delete(id);
      setSelectedPersona(null);
      await loadData();
    } catch (err) {
      setError(detail(err));
    }
  };

  const handleSendMessageToSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isTyping) return;

    const userText = inputMsg.trim();
    setInputMsg("");
    setChatMessages((prev) => [
      ...prev,
      { sender: "user", text: userText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setIsTyping(true);

    try {
      const personaId = selectedPersona ? selectedPersona.id : 1;
      const res = await personasApi.chat(personaId, userText);
      const reply = res.data?.reply || res.data?.message || "Thanks for your message! Let's continue exploring this.";

      setChatMessages((prev) => [
        ...prev,
        { sender: "persona", text: reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "persona",
          text: `[Simulated response based on prompt: "${systemPrompt.slice(0, 60)}..."]`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Bot className="h-6 w-6 text-primary" />
            AI Persona & Character Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Craft intelligent, autonomous AI personas with distinct personalities, dynamic memory, and custom knowledge.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedPersona(null);
            setIsEditing(false);
            setName("");
            setSystemPrompt("You are an autonomous AI assistant.");
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black font-semibold text-xs shadow-[0_0_20px_rgba(45,212,191,0.25)] hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>New AI Persona</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Studio 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col 1: Personas List (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Your Personas</span>
              <span className="text-[11px] text-muted-foreground">{personas.length} Active</span>
            </div>

            <div className="space-y-1.5 max-h-[480px] overflow-y-auto custom-scrollbar">
              {personas.map((p) => {
                const isSelected = selectedPersona?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPersona(p)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border/60 bg-background/50 hover:bg-background"
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-xs text-foreground truncate">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{p.tone?.replace("_", " ") || "Friendly"}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePersona(p.id);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              {personas.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No personas configured. Click "New AI Persona" or pick a template.
                </div>
              )}
            </div>
          </div>

          {/* Quick Templates */}
          <div className="rounded-2xl border border-border bg-card/30 p-4 space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Pre-built Templates</span>
            <div className="space-y-1">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleApplyTemplate(t)}
                  className="w-full text-left p-2 rounded-lg bg-background/40 hover:bg-card border border-border/40 text-[11px] text-foreground transition-colors flex items-center justify-between"
                >
                  <span className="font-medium">{t.name}</span>
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Col 2: Persona Editor Form (5 cols) */}
        <form onSubmit={handleSavePersona} className="lg:col-span-5 rounded-2xl border border-border bg-card/40 backdrop-blur-md p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Persona Configuration</h3>
              <p className="text-[11px] text-muted-foreground">Define behavioral directives and conversational rules.</p>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save Persona"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Persona Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Crypto Advisor"
                required
                className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tone of Voice</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/80 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="friendly_peer">Friendly Peer / Casual</option>
                  <option value="professional">Professional Consultant</option>
                  <option value="enthusiastic">Enthusiastic Hype Mod</option>
                  <option value="helpful_empathic">Helpful & Patient Support</option>
                  <option value="direct_concise">Direct & Concise</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Memory Window</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={memoryWindow}
                  onChange={(e) => setMemoryWindow(Number(e.target.value) || 10)}
                  className="w-full rounded-xl border border-border bg-background/80 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">System Prompt / Character Identity</label>
              <textarea
                rows={5}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Instructions on how this persona acts, what it speaks about, and what goals it should achieve in dialogue."
                className="w-full rounded-xl border border-border bg-background/80 p-3 text-xs text-foreground focus:border-primary focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Knowledge Base / FAQ (Optional)</label>
              <textarea
                rows={3}
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                placeholder="Paste key product facts, URLs, pricing info, or answers to frequent questions."
                className="w-full rounded-xl border border-border bg-background/80 p-3 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Col 3: Live Sandbox Chat (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-border bg-card/30 backdrop-blur-md flex flex-col justify-between h-[560px] overflow-hidden">
          <div className="p-4 border-b border-border bg-card/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-foreground">Interactive Test Sandbox</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Testing Persona Engine</span>
          </div>

          {/* Messages Container */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-primary text-black font-medium rounded-br-none shadow-sm"
                      : "bg-card border border-border text-foreground rounded-bl-none shadow-sm"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-muted-foreground mt-0.5 px-1">{m.time}</span>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs p-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessageToSandbox} className="p-3 border-t border-border bg-card/40 flex items-center gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Test a conversation message…"
              className="flex-1 rounded-xl border border-border bg-background/80 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={isTyping || !inputMsg.trim()}
              className="p-2 rounded-xl bg-primary text-black disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}