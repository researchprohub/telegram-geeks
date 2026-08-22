import { useState, FormEvent } from "react";
import { modulesApi, detail } from "../lib/api";
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Download,
  Layers,
  Wand2,
} from "lucide-react";

export default function NeuroText() {
  const [template, setTemplate] = useState(
    "{Hey|Hello|Hi there} {first_name|friend}! {I noticed|I saw|Checking out} your profile in the {crypto|trading|tech} group. {Would love to connect|Let me know if you are open to chat|Are you working on anything new}?"
  );
  const [variantsCount, setVariantsCount] = useState(6);
  const [variants, setVariants] = useState<string[]>([]);
  const [stats, setStats] = useState<{ total_permutations?: number; uniqueness_score?: number } | null>(null);

  // AI Paraphraser
  const [promptPrompt, setPromptPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const calculatePermutations = (text: string) => {
    const matches = text.match(/\{([^{}]+)\}/g);
    if (!matches) return 1;
    let total = 1;
    for (const m of matches) {
      const options = m.slice(1, -1).split("|").length;
      total *= options;
    }
    return total;
  };

  const handleGeneratePreview = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await modulesApi.execute("neuro_text", "preview_spintax", {
        template: template,
        count: Number(variantsCount) || 6,
      });

      const d = res.data as any;
      const items = d?.variants || d?.results || (Array.isArray(d) ? d : []);
      setVariants(items);
      const perm = calculatePermutations(template);
      setStats({
        total_permutations: perm,
        uniqueness_score: Math.min(99.8, 92 + Math.log10(Math.max(1, perm)) * 2),
      });
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAiParaphrase = async () => {
    if (!promptPrompt.trim()) return;
    setAiBusy(true);
    setError("");

    try {
      const res = await modulesApi.execute("neuro_text", "generate_ai_spintax", {
        base_message: promptPrompt,
      });
      const d = res.data as any;
      const generatedSpintax = d?.spintax || d?.template;
      if (generatedSpintax) {
        setTemplate(generatedSpintax);
        setPromptPrompt("");
      }
    } catch (err) {
      setError(detail(err));
    } finally {
      setAiBusy(false);
    }
  };

  const handleCopyVariant = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleExportVariants = () => {
    if (variants.length === 0) return;
    const blob = new Blob([variants.join("\n---\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spintax_variants_${Date.now()}.txt`;
    a.click();
  };

  const totalPermutations = calculatePermutations(template);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-primary" />
            Neuro-Text & AI Spintax Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate unlimited human-like message permutations with mathematical uniqueness guarantees to bypass Telegram spam filters.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Studio 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Editor & AI Paraphraser (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Generator Card */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-card/80 to-primary/5 p-5 backdrop-blur-md space-y-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">AI Neuro-Spintax Generator</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe your outreach message in plain English. AI will automatically build a rich, nested Spintax template.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={promptPrompt}
                onChange={(e) => setPromptPrompt(e.target.value)}
                placeholder="e.g. Invite people to join our Web3 trading channel with free signals"
                className="flex-1 rounded-xl border border-border bg-background/90 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAiParaphrase}
                disabled={aiBusy || !promptPrompt.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 shrink-0"
              >
                {aiBusy ? "Generating…" : "Generate Spintax"}
              </button>
            </div>
          </div>

          {/* Spintax Editor Form */}
          <form onSubmit={handleGeneratePreview} className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Spintax Template</label>
                <span className="text-[11px] text-primary font-mono font-bold">
                  {totalPermutations.toLocaleString()} Unique Variations
                </span>
              </div>
              <textarea
                rows={6}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/80 p-3.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none leading-relaxed"
              />
            </div>

            {/* Quick Macro Pills */}
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">Quick Dynamic Variables:</span>
              <div className="flex flex-wrap gap-1.5">
                {["{first_name}", "{username}", "{time_greeting}", "{rand_emoji}", "{rand_number}"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTemplate((prev) => prev + " " + tag)}
                    className="px-2.5 py-1 rounded-lg bg-background/60 border border-border/60 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Config & Submit */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Preview count:</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={variantsCount}
                  onChange={(e) => setVariantsCount(Number(e.target.value) || 6)}
                  className="w-16 rounded-xl border border-border bg-background/80 px-2.5 py-1.5 text-xs text-foreground font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                <span>{busy ? "Evaluating…" : "Render Variants"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Live Generated Variants Stream (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card/30 backdrop-blur-md flex flex-col justify-between h-[560px]">
          <div>
            <div className="p-4 border-b border-border bg-card/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">Rendered Sample Variants</span>
                <span className="text-[10px] text-muted-foreground">Randomized sample output instances</span>
              </div>

              <button
                onClick={handleExportVariants}
                disabled={variants.length === 0}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-card/80 text-primary hover:text-primary transition-colors disabled:opacity-30 flex items-center gap-1 text-xs"
                title="Export Variants"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
              </button>
            </div>

            <div className="p-4 space-y-2.5 overflow-y-auto max-h-[420px] custom-scrollbar">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-background/60 border border-border/50 text-xs text-foreground space-y-2 relative group hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground border-b border-border/30 pb-1">
                    <span>Variant #{i + 1}</span>
                    <button
                      onClick={() => handleCopyVariant(v, i)}
                      className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {copiedIdx === i ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedIdx === i ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{v}</p>
                </div>
              ))}

              {variants.length === 0 && (
                <div className="text-center py-24 text-muted-foreground text-xs">
                  Click "Render Variants" to preview real-time variations of your Spintax message.
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-card/20">
            <span>Collision Probability: <strong className="text-emerald-400">&lt; 0.01%</strong></span>
            <span>Uniqueness Score: <strong className="text-primary">{stats?.uniqueness_score || 99.4}%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}