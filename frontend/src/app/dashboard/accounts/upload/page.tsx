"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, FileArchive, CheckCircle, AlertCircle, Loader2, Info, ArrowLeft, QrCode, Phone, Files, Bot, Settings, ExternalLink } from "lucide-react";
import api from "@/lib/api";

export default function TDataUploadPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"qr" | "phone" | "tdata">("tdata");

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
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.zip'));
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.name.endsWith('.zip'));
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
    files.forEach(file => formData.append("files", file));

    try {
      const response = await api.post("/accounts/upload/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;
      setResult({
        uploaded: data.total_accounts || 0,
        failed: data.failed || 0,
        errors: [],
      });
    } catch (error) {
      setResult({
        uploaded: 0,
        failed: files.length,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setUploading(false);
    }
  };

  const loginReq = async (url: string, opts?: RequestInit) => {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Request failed");
    return data;
  };

  const startQr = async () => {
    if (!apiId || !apiHash) return;
    setQrBusy(true); setQrMsg(""); setQrDataUri(""); setQrStatus("idle"); setLoginAccount(null);
    try {
      const data = await loginReq("/api/accounts/login/qr/start", {
        method: "POST",
        body: JSON.stringify({ api_id: Number(apiId), api_hash: apiHash }),
      });
      setQrLoginId(data.login_id);
      setQrDataUri(data.qr_data_uri);
      setQrStatus("pending");
      pollQr(data.login_id);
    } catch (e) {
      setQrStatus("error");
      setQrMsg(e instanceof Error ? e.message : "Failed to start QR login");
    } finally {
      setQrBusy(false);
    }
  };

  const pollQr = async (loginId: string) => {
    try {
      const data = await loginReq(`/api/accounts/login/qr/status/${loginId}`);
      if (data.status === "awaiting_password") { setQrStatus("awaiting_password"); return; }
      if (data.status === "authorized") {
        setQrStatus("authorized");
        setLoginAccount({ account_id: data.account_id, phone: data.phone });
        return;
      }
      setQrStatus("pending");
      setTimeout(() => pollQr(loginId), 2000);
    } catch {
      setQrStatus("error");
      setQrMsg("QR login failed");
    }
  };

  const submitQrPassword = async () => {
    try {
      const data = await loginReq(`/api/accounts/login/qr/password/${qrLoginId}`, {
        method: "POST",
        body: JSON.stringify({ password: qrPassword }),
      });
      setQrStatus("authorized");
      setLoginAccount({ account_id: data.account_id, phone: data.phone });
    } catch {
      setQrStatus("awaiting_password");
      setQrMsg("Invalid 2FA password");
    }
  };

  const sendPhoneCode = async () => {
    if (!apiId || !apiHash || !phone) return;
    setPhoneBusy(true); setPhoneMsg(""); setPhoneStep("idle"); setLoginAccount(null);
    try {
      const data = await loginReq("/api/accounts/login/phone/send-code", {
        method: "POST",
        body: JSON.stringify({ api_id: Number(apiId), api_hash: apiHash, phone }),
      });
      setPhoneLoginId(data.login_id);
      setPhoneStep("code_sent");
      setPhoneMsg(`Code sent to ${phone}`);
    } catch (e) {
      setPhoneStep("error");
      setPhoneMsg(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setPhoneBusy(false);
    }
  };

  const verifyPhoneCode = async () => {
    try {
      const data = await loginReq(`/api/accounts/login/phone/verify/${phoneLoginId}`, {
        method: "POST",
        body: JSON.stringify({ code: phoneCode, password: phonePassword || undefined }),
      });
      if (data.status === "awaiting_password") { setPhoneStep("awaiting_password"); return; }
      setPhoneStep("authorized");
      setLoginAccount({ account_id: data.account_id, phone: data.phone });
    } catch (e) {
      setPhoneStep("error");
      setPhoneMsg(e instanceof Error ? e.message : "Verification failed");
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/accounts")}
            className="p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Import TData Accounts</h1>
            <p className="text-xs text-muted-foreground">Upload Telegram Desktop session files</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Info Banner */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-4 pb-4 flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">What is TData?</h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                TData is the Telegram Desktop Portable format. Upload your existing Telegram Desktop session files to import accounts.
                Each ZIP file can contain multiple accounts.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Method Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={tab === "qr" ? "default" : "outline"}
            className="justify-center gap-2"
            onClick={() => setTab("qr")}
          >
            <QrCode className="h-4 w-4" /> QR Code
          </Button>
          <Button
            variant={tab === "phone" ? "default" : "outline"}
            className="justify-center gap-2"
            onClick={() => setTab("phone")}
          >
            <Phone className="h-4 w-4" /> Phone
          </Button>
          <Button
            variant={tab === "tdata" ? "default" : "outline"}
            className="justify-center gap-2"
            onClick={() => setTab("tdata")}
          >
            <Files className="h-4 w-4" /> TData ZIP
          </Button>
        </div>

        {/* API Credentials Status Notice */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                Telegram API Credentials Configured
                {customCredsActive ? (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 px-1.5 py-0">Custom</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-secondary text-muted-foreground border-border px-1.5 py-0">Default System App</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-[11px]">
                App ID: <span className="font-mono text-foreground">{apiId || "2040"}</span> • Hash: <span className="font-mono text-foreground">••••••••</span>
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium text-xs transition-colors"
          >
            <Settings className="h-3.5 w-3.5 text-primary" />
            Manage in Settings
            <ExternalLink className="h-3 w-3 text-muted-foreground ml-0.5" />
          </Link>
        </div>

        {/* QR Login */}
        {tab === "qr" && (
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sign in via QR Code</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Uses the API ID / Hash above. Scan the QR with your Telegram app
                (<span className="text-primary">Settings {'>'} Devices {'>'} Link Desktop Device</span>).
              </p>

              {!qrDataUri ? (
                <Button onClick={startQr} disabled={!apiId || !apiHash || qrBusy} className="w-full">
                  {qrBusy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting...</> : <><QrCode className="h-4 w-4 mr-2" /> Generate QR Code</>}
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {qrDataUri && <img src={qrDataUri} alt="Login QR Code" className="w-56 h-56 rounded-lg border border-border bg-white p-2" />}
                  <p className="text-sm text-foreground">Scan this QR with your Telegram app</p>
                </div>
              )}

              {/* 2FA */}
              {qrStatus === "awaiting_password" && (
                <div className="space-y-2">
                  <Input type="password" value={qrPassword} onChange={e => setQrPassword(e.target.value)} placeholder="Two-step verification password" />
                  <Button onClick={submitQrPassword} className="w-full">Submit Password</Button>
                </div>
              )}

              {qrMsg && <p className="text-xs text-destructive">{qrMsg}</p>}

              {qrStatus === "pending" && !qrMsg && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Waiting for scan...
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Phone Login */}
        {tab === "phone" && (
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sign in via Phone Number</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Enter your phone number in international format, then enter the code Telegram sends you.
              </p>

              {phoneStep === "idle" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phone number</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1234567890" />
                  </div>
                  <Button onClick={sendPhoneCode} disabled={!apiId || !apiHash || !phone || phoneBusy} className="w-full">
                    {phoneBusy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : <>Send Code</>}
                  </Button>
                </>
              )}

              {(phoneStep === "code_sent" || phoneStep === "awaiting_password") && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Login code</label>
                    <Input value={phoneCode} onChange={e => setPhoneCode(e.target.value)} placeholder="12345" />
                  </div>
                  {phoneStep === "awaiting_password" && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Two-step verification password</label>
                      <Input type="password" value={phonePassword} onChange={e => setPhonePassword(e.target.value)} placeholder="2FA password" />
                    </div>
                  )}
                  <Button onClick={verifyPhoneCode} disabled={!phoneCode || (phoneStep === "awaiting_password" && !phonePassword)} className="w-full">
                    Verify Code
                  </Button>
                  {phoneStep === "awaiting_password" && (
                    <p className="text-xs text-muted-foreground">This account has two-step verification enabled.</p>
                  )}
                </>
              )}

              {phoneMsg && <p className="text-xs text-destructive">{phoneMsg}</p>}
            </CardContent>
          </Card>
        )}

        {/* Logged in account banner */}
        {loginAccount && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Account added!</h4>
                <p className="text-xs text-muted-foreground">{loginAccount.phone} imported as #{loginAccount.account_id}</p>
              </div>
              <Button onClick={() => router.push("/dashboard/accounts")} size="sm">View Accounts</Button>
            </CardContent>
          </Card>
        )}

        {/* TData upload */}
        {tab === "tdata" && (<>
        {/* File Upload */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Upload TData Files</CardTitle></CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground text-sm">Drop TData ZIP files here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".zip"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-foreground">{files.length} file(s) selected</p>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileArchive className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <span className="text-red-500 text-lg leading-none">×</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Button */}
        <Button
          onClick={handleSubmit}
          disabled={!apiId || !apiHash || files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" /> Import Accounts ({files.length})
            </>
          )}
        </Button>

        {/* Results */}
        {result && (
          <Card className={result.uploaded > 0 ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20" : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                {result.uploaded > 0 ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
                <div>
                  <h4 className="font-semibold text-sm">
                    {result.uploaded > 0 ? "Import Successful!" : "Import Failed"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {result.uploaded} account(s) imported, {result.failed} failed
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2 mb-3">
                  <p className="font-medium text-sm text-red-700 dark:text-red-400">Errors:</p>
                  {result.errors.map((error, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 p-2 rounded">
                      {error}
                    </p>
                  ))}
                </div>
              )}

              {result.uploaded > 0 && (
                <div className="flex gap-2">
                  <Button onClick={() => router.push("/dashboard/accounts")} className="flex-1">
                    View Imported Accounts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </>)}
      </div>
    </div>
  );
}
