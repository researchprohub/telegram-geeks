"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Copy, Check, Save, Trash2, Eye, Loader2, Info, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function NeuroTextPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"editor" | "generate">("editor");
  const [spintaxInput, setSpintaxInput] = useState("Hello {World|Universe|Earth|Everyone}! {I wanted to|Let me} share {something|an idea} with you.");
  const [previewCount, setPreviewCount] = useState(5);
  const [previewResult, setPreviewResult] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("casual");
  const [variants, setVariants] = useState<string[]>([]);
  const [generatedSpintax, setGeneratedSpintax] = useState("");
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { fetchTemplates(); }, []);

  async function fetchTemplates() {
    try { const r = await api.get("/neuro-text/spintax-templates"); setTemplates(r.data || []); } catch {}
  }

  async function handlePreview() {
    if (!spintaxInput.trim()) return;
    setLoading(true); setError("");
    try {
      const r = await api.post("/neuro-text/spintax/preview", { template: spintaxInput, count: previewCount });
      setPreviewResult(r.data.variants || []);
    } catch (e: any) { setError(e.response?.data?.detail || "Preview failed"); }
    finally { setLoading(false); }
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true); setError("");
    try {
      const r = await api.post("/neuro-text/spintax/generate", { prompt, tone, spin_count: 5 });
      setGeneratedSpintax(r.data.spintax || "");
      setVariants(r.data.variants || []);
    } catch (e: any) { setError(e.response?.data?.detail || "Generation failed"); }
    finally { setLoading(false); }
  }

  async function handleSaveTemplate() {
    if (!templateName.trim() || !spintaxInput.trim()) return;
    try {
      await api.post("/neuro-text/spintax-templates", { name: templateName, template_text: spintaxInput, tone });
      setTemplateName("");
      fetchTemplates();
    } catch (e: any) { setError(e.response?.data?.detail || "Save failed"); }
  }

  async function handleDeleteTemplate(id: number) {
    try { await api.delete(`/neuro-text/spintax-templates/${id}`); fetchTemplates(); }
    catch {}
  }

  function loadTemplate(t: any) {
    setSpintaxInput(t.template_text);
    setTone(t.tone);
  }

  function copyText(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Neuro-Text Engine</h1>
            <p className="text-xs text-muted-foreground">Spintax editor + GPT content generation</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Tab bar */}
        <div className="bg-card rounded-xl border border-border p-1 flex">
          <button onClick={() => setTab("editor")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === "editor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Eye className="h-4 w-4 inline mr-1.5" /> Spintax Editor
          </button>
          <button onClick={() => setTab("generate")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === "generate" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Sparkles className="h-4 w-4 inline mr-1.5" /> AI Generate
          </button>
        </div>

        {/* Templates strip */}
        {templates.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {templates.map((t: any) => (
              <div key={t.id} className="flex items-center gap-1 bg-secondary rounded-lg px-3 py-1.5 flex-shrink-0">
                <button onClick={() => loadTemplate(t)} className="text-xs font-medium text-foreground hover:text-primary whitespace-nowrap">{t.name}</button>
                <button onClick={() => handleDeleteTemplate(t.id)} className="text-muted-foreground hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}

        {tab === "editor" && (
          <>
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Spintax Template</h3>
              <p className="text-xs text-muted-foreground mb-3">Use <code className="bg-secondary px-1 rounded text-primary">{`{option1|option2|option3}`}</code> syntax for variations.</p>
              <textarea value={spintaxInput} onChange={e => setSpintaxInput(e.target.value)} rows={5}
                className="w-full bg-secondary border-0 rounded-lg p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground resize-y outline-none focus:ring-2 focus:ring-primary" />

              <div className="flex items-center gap-3 mt-3">
                <input type="number" value={previewCount} onChange={e => setPreviewCount(Number(e.target.value))} min={1} max={50}
                  className="w-20 bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-primary" />
                <button onClick={handlePreview} disabled={loading}
                  className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} Preview
                </button>
                <div className="flex-1" />
                <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Template name..."
                  className="bg-secondary border-0 rounded-lg px-3 py-2 text-sm w-40 outline-none focus:ring-2 focus:ring-primary" />
                <button onClick={handleSaveTemplate} disabled={!templateName.trim()}
                  className="bg-secondary text-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5">
                  <Save className="h-4 w-4" /> Save
                </button>
              </div>
            </div>

            {previewResult.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Preview Variants ({previewResult.length})</h3>
                <div className="space-y-2">
                  {previewResult.map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg group">
                      <span className="text-sm text-foreground">{v}</span>
                      <button onClick={() => copyText(v, i)} className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedIdx === i ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === "generate" && (
          <>
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">AI Content Generation</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Topic / Prompt</label>
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} placeholder="e.g., Write a welcome message for a crypto trading group..."
                    className="w-full bg-secondary border-0 rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-y outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">Tone</label>
                    <select value={tone} onChange={e => setTone(e.target.value)}
                      className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                      <option value="casual">Casual</option>
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="formal">Formal</option>
                      <option value="humorous">Humorous</option>
                      <option value="persuasive">Persuasive</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
                      className="bg-primary text-primary-foreground text-sm font-medium px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2 h-[38px]">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {generatedSpintax && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Generated Spintax</h3>
                <div className="bg-[#0A0A0F] text-green-400 text-xs font-mono p-3 rounded-lg mb-3 break-all">
                  {generatedSpintax}
                </div>
                <button onClick={() => { setSpintaxInput(generatedSpintax); setTab("editor"); }}
                  className="text-xs text-primary hover:underline">Open in Spintax Editor →</button>
              </div>
            )}

            {variants.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Generated Variants ({variants.length})</h3>
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg group">
                      <span className="text-sm text-foreground">{v}</span>
                      <button onClick={() => copyText(v, i)} className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedIdx === i ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">How it works</h4>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              <strong>Spintax Editor:</strong> Write spintax like <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{`{Hi|Hello}`}</code> to generate message variants. Save templates for reuse.<br />
              <strong>AI Generate:</strong> Describe what you want, choose a tone, and the AI creates spintax with multiple variants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
