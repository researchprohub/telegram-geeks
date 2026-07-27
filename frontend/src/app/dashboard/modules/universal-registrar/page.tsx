"use client";

import { useState, useEffect } from "react";
import { Bot, ArrowLeft, Play, Loader2, Upload, FileSpreadsheet, Smartphone, Key, TestTube, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function UniversalRegistrarPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "batch" | "sheet">("manual");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [proxyString, setProxyString] = useState("");
  const [firstName, setFirstName] = useState("TG");
  const [lastName, setLastName] = useState("User");
  const [batchData, setBatchData] = useState("");
  const [threadCount, setThreadCount] = useState(2);
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  async function handleExecute() {
    if (mode === "manual") {
      if (!phoneNumber || !apiId || !apiHash) { setError("Fill all required fields"); return; }
      setExecuting(true); setError("");
      try {
        addLog(`Registering ${phoneNumber}...`);
        const r = await api.post("/modules/registrar/execute", {
          operation: "register_account",
          params: { phone: phoneNumber, api_id: parseInt(apiId), api_hash: apiHash, proxy_string: proxyString || undefined, first_name: firstName, last_name: lastName },
        });
        addLog(r.data?.message || "Account registered", "success");
      } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
      finally { setExecuting(false); }
    } else {
      setExecuting(true); setError("");
      try {
        const entries = batchData.split("\n").map(s => s.trim()).filter(Boolean);
        addLog(`Batch registering ${entries.length} accounts...`);
        const r = await api.post("/modules/registrar/execute", {
          operation: "batch_register",
          params: { accounts: entries.map(e => { const p = e.split(","); return { phone: p[0], api_id: parseInt(p[1] || apiId), api_hash: p[2] || apiHash, proxy: p[3] || proxyString }; }), thread_count: threadCount },
        });
        const res = r.data?.result || r.data;
        addLog(`Registered ${res.registered || "?"} accounts`, "success");
        if (res.failed > 0) addLog(`${res.failed} failed`, "warn");
      } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
      finally { setExecuting(false); }
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Bot className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Universal Registrar</h1><p className="text-xs text-muted-foreground">Register accounts individually or in batch</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {[
              { id: "manual", label: "Manual", icon: Bot },
              { id: "batch", label: "Batch", icon: Upload },
              { id: "sheet", label: "Sheet", icon: FileSpreadsheet },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>

          {mode === "manual" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Phone Number</label>
                <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1234567890" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Proxy (optional)</label>
                <input type="text" value={proxyString} onChange={e => setProxyString(e.target.value)} placeholder="socks5://user:pass@ip:port" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">API ID</label>
                <input type="text" value={apiId} onChange={e => setApiId(e.target.value)} placeholder="12345" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">API Hash</label>
                <input type="text" value={apiHash} onChange={e => setApiHash(e.target.value)} placeholder="abcdef1234567890abcdef1234567890" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-mono" />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Accounts (phone,api_id,api_hash,proxy per line)</label>
              <textarea value={batchData} onChange={e => setBatchData(e.target.value)} rows={5}
                placeholder="+1234567890,12345,abcdef...,socks5://...&#10;+9876543210,12345,abcdef..."
                className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono" />
              {mode === "batch" && (
                <div className="mt-2">
                  <label className="block text-xs text-muted-foreground mb-1">Threads</label>
                  <input type="number" min={1} max={10} value={threadCount} onChange={e => setThreadCount(parseInt(e.target.value) || 2)}
                    className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
              )}
            </div>
          )}

          <button onClick={handleExecute} disabled={executing || (mode === "manual" && (!phoneNumber || !apiId || !apiHash)) || (mode !== "manual" && !batchData.trim())}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Registering..." : mode === "manual" ? "Register" : "Batch Register"}
          </button>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">SMS Service Integration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Provider</label>
              <select className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select provider...</option>
                <option value="sms-activate">sms-activate</option>
                <option value="5sim">5sim</option>
                <option value="grizzly">grizzly</option>
                <option value="others">Others</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">API Key</label>
              <input type="password" placeholder="Enter API key"
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Country</label>
              <select className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select country...</option>
                <option value="usa">USA</option>
                <option value="russia">Russia</option>
                <option value="ukraine">Ukraine</option>
                <option value="kazakhstan">Kazakhstan</option>
                <option value="germany">Germany</option>
                <option value="uk">United Kingdom</option>
                <option value="indonesia">Indonesia</option>
                <option value="philippines">Philippines</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Operator</label>
              <select className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select operator...</option>
                <option value="any">Any</option>
                <option value="virtual">Virtual</option>
                <option value="mts">MTS</option>
                <option value="beeline">Beeline</option>
                <option value="megafon">Megafon</option>
                <option value="tele2">Tele2</option>
              </select>
            </div>
            <div className="bg-secondary/30 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className="text-sm font-semibold text-foreground">—</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-1.5">
              <TestTube className="h-3.5 w-3.5" /> Test Connection
            </button>
          </div>
        </div>

        <LogPanel entries={log} />
        <CrossLinkFooter links={[{ label: "Manual Registration", href: "/modules/manual-registration" }, { label: "Session Duplicator", href: "/modules/session-duplicator" }]} />
        <ModuleFooter />
      </div>
    </div>
  );
}
