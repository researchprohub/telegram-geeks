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
import { Plus, Wallet, Settings, Loader2, CheckCircle2, AlertCircle, Brain, Key } from "lucide-react";
import api from "@/lib/api";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

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
        <TabsList className="w-full grid grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="telegram">Telegram API</TabsTrigger>
          <TabsTrigger value="ai">AI Keys</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
        </TabsList>

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

        <TabsContent value="ai" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Provider API Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">These keys are used globally by the AI engine. Users cannot see or change them.</p>
              <div>
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                  <Key className="h-3.5 w-3.5" /> OpenAI API Key
                </label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={settings?.openai_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                  <Key className="h-3.5 w-3.5" /> Anthropic API Key
                </label>
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  value={settings?.anthropic_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, anthropic_api_key: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                  <Key className="h-3.5 w-3.5" /> Groq API Key
                </label>
                <Input
                  type="password"
                  placeholder="gsk_..."
                  value={settings?.groq_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, groq_api_key: e.target.value })}
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
                      setSaveMessage("AI keys saved & infrastructure reloaded!");
                      setTimeout(() => setSaveMessage(""), 3000);
                    } catch (err: any) {
                      setError(err.response?.data?.detail || "Failed to reload infrastructure");
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Save & Reload AI Engine
                </Button>
              </div>
            </CardContent>
          </Card>
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

        <TabsContent value="wallets" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Crypto Wallets
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Wallet
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Currency</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { currency: "BTC", network: "BTC", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", balance: "0.0523" },
                    { currency: "ETH", network: "ETH", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18", balance: "1.234" },
                    { currency: "USDT", network: "TRC20", address: "TN2Y7e5RLkKCzRebmr1hoJSbhMQRzizf3q", balance: "15,420.00" },
                  ].map((w, i) => (
                    <TableRow key={i}>
                      <TableCell><Badge variant="outline">{w.currency}</Badge></TableCell>
                      <TableCell className="text-foreground">{w.network}</TableCell>
                      <TableCell className="font-mono text-xs text-foreground">{w.address}</TableCell>
                      <TableCell className="text-foreground">{w.balance}</TableCell>
                      <TableCell><Badge variant="default">Active</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
