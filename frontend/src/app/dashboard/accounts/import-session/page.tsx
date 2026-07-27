"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, Key, Shield, Globe } from "lucide-react";
import api from "@/lib/api";
import { ThreadProxyPanel } from "@/components/modules/ThreadProxyPanel";
import { FloodControlPanel } from "@/components/modules/FloodControlPanel";
import { LogPanel } from "@/components/modules/LogPanel";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";
import { ModuleFooter } from "@/components/modules/ModuleFooter";

export default function ImportSessionPage() {
  const router = useRouter();
  const [sessionString, setSessionString] = useState("");
  const [proxyString, setProxyString] = useState("");
  const [threadCount, setThreadCount] = useState(2);
  const [minDelay, setMinDelay] = useState(2);
  const [maxDelay, setMaxDelay] = useState(5);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string, account?: any} | null>(null);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  function addLog(text: string, level = "info") {
    setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  const execute = useCallback(async () => {
    if (!sessionString) {
      setError("Enter session string");
      return;
    }
    setExecuting(true);
    setError(null);
    setResult(null);
    addLog("Importing account from session string...");

    try {
      const response = await fetch('/api/v1/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: sessionString,
          session_string: sessionString,
          proxy_config: proxyString || null,
          thread_count: threadCount,
          min_delay: minDelay,
          max_delay: maxDelay,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Import failed');
      }

      const data = await response.json();
      addLog('Account imported successfully', 'success');
      setResult({ success: true, message: 'Account imported successfully', account: data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      setError(message);
      addLog(message, 'error');
      setResult({ success: false, message });
    } finally {
      setExecuting(false);
    }
  }, [sessionString, proxyString, threadCount, minDelay, maxDelay]);

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/accounts')}
            className="p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Import Session</h1>
            <p className="text-xs text-muted-foreground">Paste session string to import account</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Session String Import</h3>
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Key className="h-3 w-3" /> Session String
              </label>
              <textarea
                value={sessionString}
                onChange={(e) => setSessionString(e.target.value)}
                placeholder="paste your session_string here...\nExample: AQHBB..."
                className="w-full bg-secondary border-0 rounded-lg p-3 text-xs text-foreground resize-y outline-none focus:ring-2 focus:ring-primary font-mono"
                rows={4}
                disabled={executing}
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Globe className="h-3 w-3" /> Proxy (optional)
              </label>
              <input
                type="text"
                value={proxyString}
                onChange={(e) => setProxyString(e.target.value)}
                placeholder="socks5://user:pass@ip:port"
                disabled={executing}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <ThreadProxyPanel
            threadCount={threadCount}
            onThreadChange={setThreadCount}
            proxyMode={proxyString}
            onProxyChange={setProxyString}
          />

          <FloodControlPanel
            minDelay={minDelay}
            maxDelay={maxDelay}
            onMinDelayChange={setMinDelay}
            onMaxDelayChange={setMaxDelay}
          />

          <button
            onClick={execute}
            disabled={executing || !sessionString}
            className="mt-3 w-full bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            {executing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Download className="h-3.5 w-3.5 mr-1" />
            )}
            {executing ? "Importing..." : "Import Session"}
          </button>
        </div>

        {result && (
          <div className={`rounded-xl border p-4 ${
            result.success
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}>
            <div className="flex items-center gap-3">
              {result.success ? (
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              <div>
                <h4 className="font-semibold text-sm">
                  {result.success ? "Import Successful" : "Import Failed"}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {result.message}
                </p>
              </div>
            </div>

            {result.success && (
              <div className="mt-3">
                <button
                  onClick={() => router.push('/dashboard/accounts')}
                  className="w-full bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  View Imported Account
                </button>
              </div>
            )}
          </div>
        )}

        <LogPanel entries={log} />

        <CrossLinkFooter
          links={[{ label: "Universal Registrar", href: "/dashboard/modules/universal-registrar" }]}
        />
        <ModuleFooter />
      </div>
    </div>
  );
}