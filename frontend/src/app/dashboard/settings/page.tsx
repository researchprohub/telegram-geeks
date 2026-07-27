"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Key, Wifi, Timer, Brain, Lock, Loader2, CheckCircle2, LogOut, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });

  // profile
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  // change password
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");

  // system config
  const [config, setConfig] = useState<any>({});
  const [licenseKey, setLicenseKey] = useState("");

  useEffect(() => {
    Promise.allSettled([
      api.get("/auth/me"),
      api.get("/global-config"),
      api.get("/admin/settings"),
    ]).then(([me, cfg, _]) => {
      if (me.status === "fulfilled") {
        const u = me.value.data;
        setFullName(u.full_name || "");
        setEmail(u.email);
        setRole(u.role);
      }
      if (cfg.status === "fulfilled") {
        const c = cfg.value.data;
        setConfig(c);
        setLicenseKey(c.license?.key || "");
      }
    }).finally(() => setLoading(false));
  }, []);

  function flash(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: "", ok: false }), 3000);
  }

  function update(section: string, key: string, value: any) {
    setConfig((prev: any) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: value },
    }));
  }

  async function saveConfig(section: string, key?: string, value?: any) {
    setSaving(true);
    try {
      if (key && value !== undefined) {
        await api.put("/global-config", { section, key, value });
      } else {
        await api.put("/global-config/section", { section, data: config[section] });
      }
      flash("Saved");
    } catch { flash("Failed", false); }
    setSaving(false);
  }

  async function handleUpdateProfile() {
    setSaving(true);
    try {
      await api.put("/auth/update-profile", { full_name: fullName });
      flash("Profile updated");
    } catch { flash("Failed to update profile", false); }
    setSaving(false);
  }

  async function handleChangePassword() {
    if (!curPw || !newPw) { flash("Fill both fields", false); return; }
    if (newPw.length < 12) { flash("New password must be at least 12 characters", false); return; }
    setSaving(true);
    try {
      await api.put("/auth/change-password", { current_password: curPw, new_password: newPw });
      setCurPw("");
      setNewPw("");
      flash("Password changed");
    } catch (err: any) {
      flash(err.response?.data?.detail || "Failed", false);
    }
    setSaving(false);
  }

  async function handleLogout() {
    try { await api.post("/auth/logout"); } catch { }
    window.location.href = "/login";
  }

  const sv = (s: string, k: string, d: any = "") => config[s]?.[k] ?? d;

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <>
      <div className="sticky top-0 z-30 bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.07] px-6 py-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure your platform preferences</p>
      </div>

      <div className="p-6 max-w-3xl">
        {msg.text && (
          <div className={`rounded-2xl p-3 flex items-center gap-2 text-sm mb-4 ${
            msg.ok ? "bg-success/10 border border-success/20 text-green-400"
                   : "bg-destructive/10 border border-destructive/20 text-red-400"}`}>
            <CheckCircle2 className="h-4 w-4 shrink-0" />{msg.text}
          </div>
        )}

        <Tabs defaultValue="profile">
          <TabsList className="p-1 bg-white/[0.02] border border-white/[0.07] rounded-xl">
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"><User className="h-3.5 w-3.5 mr-1" />Profile</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"><Key className="h-3.5 w-3.5 mr-1" />Security</TabsTrigger>
            <TabsTrigger value="proxy" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"><Wifi className="h-3.5 w-3.5 mr-1" />Proxy</TabsTrigger>
            <TabsTrigger value="delays" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"><Timer className="h-3.5 w-3.5 mr-1" />Delays</TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"><Brain className="h-3.5 w-3.5 mr-1" />AI Providers</TabsTrigger>
            <TabsTrigger value="license" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"><Lock className="h-3.5 w-3.5 mr-1" />License</TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="space-y-4 mt-6">
            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-6">
              <h3 className="text-base font-semibold text-white mb-4">Profile Information</h3>
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input type="email" value={email} disabled
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-sm text-slate-500 outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                  <input type="text" value={role} disabled
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-sm text-slate-500 outline-none cursor-not-allowed capitalize" />
                </div>
                <button onClick={handleUpdateProfile} disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)] disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-4 mt-6">
            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-6">
              <h3 className="text-base font-semibold text-white mb-4">Change Password</h3>
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Current Password</label>
                  <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/30" />
                  <p className="text-xs text-slate-500 mt-1">Min 12 characters with uppercase, lowercase, digit, and special character</p>
                </div>
                <button onClick={handleChangePassword} disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)] disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Update Password
                </button>
              </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-6">
              <h3 className="text-base font-semibold text-destructive mb-4">Danger Zone</h3>
              <p className="text-sm text-slate-400 mb-4">Log out of your account on this device.</p>
              <button onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 text-destructive px-4 py-2 text-sm font-medium hover:bg-destructive/10 transition">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </TabsContent>

          {/* Proxy */}
          <TabsContent value="proxy" className="space-y-4 mt-6">
            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-6">
              <h3 className="text-base font-semibold text-white mb-4">Proxy Settings</h3>
              <div className="space-y-4 max-w-sm">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-white">Enable Proxy</p><p className="text-xs text-slate-400">Route traffic through proxy pool</p></div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={sv("proxy", "enabled", false)} onChange={e => saveConfig("proxy", "enabled", e.target.checked)} />
                    <div className="w-9 h-5 bg-white/[0.06] rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Proxy Source</label>
                  <select value={sv("proxy", "source", "account")} onChange={e => saveConfig("proxy", "source", e.target.value)}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30">
                    <option value="account">Use From Account</option>
                    <option value="settings">Use From Settings</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-medium text-slate-300 mb-1">Timeout (s)</label>
                    <input type="number" value={sv("proxy", "timeout", 5)} onChange={e => saveConfig("proxy", "timeout", parseInt(e.target.value) || 3)}
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30" /></div>
                  <div><label className="block text-xs font-medium text-slate-300 mb-1">Retry Count</label>
                    <input type="number" value={sv("proxy", "retry_count", 3)} onChange={e => saveConfig("proxy", "retry_count", parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30" /></div>
                  <div><label className="block text-xs font-medium text-slate-300 mb-1">Conn Delay (s)</label>
                    <input type="number" value={sv("proxy", "connection_delay", 1)} onChange={e => saveConfig("proxy", "connection_delay", parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30" /></div>
                </div>
              </div>
            </div>
            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-6">
              <h3 className="text-base font-semibold text-white mb-4">Threads</h3>
              <div className="space-y-4 max-w-sm">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-white">Stream Control</p><p className="text-xs text-slate-400">Manual thread count override</p></div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={sv("threads", "stream_control", false)} onChange={e => saveConfig("threads", "stream_control", e.target.checked)} />
                    <div className="w-9 h-5 bg-white/[0.06] rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
                {sv("threads", "stream_control", false) && (
                  <div><label className="block text-xs font-medium text-slate-300 mb-1">Max Streams</label>
                    <input type="number" value={sv("threads", "max_streams", 5)} onChange={e => saveConfig("threads", "max_streams", parseInt(e.target.value) || 1)}
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30" /></div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Delays */}
          <TabsContent value="delays" className="space-y-4 mt-6">
            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-6">
              <h3 className="text-base font-semibold text-white mb-4">Global Delay Randomizer</h3>
              <p className="text-xs text-slate-400 mb-4">All modules draw random delays from this range to simulate human timing.</p>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Min Delay (s)</label>
                  <input type="number" value={sv("delays", "min_seconds", 3)} onChange={e => saveConfig("delays", "min_seconds", parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30" /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Max Delay (s)</label>
                  <input type="number" value={sv("delays", "max_seconds", 15)} onChange={e => saveConfig("delays", "max_seconds", parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30" /></div>
              </div>
              <button onClick={() => saveConfig("delays")} disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)] disabled:opacity-50 mt-4">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Delays
              </button>
            </div>
          </TabsContent>

          {/* AI Providers */}
          <TabsContent value="ai" className="space-y-4 mt-6">
            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-6">
              <h3 className="text-base font-semibold text-white mb-2">AI Providers</h3>
              <p className="text-xs text-slate-400 mb-4">Select your AI provider and enter your own API key. Free providers marked with badge.</p>
              
              {/* Active provider selector */}
              <div className="space-y-4 max-w-sm mb-4">
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Active Provider</label>
                  <select value={sv("ai_providers", "active", "groq")} onChange={e => saveConfig("ai_providers", "active", e.target.value)}
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30">
                    {[
                      {id:"groq", name:"Groq", free:true, models:["llama-3.1-8b-instant","llama-3.1-70b-versatile","mixtral-8x7b-32768"]},
                      {id:"ollama", name:"Ollama (Local)", free:true, models:["llama3","mistral","codellama","phi3","gemma2"]},
                      {id:"google_gemini", name:"Google Gemini", free:true, models:["gemini-pro","gemini-1.5-flash","gemini-2.0-flash"]},
                      {id:"cerebras", name:"Cerebras", free:true, models:["llama-3.1-8b","llama-3.1-70b","llama3.1-8b"]},
                      {id:"nvidia_nim", name:"NVIDIA NIM", free:true, models:["meta/llama-3.1-8b-instruct","meta/llama-3.1-70b-instruct"]},
                      {id:"cloudflare_workers_ai", name:"Cloudflare Workers AI", free:true, models:["@cf/meta/llama-3.1-8b-instruct","@cf/meta/llama-2-7b-chat-int8"]},
                      {id:"siliconflow", name:"SiliconFlow", free:true, models:["Qwen/Qwen2.5-7B-Instruct"]},
                      {id:"huggingface", name:"Hugging Face", free:true, models:["meta-llama/Llama-3-8B-Instruct"]},
                      {id:"github", name:"GitHub Models", free:true, models:["gpt-4o-mini","gpt-4o","Meta-Llama-3.1-70B-Instruct","Mistral-large","Cohere-command-r-plus","Phi-3.5-mini-instruct"]},
                      {id:"openai", name:"OpenAI", free:false, models:["gpt-4o-mini","gpt-4o","gpt-3.5-turbo"]},
                      {id:"anthropic", name:"Anthropic", free:false, models:["claude-3-haiku","claude-3-sonnet","claude-3-opus"]},
                      {id:"cohere", name:"Cohere", free:false, models:["command-r","command-r-plus"]},
                      {id:"mistral_ai", name:"Mistral AI", free:false, models:["mistral-small","mistral-large"]},
                      {id:"openrouter", name:"OpenRouter", free:false, models:["openrouter/auto"]},
                    ].map(p => (
                      <option key={p.id} value={p.id}>{p.name}{p.free ? ' (Free)' : ''}</option>
                    ))}
                  </select>
                </div>
                {sv("ai_providers", "active") !== "ollama" && (
                  <div><label className="block text-sm font-medium text-slate-300 mb-1">Your API Key</label>
                    <input type="password" value={sv("ai_providers", sv("ai_providers", "active", "groq") + "_key", "")} 
                      placeholder="Enter your API key for this provider" 
                      onChange={e => saveConfig("ai_providers", sv("ai_providers", "active", "groq") + "_key", e.target.value)}
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30" />
                    <p className="text-xs text-slate-500 mt-1">Your key is stored locally and never shared. Free tier keys work fine.</p>
                  </div>
                )}
              </div>
            </div>

            {/* All Providers Keys */}
            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-6">
              <h3 className="text-base font-semibold text-white mb-4">All Provider Keys</h3>
              <p className="text-xs text-slate-400 mb-4">Configure keys for all providers you have accounts with. The engine falls back through providers automatically.</p>
              <div className="space-y-3 max-w-sm">
                {[
                  {id:"groq", name:"Groq", free:true, keyPlaceholder:"gsk_...", keyUrl:"https://console.groq.com/keys"},
                  {id:"google_gemini", name:"Google Gemini", free:true, keyPlaceholder:"AIza...", keyUrl:"https://aistudio.google.com/apikey"},
                  {id:"cerebras", name:"Cerebras", free:true, keyPlaceholder:"csk-...", keyUrl:"https://cloud.cerebras.ai"},
                  {id:"nvidia_nim", name:"NVIDIA NIM", free:true, keyPlaceholder:"nvapi-...", keyUrl:"https://build.nvidia.com"},
                  {id:"cloudflare_workers_ai", name:"Cloudflare Workers AI", free:true, keyPlaceholder:"Account ID + API Token", keyUrl:"https://dash.cloudflare.com"},
                  {id:"siliconflow", name:"SiliconFlow", free:true, keyPlaceholder:"sk-...", keyUrl:"https://cloud.siliconflow.cn"},
                  {id:"huggingface", name:"Hugging Face", free:true, keyPlaceholder:"hf_...", keyUrl:"https://huggingface.co/settings/tokens"},
                  {id:"github", name:"GitHub Models", free:true, keyPlaceholder:"ghp_...", keyUrl:"https://github.com/settings/tokens"},
                  {id:"openai", name:"OpenAI", free:false, keyPlaceholder:"sk-..."},
                  {id:"anthropic", name:"Anthropic", free:false, keyPlaceholder:"sk-ant-..."},
                  {id:"cohere", name:"Cohere", free:false, keyPlaceholder:"..."},
                  {id:"mistral_ai", name:"Mistral AI", free:false, keyPlaceholder:"..."},
                  {id:"openrouter", name:"OpenRouter", free:false, keyPlaceholder:"sk-or-..."},
                ].map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                        {p.name} {p.free && <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-semibold">FREE</span>}
                      </label>
                      <input type="password" value={sv("ai_providers", p.id + "_key", "")}
                        placeholder={p.keyPlaceholder || "API key..."}
                        onChange={e => saveConfig("ai_providers", p.id + "_key", e.target.value)}
                        className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-white outline-none focus:border-primary/30 mt-1" />
                    </div>
                    {p.keyUrl && (
                      <a href={p.keyUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 mt-4 text-[10px] text-primary/70 hover:text-primary">Get key</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* License */}
          <TabsContent value="license" className="space-y-4 mt-6">
            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.07] p-6">
              <h3 className="text-base font-semibold text-white mb-4">License Key</h3>
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">License Key</label>
                  <input type="password" value={licenseKey} onChange={e => setLicenseKey(e.target.value)} placeholder="Enter your license key"
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-primary/30" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={async () => {
                    setSaving(true);
                    try {
                      const r = await api.post("/global-config/license", { key: licenseKey });
                      flash(r.data.valid ? "License valid!" : "Invalid key");
                    } catch { flash("Failed", false); }
                    setSaving(false);
                  }} disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)] disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Verify License
                  </button>
                  {sv("license", "valid", false) && <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Active</span>}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
