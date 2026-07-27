"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, QrCode, Smartphone, Shield, Loader2, Key } from "lucide-react";
import { LogPanel } from "@/components/modules/LogPanel";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";
import { ModuleFooter } from "@/components/modules/ModuleFooter";

export default function QrLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cloudPassword, setCloudPassword] = useState("");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [status, setStatus] = useState<"idle" | "waiting_scan" | "waiting_password" | "success" | "error">("idle");
  const [log, setLog] = useState<{ time: string; text: string; level: "error" | "info" | "success" | "warn" }[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function addLog(text: string, level: "error" | "info" | "success" | "warn" = "info") {
    setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]);
  }

  const requestQr = useCallback(async () => {
    if (!phoneNumber) return;
    setExecuting(true);
    setQrSvg(null);
    setStatus("waiting_scan");
    addLog("Requesting QR code...");

    try {
      const res = await fetch("/api/v1/registrar/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "QR request failed");
      const data = await res.json();
      setQrSvg(data.qr_svg || data.qr_code);
      addLog("QR code received, scan with Telegram", "success");
      startPolling();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get QR code";
      setStatus("error");
      addLog(msg, "error");
    } finally {
      setExecuting(false);
    }
  }, [phoneNumber]);

  const startPolling = useCallback(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/v1/registrar/qr/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: phoneNumber }),
        });
        const data = await res.json();
        if (data.status === "waiting_password") {
          setStatus("waiting_password");
          addLog("QR scanned, password required", "info");
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "logged_in") {
          setStatus("success");
          addLog("Login successful!", "success");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch { /* polling */ }
    }, 3000);
  }, [phoneNumber]);

  const submitPassword = useCallback(async () => {
    if (!cloudPassword) return;
    setExecuting(true);
    addLog("Submitting cloud password...");
    try {
      const res = await fetch("/api/v1/registrar/qr/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber, password: cloudPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Password submit failed");
      setStatus("success");
      addLog("Login successful!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Password submission failed";
      addLog(msg, "error");
    } finally {
      setExecuting(false);
    }
  }, [phoneNumber, cloudPassword]);

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <QrCode className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">QR Login</h1>
            <p className="text-xs text-muted-foreground">Scan QR code with Telegram mobile app</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {status === "idle" && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Phone Number</h3>
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Smartphone className="h-3 w-3" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                onClick={requestQr}
                disabled={executing || !phoneNumber}
                className="w-full bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5" />}
                {executing ? "Requesting..." : "Get QR Code"}
              </button>
            </div>
          </div>
        )}

        {qrSvg && (
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <h3 className="text-sm font-semibold text-foreground mb-3">Scan with Telegram</h3>
            <div className="inline-block p-4 bg-card rounded-xl" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p className="text-xs text-muted-foreground mt-3">Open Telegram → Settings → Devices → Scan QR</p>
          </div>
        )}

        {status === "waiting_password" && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Cloud Password Required</h3>
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Key className="h-3 w-3" /> Cloud Password
                </label>
                <input
                  type="password"
                  value={cloudPassword}
                  onChange={e => setCloudPassword(e.target.value)}
                  placeholder="Enter your Telegram cloud password"
                  className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                onClick={submitPassword}
                disabled={executing || !cloudPassword}
                className="w-full bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                {executing ? "Submitting..." : "Submit Password"}
              </button>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
            <Shield className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <h3 className="font-semibold text-sm text-green-700 dark:text-green-300">Login Successful</h3>
            <p className="text-xs text-muted-foreground mt-1">Account has been added</p>
            <button
              onClick={() => router.push("/dashboard/accounts")}
              className="mt-3 bg-success text-success-foreground text-xs font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              View Accounts
            </button>
          </div>
        )}

        <LogPanel entries={log} />
        <CrossLinkFooter links={[
          { label: "Manual Registration", href: "/dashboard/modules/manual-registration" },
          { label: "Universal Registrar", href: "/dashboard/modules/universal-registrar" },
        ]} />
        <ModuleFooter />
      </div>
    </div>
  );
}