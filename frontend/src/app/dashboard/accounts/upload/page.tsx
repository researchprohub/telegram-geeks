"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, FileArchive, CheckCircle2, AlertCircle, Loader2, Info, ArrowLeft, QrCode, Phone, Files, Bot, Settings, ExternalLink, RefreshCw, Key, ShieldCheck, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { ModuleHeader } from "@/components/modules/ModuleHeader";
import { cn } from "@/lib/utils";

export default function TDataUploadPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"qr" | "phone" | "tdata">("qr");

  // shared API credentials (loaded from Settings or localStorage)
  const [apiId, setApiId] = useState("2040");
  const [apiHash, setApiHash] = useState("b18441a1ff607e10a989891a5462e627");
  const [customCredsActive, setCustomCredsActive] = useState(false);

  useEffect(() => {
    // 1. Try local storage
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("telegram_api_id");
      const storedHash = localStorage.getItem("telegram_api_hash");
      if (storedId) { setApiId(storedId); setCustomCredsActive(true); }
      if (storedHash) { setApiHash(storedHash); setCustomCredsActive(true); }
    }

    // 2. Fetch from backend global config
    api.get("/global-config").then(res => {
      const tg = res.data?.telegram;
      if (tg?.api_id) { setApiId(String(tg.api_id)); setCustomCredsActive(true); }
      if (tg?.api_hash) { setApiHash(String(tg.api_hash)); setCustomCredsActive(true); }
    }).catch(() => {});
  }, []);

  // TData state
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<null | { uploaded: number; failed: number; errors: string[] }>(null);
  const [dragActive, setDragActive] = useState(false);
  const [customFirstName, setCustomFirstName] = useState("");
  const [customUsername, setCustomUsername] = useState("");

  // QR state
  const [qrBusy, setQrBusy] = useState(false);
  const [qrDataUri, setQrDataUri] = useState("");
  const [qrLoginId, setQrLoginId] = useState("");
  const [qrStatus, setQrStatus] = useState<"idle" | "pending" | "awaiting_password" | "authorized" | "error">("idle");
  const [qrPassword, setQrPassword] = useState("");
  const [qrMsg, setQrMsg] = useState("");

  // Phone state
  const [phone, setPhone] = useState("");
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneLoginId, setPhoneLoginId] = useState("");
  const [phoneStep, setPhoneStep] = useState<"idle" | "code_sent" | "awaiting_password" | "authorized" | "error">("idle");
  const [phoneCode, setPhoneCode] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");
  const [loginAccount, setLoginAccount] = useState<null | { account_id: number; phone: string }>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.zip') || f.name.endsWith('.session') || f.name.endsWith('.json'));
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.name.endsWith('.zip') || f.name.endsWith('.session') || f.name.endsWith('.json'));
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!apiId || !apiHash || files.length === 0) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("api_id", apiId);
    formData.append("api_hash", apiHash);
    if (customFirstName) formData.append("custom_first_name", customFirstName);
    if (customUsername) formData.append("custom_username", customUsername);
    files.forEach(file => formData.append("files", file));

    try {
      const response = await api.post("/accounts/upload/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;
      
      const parsedErrors = data.details
        ?.filter((d: any) => d.error || (d.errors && d.errors.length > 0))
        ?.flatMap((d: any) => d.error ? [d.error] : d.errors) || [];

      setResult({
        uploaded: data.total_accounts || 0,
        failed: data.failed || 0,
        errors: parsedErrors,
      });
    } catch (error: any) {
      setResult({
        uploaded: 0,
        failed: files.length,
        errors: [error.response?.data?.detail || (error instanceof Error ? error.message : "Upload failed")],
      });
    } finally {
      setUploading(false);
    }
  };

  const startQr = async () => {
    if (!apiId || !apiHash) return;
    setQrBusy(true); setQrMsg(""); setQrDataUri(""); setQrStatus("idle"); setLoginAccount(null);
    try {
      const res = await api.post("/accounts/login/qr/start", {
        api_id: Number(apiId),
        api_hash: apiHash,
      });
      const data = res.data;
      setQrLoginId(data.login_id);
      setQrDataUri(data.qr_data_uri);
      setQrStatus("pending");
      pollQr(data.login_id);
    } catch (e: any) {
      setQrStatus("error");
      setQrMsg(e.response?.data?.detail || (e instanceof Error ? e.message : "Failed to start QR login"));
    } finally {
      setQrBusy(false);
    }
  };

  const pollQr = async (loginId: string) => {
    try {
      const res = await api.get(`/accounts/login/qr/status/${loginId}`);
      const data = res.data;
      if (data.status === "awaiting_password") { setQrStatus("awaiting_password"); return; }
      if (data.status === "authorized") {
        setQrStatus("authorized");
        setLoginAccount({
          account_id: data.account_id,
          phone: data.phone,
          first_name: data.first_name,
          username: data.username,
        } as any);
        return;
      }
      setQrStatus("pending");
      setTimeout(() => pollQr(loginId), 1500);
    } catch (e: any) {
      setQrStatus("error");
      setQrMsg(e.response?.data?.detail || "QR login session expired");
    }
  };

  const submitQrPassword = async () => {
    try {
      const res = await api.post(`/accounts/login/qr/password/${qrLoginId}`, {
        password: qrPassword,
      });
      const data = res.data;
      setQrStatus("authorized");
      setLoginAccount({ account_id: data.account_id, phone: data.phone });
    } catch (e: any) {
      setQrStatus("awaiting_password");
      setQrMsg(e.response?.data?.detail || "Invalid 2FA password");
    }
  };

  const sendPhoneCode = async () => {
    if (!apiId || !apiHash || !phone) return;
    setPhoneBusy(true); setPhoneMsg(""); setPhoneStep("idle"); setLoginAccount(null);
    try {
      const res = await api.post("/accounts/login/phone/send-code", {
        api_id: Number(apiId),
        api_hash: apiHash,
        phone,
      });
      const data = res.data;
      setPhoneLoginId(data.login_id);
      setPhoneStep("code_sent");
      setPhoneMsg(`Login code dispatched to ${phone}`);
    } catch (e: any) {
      setPhoneStep("error");
      setPhoneMsg(e.response?.data?.detail || (e instanceof Error ? e.message : "Failed to send code"));
    } finally {
      setPhoneBusy(false);
    }
  };

  const verifyPhoneCode = async () => {
    try {
      const res = await api.post(`/accounts/login/phone/verify/${phoneLoginId}`, {
        code: phoneCode,
        password: phonePassword || undefined,
      });
      const data = res.data;
      if (data.status === "awaiting_password") { setPhoneStep("awaiting_password"); return; }
      setPhoneStep("authorized");
      setLoginAccount({ account_id: data.account_id, phone: data.phone });
    } catch (e: any) {
      setPhoneStep("error");
      setPhoneMsg(e.response?.data?.detail || (e instanceof Error ? e.message : "Verification failed"));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ModuleHeader
        title="Import & Authorize Accounts"
        description="Connect Telegram accounts via Instant QR Code scan, Phone OTP SMS, or bulk TData Portable ZIP archives"
        icon={<Upload className="h-6 w-6" />}
        category="Account Operations"
        planRequired="starter"
        status="ready"
      />

      {/* Method Tabs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: "qr", label: "QR Code Scan", icon: QrCode, desc: "Instant mobile link via Telegram app camera" },
          { id: "phone", label: "Phone SMS OTP", icon: Phone, desc: "Interactive phone number verification" },
          { id: "tdata", label: "TData Portable ZIP", icon: FileArchive, desc: "Bulk upload Telegram Desktop folders" },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setTab(m.id as any)}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all",
              tab === m.id
                ? "bg-primary/10 border-primary shadow-xs"
                : "bg-secondary/40 border-border hover:bg-secondary"
            )}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <m.icon className={cn("h-4 w-4", tab === m.id ? "text-primary" : "text-muted-foreground")} />
              <span className={tab === m.id ? "text-primary" : "text-foreground"}>{m.label}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{m.desc}</p>
          </button>
        ))}
      </div>

      {/* API Credentials Bar */}
      <div className="bg-card rounded-2xl border border-border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Key className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Telegram MTProto Credentials</span>
              <span className="px-2 py-0.5 rounded-md bg-secondary text-primary font-mono text-[10px] font-bold border border-border">
                {customCredsActive ? "Custom Configured" : "Default App Config"}
              </span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              App ID: <span className="text-foreground font-bold">{apiId}</span> · Hash: <span className="text-foreground font-bold">{apiHash.slice(0, 6)}••••••••</span>
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
        >
          <Settings className="h-3.5 w-3.5" />
          Configure in Settings
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Tab 1: QR Code */}
      {tab === "qr" && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5 max-w-2xl mx-auto">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-foreground">Sign In via Instant QR Code</h3>
            <p className="text-xs text-muted-foreground">
              Scan with your Telegram app (<span className="text-primary font-medium">Settings → Devices → Link Desktop Device</span>)
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-secondary/30 rounded-2xl border border-border/80 min-h-[260px]">
            {qrBusy ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Requesting QR from Telegram MTProto...</p>
              </div>
            ) : qrStatus === "pending" && qrDataUri ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 bg-white rounded-2xl shadow-lg border border-border">
                  <img src={qrDataUri} alt="Telegram QR Code" className="w-52 h-52 object-contain" />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Awaiting scan from mobile device...
                </div>
              </div>
            ) : qrStatus === "awaiting_password" ? (
              <div className="w-full max-w-sm space-y-4 text-center">
                <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary">
                  <Key className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Cloud 2FA Password Required</h4>
                <input
                  type="password"
                  value={qrPassword}
                  onChange={(e) => setQrPassword(e.target.value)}
                  placeholder="Enter 2FA password"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={submitQrPassword}
                  className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-xs hover:opacity-90 transition-opacity"
                >
                  Submit 2FA Password
                </button>
              </div>
            ) : qrStatus === "authorized" ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-success/15 border border-success/30 flex items-center justify-center text-success">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Account Successfully Connected!</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Phone: <span className="font-mono text-primary font-bold">{loginAccount?.phone || "Authorized"}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/accounts")}
                  className="mt-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                >
                  View in Accounts Hub
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <QrCode className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Ready to generate QR session token</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Click below to generate a new QR token for scanning</p>
                </div>
                <button
                  type="button"
                  onClick={startQr}
                  disabled={qrBusy}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  Generate QR Code
                </button>
              </div>
            )}
          </div>

          {qrMsg && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-xs font-semibold text-destructive text-center">
              {qrMsg}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Phone Number */}
      {tab === "phone" && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5 max-w-2xl mx-auto">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-foreground">Sign In via Phone Number OTP</h3>
            <p className="text-xs text-muted-foreground">Receive an authentication code in your official Telegram app</p>
          </div>

          <div className="space-y-4">
            {phoneStep === "idle" || phoneStep === "error" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Phone Number (International format with country code)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+15551234567"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <button
                  type="button"
                  onClick={sendPhoneCode}
                  disabled={phoneBusy || !phone}
                  className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-xs hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {phoneBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                  Send Login Code
                </button>
              </div>
            ) : phoneStep === "code_sent" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Enter Verification Code sent to {phone}
                  </label>
                  <input
                    type="text"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    placeholder="12345"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <button
                  type="button"
                  onClick={verifyPhoneCode}
                  disabled={!phoneCode}
                  className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Verify Code & Connect
                </button>
              </div>
            ) : phoneStep === "awaiting_password" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Cloud 2FA Password
                  </label>
                  <input
                    type="password"
                    value={phonePassword}
                    onChange={(e) => setPhonePassword(e.target.value)}
                    placeholder="Enter 2FA password"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <button
                  type="button"
                  onClick={verifyPhoneCode}
                  className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-xs hover:opacity-90 transition-opacity"
                >
                  Confirm 2FA Password
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-success/15 text-success flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Phone Login Authorized!</h4>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/accounts")}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                >
                  View Accounts
                </button>
              </div>
            )}

            {phoneMsg && (
              <div className={cn(
                "p-3 rounded-xl border text-xs font-semibold text-center",
                phoneStep === "error" ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-success/10 border-success/30 text-success"
              )}>
                {phoneMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: TData ZIP */}
      {tab === "tdata" && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5 max-w-2xl mx-auto">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-foreground">Upload TData ZIP Portable Archives</h3>
            <p className="text-xs text-muted-foreground">Import full Telegram Desktop portable folders (.zip) or session files</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Custom Account Name (Optional)</label>
              <input
                type="text"
                value={customFirstName}
                onChange={(e) => setCustomFirstName(e.target.value)}
                placeholder="e.g. Sales Bot 1"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Custom Username (Optional)</label>
              <input
                type="text"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                placeholder="e.g. salesbot1"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("tdata-file-input")?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
              dragActive
                ? "border-primary bg-primary/10 scale-[0.99]"
                : "border-border hover:border-primary/50 bg-secondary/20"
            )}
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Upload className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-xs text-foreground">Drop TData ZIP files or sessions here</p>
              <p className="text-[10px] text-muted-foreground">Supports .zip (containing tdata folder), .session, and .json</p>
            </div>
            <input
              id="tdata-file-input"
              type="file"
              multiple
              accept=".zip,.session,.json"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-secondary/50 rounded-xl border border-border/60 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileArchive className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground truncate">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({(f.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="text-muted-foreground hover:text-destructive text-sm px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading || files.length === 0}
            className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-xs hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md shadow-primary/20"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing {files.length} Account(s)...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import {files.length} Account(s) to Database
              </>
            )}
          </button>

          {result && (
            <div className={cn(
              "p-4 rounded-xl border flex items-start gap-3",
              result.uploaded > 0 && result.failed === 0 ? "bg-success/10 border-success/30 text-success" : (result.uploaded > 0 ? "bg-warning/10 border-warning/30 text-warning-foreground" : "bg-destructive/10 border-destructive/30 text-destructive")
            )}>
              {result.uploaded > 0 && result.failed === 0 ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
              <div className="text-xs w-full">
                <p className="font-bold">
                  {result.uploaded > 0 && result.failed === 0 ? "Import Complete" : (result.uploaded > 0 ? "Import Partially Complete" : "Import Failed")}
                </p>
                <p className="mt-0.5">
                  {result.uploaded} accounts successfully imported, {result.failed} failed.
                </p>
                {result.errors && result.errors.length > 0 && (
                  <ul className="mt-2 pl-4 list-disc space-y-1 text-destructive/90 overflow-hidden break-words max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
