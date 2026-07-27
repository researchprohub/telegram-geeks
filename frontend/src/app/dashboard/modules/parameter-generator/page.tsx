"use client";

import { useState } from "react";
import { Sliders, ArrowLeft, Play, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";

export default function ParameterGeneratorPage() {
  const router = useRouter();
  const [sessionString, setSessionString] = useState("");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  async function handleExecute() {
    if (!sessionString || !apiId || !apiHash || !phoneNumber) { setError("Fill all required fields"); return; }
    setExecuting(true); setError(""); setResult(null);
    try {
      addLog("Generating JSON parameters...");
      const r = await api.post("/modules/json_generator/execute", {
        operation: "generate_json",
        params: { session_string: sessionString, api_id: parseInt(apiId), api_hash: apiHash, phone_number: phoneNumber, display_name: displayName || undefined },
      });
      const res = r.data?.result || r.data;
      setResult(res);
      addLog("Parameters generated", "success");
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Sliders className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Parameter Generator</h1><p className="text-xs text-muted-foreground">Generate JSON parameters from session data</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Session String</label>
              <textarea value={sessionString} onChange={e => setSessionString(e.target.value)} rows={2} className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">API ID</label>
              <input type="text" value={apiId} onChange={e => setApiId(e.target.value)} placeholder="12345" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">API Hash</label>
              <input type="text" value={apiHash} onChange={e => setApiHash(e.target.value)} placeholder="abcdef..." className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Phone Number</label>
              <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1234567890" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Display Name (optional)</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="My Account" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <button onClick={handleExecute} disabled={executing || !sessionString || !apiId || !apiHash || !phoneNumber}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} {executing ? "Generating..." : "Generate"}
          </button>
        </div>
        {result && (
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Generated Parameters</h3>
              <button onClick={() => handleCopy(JSON.stringify(result, null, 2))} className="flex items-center gap-1 text-xs text-primary hover:underline">
                {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="bg-black/10 dark:bg-white/5 rounded-lg p-3 text-xs font-mono text-foreground overflow-x-auto max-h-60 overflow-y-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        <LogPanel entries={log} />
        <ModuleFooter />
      </div>
    </div>
  );
}
