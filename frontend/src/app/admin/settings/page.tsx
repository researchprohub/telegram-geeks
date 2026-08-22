"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Wallet, Settings, Loader2, CheckCircle2, AlertCircle, Brain, Key, Mail, Send, Eye, EyeOff, RefreshCw, Shield, Sparkles, Server, Globe, Zap, Sliders, Cpu, ExternalLink, Layers, Bot, Check, ArrowRight } from "lucide-react";
import api from "@/lib/api";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Email System States
  const [testEmail, setTestEmail] = useState("discordmasters@atomicmail.io");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; message: string; details?: any } | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState("welcome");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function handleSendTestEmail() {
    if (!testEmail) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await api.post("/admin/email/test", {
        recipient_email: testEmail,
        provider: settings.email_provider,
        smtp_host: settings.smtp_host,
        smtp_port: parseInt(settings.smtp_port) || 587,
        smtp_user: settings.smtp_user,
        smtp_password: settings.smtp_password,
        smtp_tls: settings.smtp_tls,
        smtp_ssl: settings.smtp_ssl,
        resend_api_key: settings.resend_api_key,
        resend_from_email: settings.resend_from_email,
        mailtrap_api_token: settings.mailtrap_api_token,
        mailtrap_inbox_id: settings.mailtrap_inbox_id,
        mailtrap_is_sandbox: settings.mailtrap_is_sandbox,
        from_name: settings.email_from_name,
        from_address: settings.email_from_address,
      });
      setTestResult({
        status: "success",
        message: res.data.message || `Test email successfully dispatched to ${testEmail}!`,
        details: res.data.details,
      });
    } catch (err: any) {
      setTestResult({
        status: "error",
        message: err.response?.data?.detail || "Failed to send test email.",
      });
    } finally {
      setTestSending(false);
    }
  }

  async function handleOpenTemplatePreview(type: string) {
    setPreviewTemplate(type);
    setPreviewLoading(true);
    setPreviewModalOpen(true);
    try {
      const res = await api.get(`/admin/email/templates/preview?template_type=${type}`);
      setPreviewHtml(res.data);
    } catch (err: any) {
      setPreviewHtml("<p style='color:red;'>Failed to load template preview.</p>");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function fetchSettings() {
    try {
      const res = await api.get("/admin/settings");
      setSettings(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.put("/admin/settings", settings);
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground">Configure platform settings, pricing, and integrations.</p>
      </div>

      {saveMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {saveMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">✕</button>
        </div>
      )}

      <Tabs defaultValue="general">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            <span>Email & SMTP</span>
          </TabsTrigger>
          <TabsTrigger value="telegram">Telegram API</TabsTrigger>
          <TabsTrigger value="ai">AI Keys</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="wallets">Wallets & Crypto</TabsTrigger>
        </TabsList>

        {/* EMAIL & SMTP CONFIGURATION TAB */}
        <TabsContent value="email" className="space-y-6">
          {/* Master Switch & Sender Identity */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Transactional Email Delivery Engine
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Notifications</span>
                  <Switch
                    checked={settings?.email_notifications_enabled === true || settings?.email_notifications_enabled === "true"}
                    onCheckedChange={(checked) => setSettings({ ...settings, email_notifications_enabled: checked })}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Active Delivery Provider
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "smtp", name: "Custom SMTP", desc: "Mailtrap, Postfix, Gmail, SES, Custom", icon: Server },
                    { id: "resend", name: "Resend API", desc: "Modern developer-first email API", icon: Sparkles },
                    { id: "mailtrap", name: "Mailtrap API", desc: "Sandbox & Production delivery", icon: Mail },
                    { id: "disabled", name: "Disabled / Mock", desc: "Console simulation only", icon: Shield },
                  ].map((prov) => {
                    const Icon = prov.icon;
                    const isSelected = (settings?.email_provider || "disabled") === prov.id;
                    return (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, email_provider: prov.id })}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-primary/10 border-primary shadow-[0_0_12px_-2px_hsl(var(--primary)/0.3)]"
                            : "bg-background/50 border-border hover:bg-background/80 hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          {isSelected && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                        </div>
                        <h4 className="text-xs font-bold text-foreground">{prov.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{prov.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sender Details */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">From Display Name</label>
                  <Input
                    placeholder="TelegramGeeks Pro"
                    value={settings?.email_from_name || ""}
                    onChange={(e) => setSettings({ ...settings, email_from_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">From Email Address</label>
                  <Input
                    type="email"
                    placeholder="notifications@telegramgeekspro.com"
                    value={settings?.email_from_address || ""}
                    onChange={(e) => setSettings({ ...settings, email_from_address: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Provider Specific Credentials Card */}
          {settings?.email_provider === "smtp" && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  SMTP Connection Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium mb-1 text-foreground">SMTP Host / Server</label>
                    <Input
                      placeholder="smtp.mailtrap.io or smtp.gmail.com"
                      value={settings?.smtp_host || ""}
                      onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-foreground">Port</label>
                    <Input
                      type="number"
                      placeholder="587"
                      value={settings?.smtp_port || "587"}
                      onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-foreground">Username</label>
                    <Input
                      placeholder="smtp username / api key id"
                      value={settings?.smtp_user || ""}
                      onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-foreground">Password / Secret</label>
                    <Input
                      type="password"
                      placeholder="••••••••••••"
                      value={settings?.smtp_password || ""}
                      onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                    <Switch
                      checked={settings?.smtp_tls === true || settings?.smtp_tls === "true"}
                      onCheckedChange={(checked) => setSettings({ ...settings, smtp_tls: checked })}
                    />
                    <span>Enable STARTTLS (Port 587)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                    <Switch
                      checked={settings?.smtp_ssl === true || settings?.smtp_ssl === "true"}
                      onCheckedChange={(checked) => setSettings({ ...settings, smtp_ssl: checked })}
                    />
                    <span>Direct SSL / TLS (Port 465)</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {settings?.email_provider === "resend" && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Resend Integration (api.resend.com)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-foreground">Resend API Key</label>
                  <Input
                    type="password"
                    placeholder="re_123456789abcdef..."
                    value={settings?.resend_api_key || ""}
                    onChange={(e) => setSettings({ ...settings, resend_api_key: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Get your key from <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">resend.com/api-keys</a>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-foreground">Verified Sending Address</label>
                  <Input
                    placeholder="notifications@telegramgeekspro.com or onboarding@resend.dev"
                    value={settings?.resend_from_email || ""}
                    onChange={(e) => setSettings({ ...settings, resend_from_email: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {settings?.email_provider === "mailtrap" && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Mailtrap Integration (Email API & Sandbox)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-foreground">Mailtrap API Token</label>
                  <Input
                    type="password"
                    placeholder="mailtrap api bearer token..."
                    value={settings?.mailtrap_api_token || ""}
                    onChange={(e) => setSettings({ ...settings, mailtrap_api_token: e.target.value })}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-foreground">Sandbox Inbox ID (Optional for testing)</label>
                    <Input
                      placeholder="e.g. 1234567"
                      value={settings?.mailtrap_inbox_id || ""}
                      onChange={(e) => setSettings({ ...settings, mailtrap_inbox_id: e.target.value })}
                    />
                  </div>
                  <div className="pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                      <Switch
                        checked={settings?.mailtrap_is_sandbox === true || settings?.mailtrap_is_sandbox === "true"}
                        onCheckedChange={(checked) => setSettings({ ...settings, mailtrap_is_sandbox: checked })}
                      />
                      <span>Sandbox Capture Mode (Dev / Staging)</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Email Dispatcher & Diagnostics */}
          <Card className="border-border shadow-sm bg-gradient-to-br from-card to-primary/[0.02]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Live Email Diagnostic Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Dispatch an immediate test transmission to verify that your active provider credentials, port configuration, and TLS handshake operate with 100% deliverability.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="admin@domain.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendTestEmail}
                  disabled={testSending || !testEmail}
                  className="bg-primary text-primary-foreground hover:opacity-90 transition-all shrink-0"
                >
                  {testSending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                  <span>{testSending ? "Transmitting..." : "Send Test Email"}</span>
                </Button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.status === "success"
                      ? "bg-success/10 border-success/30 text-success"
                      : "bg-destructive/10 border-destructive/30 text-red-400"
                  }`}
                >
                  {testResult.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.details && (
                      <p className="font-mono text-[11px] opacity-80">{JSON.stringify(testResult.details)}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Animated HTML Email Template Gallery & Live Previews */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Modern Animated Email Templates Gallery
                </span>
                <Badge variant="outline" className="text-primary border-primary/30">
                  Responsive &bull; Dark Mode &bull; Cyberpunk
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: "welcome", title: "Welcome & Onboarding", desc: "Account activation, MTProto engine intro, and dashboard quick access." },
                  { id: "reset", title: "Password Reset / 2FA PIN", desc: "Security verification code with high-contrast PIN block and 15m expiration." },
                  { id: "license", title: "Desktop License Delivery", desc: "Dedicated standalone Windows key delivery, plan tier quota, and installer link." },
                  { id: "payment", title: "Payment Receipt & Invoice", desc: "Instant crypto/card confirmation, order receipt, and transaction summary." },
                  { id: "expiring", title: "Subscription Expiration Warning", desc: "Pre-expiration reminder to prevent MTProto and campaign automation stoppage." },
                  { id: "security", title: "Security / New IP Alert", desc: "Proactive alert on unfamiliar sign-in with client IP, timestamp, and device agent." },
                ].map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-3.5 rounded-xl border border-border bg-card/40 hover:bg-card hover:border-primary/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-foreground mb-1">{tmpl.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{tmpl.desc}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenTemplatePreview(tmpl.id)}
                      className="mt-3 w-full text-xs flex items-center justify-center gap-1.5 border-border hover:border-primary/40 hover:text-primary"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Preview Live Template</span>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:opacity-90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
              Save Email Configuration
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Platform Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Platform Name</label>
                  <Input
                    value={settings?.platform_name || ""}
                    onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Polling Interval (sec)</label>
                  <Input
                    type="number"
                    value={settings?.polling_interval || 60}
                    onChange={(e) => setSettings({ ...settings, polling_interval: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">Disable all user access</p>
                </div>
                <Switch
                  checked={settings?.maintenance_mode || false}
                  onCheckedChange={(v) => setSettings({ ...settings, maintenance_mode: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Registration Enabled</p>
                  <p className="text-xs text-muted-foreground">Allow new user signups</p>
                </div>
                <Switch
                  checked={settings?.registration_enabled ?? true}
                  onCheckedChange={(v) => setSettings({ ...settings, registration_enabled: v })}
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Telegram API Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">API ID</label>
                  <Input
                    type="number"
                    value={settings?.telegram_api_id || 12345678}
                    onChange={(e) => setSettings({ ...settings, telegram_api_id: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Get from my.telegram.org/apps</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">API Hash</label>
                  <Input
                    type="password"
                    value={settings?.telegram_api_hash || ""}
                    onChange={(e) => setSettings({ ...settings, telegram_api_hash: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Session Storage Path</label>
                <Input
                  value={settings?.session_storage_path || "./sessions"}
                  onChange={(e) => setSettings({ ...settings, session_storage_path: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  Save
                </Button>
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await handleSave();
                      await api.post("/admin/reload-infrastructure");
                      setSaveMessage("Telegram API settings saved & infrastructure reloaded!");
                      setTimeout(() => setSaveMessage(""), 3000);
                    } catch (err: any) {
                      setError(err.response?.data?.detail || "Failed to reload infrastructure");
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Save & Reload
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="font-medium mb-1">How to get API credentials:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">my.telegram.org/apps</a></li>
                  <li>Log in with your phone number</li>
                  <li>Create a new application if you haven't already</li>
                  <li>Copy the App api_id and App api_hash</li>
                  <li>Paste them above and click "Save & Reload"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          {/* Round-Robin & Routing Architecture Card */}
          <Card className="border-border shadow-sm bg-gradient-to-br from-card via-card to-primary/[0.03]">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <RefreshCw className="h-5 w-5 animate-[spin_12s_linear_infinite]" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">AI Routing & Round-Robin Load Balancer</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Intelligently distribute prompts across multiple free & commercial AI providers to eliminate rate limits.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1">
                    <Zap className="h-3 w-3" />
                    <span>{settings?.ai_routing_strategy === "round_robin" ? "Round-Robin Active" : settings?.ai_routing_strategy === "free_only_round_robin" ? "Free-Only Active" : "Fallback Chain"}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Routing Strategy Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Dispatch & Routing Strategy
                </label>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setSettings({ ...settings, ai_routing_strategy: "round_robin" })}
                    className={`cursor-pointer rounded-xl border p-4 transition-all relative ${
                      settings?.ai_routing_strategy === "round_robin" || !settings?.ai_routing_strategy
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:border-border/80 bg-background/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Round-Robin Rotation</span>
                      </div>
                      {(settings?.ai_routing_strategy === "round_robin" || !settings?.ai_routing_strategy) && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Rotates every single request circularly across all configured providers. If one hits 429 rate limits, it auto-cooldowns and routes to the next.
                    </p>
                  </div>

                  <div
                    onClick={() => setSettings({ ...settings, ai_routing_strategy: "free_only_round_robin" })}
                    className={`cursor-pointer rounded-xl border p-4 transition-all relative ${
                      settings?.ai_routing_strategy === "free_only_round_robin"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:border-border/80 bg-background/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">100% Free Providers Only</span>
                      </div>
                      {settings?.ai_routing_strategy === "free_only_round_robin" && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Restricts Round-Robin strictly to zero-cost providers (Groq, Gemini, SambaNova, Together, DeepSeek, Cerebras, GitHub). Zero billing costs guaranteed.
                    </p>
                  </div>

                  <div
                    onClick={() => setSettings({ ...settings, ai_routing_strategy: "fallback_chain" })}
                    className={`cursor-pointer rounded-xl border p-4 transition-all relative ${
                      settings?.ai_routing_strategy === "fallback_chain"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:border-border/80 bg-background/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Priority Fallback Chain</span>
                      </div>
                      {settings?.ai_routing_strategy === "fallback_chain" && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Always uses your chosen primary provider first. Only fails over sequentially if the primary returns an error or is unreachable.
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Provider & Model Selectors */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">Default Primary Provider</label>
                  <select
                    className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    value={settings?.default_ai_provider || "groq"}
                    onChange={(e) => setSettings({ ...settings, default_ai_provider: e.target.value })}
                  >
                    <optgroup label="Free Tier & Fast Clouds">
                      <option value="groq">Groq (Ultra-Fast LPU)</option>
                      <option value="sambanova">SambaNova Cloud (Llama 3.3 / DeepSeek)</option>
                      <option value="cerebras">Cerebras (2000 t/s Wafer Scale)</option>
                      <option value="google_gemini">Google Gemini (Gemini 2.0 / 1.5 Flash)</option>
                      <option value="github">GitHub Models (Free GPT-4o / Llama 3.3)</option>
                      <option value="deepseek">DeepSeek Official (V3 / R1)</option>
                      <option value="together">Together AI (Open Weights)</option>
                      <option value="siliconflow">SiliconFlow (Qwen / DeepSeek)</option>
                      <option value="nvidia_nim">NVIDIA NIM (Microservices)</option>
                      <option value="cloudflare_workers_ai">Cloudflare Workers AI</option>
                      <option value="huggingface">Hugging Face Serverless</option>
                      <option value="ollama">Ollama (Local / Self-Hosted)</option>
                    </optgroup>
                    <optgroup label="Commercial Providers">
                      <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                      <option value="anthropic">Anthropic (Claude 3.5 Sonnet / Haiku)</option>
                      <option value="openrouter">OpenRouter (100+ Models Aggregator)</option>
                      <option value="mistral_ai">Mistral AI (Small / Nemo)</option>
                      <option value="cohere">Cohere (Command R+)</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">Default Primary Model Name</label>
                  <Input
                    placeholder="e.g. llama-3.3-70b-versatile or gpt-4o-mini"
                    value={settings?.default_ai_model || ""}
                    onChange={(e) => setSettings({ ...settings, default_ai_model: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 1: Free Tier & Open Cloud Providers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Free Tier & Open Cloud Providers (12 Services)</h3>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[11px]">
                Zero Cost Ready
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Groq */}
              <Card className="border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Groq Cloud (LPU Instant)
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      🚀 Ultra Fast (Free)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    Hardware-accelerated inference with Llama 3.3 70B & DeepSeek R1 Distill.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1 text-foreground">API Key</label>
                    <Input
                      type="password"
                      placeholder="gsk_..."
                      value={settings?.groq_api_key || ""}
                      onChange={(e) => setSettings({ ...settings, groq_api_key: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground">Models: llama-3.3-70b, mixtral</span>
                    <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>Get Free Key</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* SambaNova */}
              <Card className="border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" />
                      SambaNova Cloud
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      ⚡ High Speed (Free)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    Full precision Meta-Llama-3.3-70B and DeepSeek R1 running on SN40L chips.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1 text-foreground">API Key</label>
                    <Input
                      type="password"
                      placeholder="samba_..."
                      value={settings?.sambanova_api_key || ""}
                      onChange={(e) => setSettings({ ...settings, sambanova_api_key: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground">Models: Meta-Llama-3.3-70B</span>
                    <a href="https://cloud.sambanova.ai" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>Get Free Key</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Google Gemini */}
              <Card className="border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      Google Gemini AI Studio
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      🆓 15 RPM Free Tier
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    Massive 1M+ token context with Gemini 2.0 Flash & Gemini 1.5 Flash.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1 text-foreground">API Key</label>
                    <Input
                      type="password"
                      placeholder="AIzaSy..."
                      value={settings?.gemini_api_key || ""}
                      onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground">Models: gemini-2.0-flash, 1.5-flash</span>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>Get Free Key</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* DeepSeek */}
              <Card className="border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      DeepSeek Official
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      🧠 DeepSeek V3 / R1
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    DeepSeek V3 chat and DeepSeek R1 deep reasoning API endpoint.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1 text-foreground">API Key</label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={settings?.deepseek_api_key || ""}
                      onChange={(e) => setSettings({ ...settings, deepseek_api_key: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground">Models: deepseek-chat, deepseek-reasoner</span>
                    <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>Get API Key</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* GitHub Models */}
              <Card className="border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      GitHub Models
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      🐙 Free via GitHub PAT
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    Free access to GPT-4o, GPT-4o-mini, and Llama 3.3 via Azure GitHub Models.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1 text-foreground">GitHub Personal Access Token (PAT)</label>
                    <Input
                      type="password"
                      placeholder="ghp_..."
                      value={settings?.github_token || ""}
                      onChange={(e) => setSettings({ ...settings, github_token: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground">Models: gpt-4o-mini, Llama-3.1-70B</span>
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>Create Token</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Cerebras */}
              <Card className="border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Cerebras Wafer-Scale
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      ⚡ 2,000+ Tokens/sec
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    World record inference speeds on wafer-scale clusters for Llama 3.1 & 3.3.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1 text-foreground">API Key</label>
                    <Input
                      type="password"
                      placeholder="csk-..."
                      value={settings?.cerebras_api_key || ""}
                      onChange={(e) => setSettings({ ...settings, cerebras_api_key: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground">Models: llama3.3-70b, llama3.1-8b</span>
                    <a href="https://cloud.cerebras.ai" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>Get Free Key</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Together AI */}
              <Card className="border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Together AI
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      ✨ Free Trial Credits
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    High speed open source inference for Qwen 2.5, DeepSeek R1, and Llama 3.3.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1 text-foreground">API Key</label>
                    <Input
                      type="password"
                      placeholder="together_api_key..."
                      value={settings?.together_api_key || ""}
                      onChange={(e) => setSettings({ ...settings, together_api_key: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground">Models: Llama-3.3-70B-Turbo, DeepSeek-R1</span>
                    <a href="https://api.together.xyz/settings/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>Get API Key</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* SiliconFlow */}
              <Card className="border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Server className="h-4 w-4 text-primary" />
                      SiliconFlow
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      🇨🇳 Free Qwen & DeepSeek
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    Generous free credits for Qwen 2.5 7B/72B and DeepSeek V3/R1.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1 text-foreground">API Key</label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={settings?.siliconflow_api_key || ""}
                      onChange={(e) => setSettings({ ...settings, siliconflow_api_key: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground">Models: Qwen2.5-7B-Instruct, DeepSeek-V3</span>
                    <a href="https://cloud.siliconflow.cn/account/ak" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>Get Free Key</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* NVIDIA NIM */}
              <Card className="border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" />
                      NVIDIA NIM Microservices
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      🟢 1000 Free Credits
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    Enterprise GPU-optimized inference for Nemotron, Llama 3.1, and Mixtral.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1 text-foreground">API Key</label>
                    <Input
                      type="password"
                      placeholder="nvapi-..."
                      value={settings?.nvidia_nim_api_key || ""}
                      onChange={(e) => setSettings({ ...settings, nvidia_nim_api_key: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground">Models: llama-3.1-8b-instruct, nemotron</span>
                    <a href="https://build.nvidia.com" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>Get NVIDIA Key</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Cloudflare Workers AI */}
              <Card className="border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Cloudflare Workers AI
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      🌐 10k Neurons/Day Free
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium mb-1 text-foreground">API Token</label>
                      <Input
                        type="password"
                        placeholder="cf_token_..."
                        value={settings?.cloudflare_api_token || ""}
                        onChange={(e) => setSettings({ ...settings, cloudflare_api_token: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1 text-foreground">Account ID</label>
                      <Input
                        placeholder="cf_account_id..."
                        value={settings?.cloudflare_account_id || ""}
                        onChange={(e) => setSettings({ ...settings, cloudflare_account_id: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground">Models: @cf/meta/llama-3.1-8b-instruct</span>
                    <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>Get CF Token</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Hugging Face */}
              <Card className="border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      Hugging Face Serverless
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      🤗 Free Inference API
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    Access open source repositories and serverless inference checkpoints.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1 text-foreground">User Access Token</label>
                    <Input
                      type="password"
                      placeholder="hf_..."
                      value={settings?.huggingface_api_key || ""}
                      onChange={(e) => setSettings({ ...settings, huggingface_api_key: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground">Models: meta-llama/Llama-3.1-8B-Instruct</span>
                    <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>Create Token</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Ollama Local */}
              <Card className="border-border shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Ollama (Local / Self-Hosted)
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      🔒 100% Offline & Private
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    Self-hosted LLMs running inside your container or on-prem GPU.
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium mb-1 text-foreground">Endpoint URL</label>
                    <Input
                      placeholder="http://localhost:11434"
                      value={settings?.ollama_base_url || "http://localhost:11434"}
                      onChange={(e) => setSettings({ ...settings, ollama_base_url: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground">Models: llama3.2, mistral, qwen2.5</span>
                    <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>Documentation</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section 2: Commercial & Premium Tier Providers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Commercial & Multi-Model Providers (5 Services)</h3>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[11px]">
                Paid / Pay-As-You-Go
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* OpenAI */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      OpenAI
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">GPT-4o</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    type="password"
                    placeholder="sk-proj-..."
                    value={settings?.openai_api_key || ""}
                    onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                  />
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Models: gpt-4o, gpt-4o-mini</span>
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>API Keys</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Anthropic */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      Anthropic Claude
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">Claude 3.5</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    type="password"
                    placeholder="sk-ant-..."
                    value={settings?.anthropic_api_key || ""}
                    onChange={(e) => setSettings({ ...settings, anthropic_api_key: e.target.value })}
                  />
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Models: claude-3-5-sonnet</span>
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>API Keys</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* OpenRouter */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      OpenRouter
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">100+ Models</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={settings?.openrouter_api_key || ""}
                    onChange={(e) => setSettings({ ...settings, openrouter_api_key: e.target.value })}
                  />
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Models: openrouter/auto</span>
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>API Keys</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Mistral AI */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      Mistral AI
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">Mistral</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    type="password"
                    placeholder="mistral_key_..."
                    value={settings?.mistral_api_key || ""}
                    onChange={(e) => setSettings({ ...settings, mistral_api_key: e.target.value })}
                  />
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Models: mistral-small-latest</span>
                    <a href="https://console.mistral.ai/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>API Keys</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Cohere */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      Cohere Command
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">RAG</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    type="password"
                    placeholder="cohere_key_..."
                    value={settings?.cohere_api_key || ""}
                    onChange={(e) => setSettings({ ...settings, cohere_api_key: e.target.value })}
                  />
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Models: command-r, command-r-plus</span>
                    <a href="https://dashboard.cohere.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <span>API Keys</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              All credentials are encrypted with AES-256 before storage. Changes take effect across all active Telegram automation agents immediately upon reload.
            </p>
            <div className="flex gap-2.5 shrink-0">
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:opacity-90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Save AI Configuration
              </Button>
              <Button
                variant="outline"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await handleSave();
                    await api.post("/admin/reload-infrastructure");
                    setSaveMessage("AI Provider keys saved & Round-Robin engine reloaded successfully!");
                    setTimeout(() => setSaveMessage(""), 3500);
                  } catch (err: any) {
                    setError(err.response?.data?.detail || "Failed to reload infrastructure");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Save & Reload Engine
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">License Pricing</CardTitle>
                <Button onClick={handleSave} disabled={saving} size="sm">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">These prices are shown on the marketing landing page.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">1 Month</p>
                  <p className="text-lg font-bold">$<input type="number" value={settings?.starter_price_monthly ?? 120} onChange={(e) => setSettings({ ...settings, starter_price_monthly: parseInt(e.target.value) })} className="w-20 bg-transparent border-b border-border text-lg font-bold outline-none" /></p>
                  <p className="text-xs text-muted-foreground mt-1">Base modules access</p>
                </div>
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 relative">
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">Best value</span>
                  <p className="text-xs text-muted-foreground mb-1">1 Year</p>
                  <p className="text-lg font-bold">$<input type="number" value={settings?.starter_price_yearly ?? 550} onChange={(e) => setSettings({ ...settings, starter_price_yearly: parseInt(e.target.value) })} className="w-20 bg-transparent border-b border-border text-lg font-bold outline-none" /></p>
                  <p className="text-xs text-muted-foreground mt-1">Base modules, priority support</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">2 Years</p>
                  <p className="text-lg font-bold">$<input type="number" value={settings?.pro_price_yearly ?? 1050} onChange={(e) => setSettings({ ...settings, pro_price_yearly: parseInt(e.target.value) })} className="w-20 bg-transparent border-b border-border text-lg font-bold outline-none" /></p>
                  <p className="text-xs text-muted-foreground mt-1">Save 20% vs 1-year</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">3 Years</p>
                  <p className="text-lg font-bold">$<input type="number" value={settings?.agency_price_yearly ?? 1350} onChange={(e) => setSettings({ ...settings, agency_price_yearly: parseInt(e.target.value) })} className="w-20 bg-transparent border-b border-border text-lg font-bold outline-none" /></p>
                  <p className="text-xs text-muted-foreground mt-1">Pro modules discount, save 38%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Payment Gateways</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">NowPayments API Key</label>
                <Input
                  type="password"
                  value={settings?.nowpayments_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, nowpayments_api_key: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Oxapay API Key</label>
                <Input
                  type="password"
                  value={settings?.oxapay_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, oxapay_api_key: e.target.value })}
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Save Integrations
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets" className="space-y-6">
          <Card className="border-border shadow-sm bg-gradient-to-br from-card to-primary/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    Company Deposit & Payment Wallets
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Direct cryptographic deposit addresses utilized across the Web App checkout and Windows Desktop Client.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs text-teal-400 border-teal-500/30 w-fit">
                  Blockchain Scanner: Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                {/* SOL */}
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-400" />
                      Solana (SOL Native)
                    </label>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">SOL</Badge>
                  </div>
                  <Input
                    className="font-mono text-xs bg-background/80"
                    placeholder="Solana address..."
                    value={settings?.wallet_sol || ""}
                    onChange={(e) => setSettings({ ...settings, wallet_sol: e.target.value })}
                  />
                </div>

                {/* XMR */}
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-orange-400" />
                      Monero (XMR Private)
                    </label>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">XMR</Badge>
                  </div>
                  <Input
                    className="font-mono text-xs bg-background/80"
                    placeholder="Monero address..."
                    value={settings?.wallet_xmr || ""}
                    onChange={(e) => setSettings({ ...settings, wallet_xmr: e.target.value })}
                  />
                </div>

                {/* ETH */}
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                      Ethereum (ETH Native)
                    </label>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">ETH</Badge>
                  </div>
                  <Input
                    className="font-mono text-xs bg-background/80"
                    placeholder="Ethereum address..."
                    value={settings?.wallet_eth || ""}
                    onChange={(e) => setSettings({ ...settings, wallet_eth: e.target.value })}
                  />
                </div>

                {/* BTC */}
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      Bitcoin (BTC Native SegWit)
                    </label>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">BTC</Badge>
                  </div>
                  <Input
                    className="font-mono text-xs bg-background/80"
                    placeholder="Bitcoin address..."
                    value={settings?.wallet_btc || ""}
                    onChange={(e) => setSettings({ ...settings, wallet_btc: e.target.value })}
                  />
                </div>

                {/* TRX */}
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-400" />
                      Tron (TRX Native)
                    </label>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">TRX</Badge>
                  </div>
                  <Input
                    className="font-mono text-xs bg-background/80"
                    placeholder="Tron address..."
                    value={settings?.wallet_trx || ""}
                    onChange={(e) => setSettings({ ...settings, wallet_trx: e.target.value })}
                  />
                </div>

                {/* USDT TRC-20 */}
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-teal-400" />
                      Tether USDT (TRC-20 on Tron)
                    </label>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono text-teal-400 border-teal-500/30">TRC20</Badge>
                  </div>
                  <Input
                    className="font-mono text-xs bg-background/80"
                    placeholder="TRC20 USDT address..."
                    value={settings?.wallet_usdt_trc20 || ""}
                    onChange={(e) => setSettings({ ...settings, wallet_usdt_trc20: e.target.value })}
                  />
                </div>

                {/* USDT ERC-20 */}
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-400" />
                      Tether USDT (ERC-20 on Ethereum)
                    </label>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono text-blue-400 border-blue-500/30">ERC20</Badge>
                  </div>
                  <Input
                    className="font-mono text-xs bg-background/80"
                    placeholder="ERC20 USDT address..."
                    value={settings?.wallet_usdt_erc20 || ""}
                    onChange={(e) => setSettings({ ...settings, wallet_usdt_erc20: e.target.value })}
                  />
                </div>

                {/* TON */}
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-sky-400" />
                      The Open Network (TON)
                    </label>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">TON</Badge>
                  </div>
                  <Input
                    className="font-mono text-xs bg-background/80"
                    placeholder="TON address..."
                    value={settings?.wallet_ton || ""}
                    onChange={(e) => setSettings({ ...settings, wallet_ton: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/10"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                  Save All Wallet Addresses
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Template Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#06090F] border-border">
          <DialogHeader className="p-4 border-b border-border bg-[#0D131F] flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <DialogTitle className="text-sm font-bold text-white capitalize">
                {previewTemplate.replace("_", " ")} Email Template (Live Render)
              </DialogTitle>
            </div>
            <Badge variant="outline" className="text-xs text-primary border-primary/30 mr-6">
              CSS Animation &bull; Responsive Dark
            </Badge>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 bg-[#06090F]">
            {previewLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  srcDoc={previewHtml}
                  title="Email Preview"
                  className="w-full h-[520px] bg-[#06090F]"
                />
              </div>
            )}
          </div>

          <DialogFooter className="p-3 border-t border-border bg-[#0D131F] flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Renders with cross-client fallback styling + CSS keyframe glow
            </span>
            <Button size="sm" variant="outline" onClick={() => setPreviewModalOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
