"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowLeft, Play, Loader2, Phone, Key, Globe, User } from "lucide-react";
import api from "@/lib/api";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";

export default function ManualRegistrationPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [proxyString, setProxyString] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [flashCallRequested, setFlashCallRequested] = useState(false);

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  async function handleSendCode() {
    if (!phoneNumber || !apiId || !apiHash) { setError("Fill phone, API ID, and API Hash"); return; }
    setExecuting(true); setError("");
    try {
      addLog(`Sending code to ${phoneNumber}...`);
      const r = await api.post("/modules/registrar/execute", {
        operation: "send_code",
        params: { phone: phoneNumber, api_id: parseInt(apiId), api_hash: apiHash, proxy_string: proxyString || undefined },
      });
      addLog("Code sent! Check your Telegram", "success");
      setCodeSent(true);
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  async function handleVerify() {
    if (!verificationCode) { setError("Enter verification code"); return; }
    setExecuting(true); setError("");
    try {
      addLog("Verifying code...");
      const r = await api.post("/modules/registrar/execute", {
        operation: "verify_code",
        params: { phone: phoneNumber, code: verificationCode, first_name: firstName || undefined, last_name: lastName || undefined },
      });
      addLog(r.data?.message || "Account registered!", "success");
      setCodeSent(false);
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  async function handleFlashCall() {
    if (!phoneNumber) { setError("Enter phone number"); return; }
    setExecuting(true); setError("");
    try {
      addLog(`Requesting flash call for ${phoneNumber}...`);
      const r = await api.post("/api/v1/registrar/flashcall", {
        phone: phoneNumber,
        proxy_string: proxyString || undefined,
      });
      addLog(r.data?.message || "Flash call requested", "success");
      setFlashCallRequested(true);
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  const reset = () => {
    setCodeSent(false);
    setFlashCallRequested(false);
    setVerificationCode("");
    setPhoneNumber("");
    setApiId("");
    setApiHash("");
    setProxyString("");
    setFirstName("");
    setLastName("");
    setError("");
    setLog([]);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><UserPlus className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Manual Registration</h1><p className="text-xs text-muted-foreground">Register Telegram accounts manually</p></div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}

        {!codeSent && !flashCallRequested && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Phone className="h-3 w-3" /> Phone Number</label>
                <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1234567890" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Globe className="h-3 w-3" /> Proxy (optional)</label>
                <input type="text" value={proxyString} onChange={e => setProxyString(e.target.value)} placeholder="socks5://user:pass@ip:port" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Key className="h-3 w-3" /> API ID</label>
                <input type="text" value={apiId} onChange={e => setApiId(e.target.value)} placeholder="12345" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Key className="h-3 w-3" /> API Hash</label>
                <input type="text" value={apiHash} onChange={e => setApiHash(e.target.value)} placeholder="abcdef1234567890abcdef1234567890" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-mono" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><User className="h-3 w-3" /> First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><User className="h-3 w-3" /> Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <button onClick={handleSendCode} disabled={executing || !phoneNumber || !apiId || !apiHash} className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} {executing ? "Sending..." : "Send Code"}
            </button>
            <button onClick={handleFlashCall} disabled={executing || !phoneNumber} className="mt-2 w-full bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} {executing ? "Requesting..." : "Request Flash Call"}
            </button>
          </div>
        )}

        {flashCallRequested && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Flash Call Requested</h3>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">Flash call requested for {phoneNumber}</p>
              <p className="text-xs text-muted-foreground">Check Telegram for the call and enter the incoming number</p>
            </div>
            <button onClick={() => setFlashCallRequested(false)} className="mt-3 w-full bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Back to Manual Registration
            </button>
          </div>
        )}

        {codeSent && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Verify Code</h3>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Verification Code</label>
              <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="12345" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
            <button onClick={handleVerify} disabled={executing || !verificationCode} className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} {executing ? "Verifying..." : "Verify Code"}
            </button>
          </div>
        )}

        <LogPanel entries={log} />
        <CrossLinkFooter links={[{ label: "Universal Registrar", href: "/dashboard/modules/universal-registrar" }]} />
        <ModuleFooter />
      </div>
    </div>
  );
}