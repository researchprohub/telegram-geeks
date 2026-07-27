"use client";

import { useState, useEffect } from "react";
import { Settings2, ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle, RefreshCw, Globe, Timer, Shield, Database, Brain, Wifi } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function AdvancedSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    Promise.allSettled([
      api.get("/global-config"),
      api.get("/admin/settings"),
    ]).then(([cfg]) => {
      if (cfg.status === "fulfilled") setConfig(cfg.value.data || {});
    }).finally(() => setLoading(false));
  }, []);

  function flash(text: string, ok = true) { setMsg({ text, ok }); setTimeout(() => setMsg({ text: "", ok: false }), 3000); }
  function sv(section: string, key: string, d: any = "") { return config[section]?.[key] ?? d; }
  function update(section: string, key: string, value: any) { setConfig((prev: any) => ({ ...prev, [section]: { ...(prev[section] || {}), [key]: value } })); }

  async function saveConfig(section: string, key?: string, value?: any) {
    setSaving(true);
    try {
      if (key !== undefined) await api.put("/global-config", { section, key, value });
      else await api.put("/global-config/section", { section, data: config[section] });
      flash("Saved");
    } catch { flash("Failed", false); }
    setSaving(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/settings")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Settings2 className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Advanced Settings</h1><p className="text-xs text-muted-foreground">System configuration and tuning</p></div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-3xl">
        {msg.text && (
          <div className={`rounded-lg p-3 flex items-center gap-2 text-sm ${msg.ok ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"}`}>
            <CheckCircle2 className="h-4 w-4 shrink-0" />{msg.text}
          </div>
        )}

        {/* Proxy Advanced */}
        <Section icon={Wifi} title="Proxy Advanced" config={config} section="proxy_advanced" update={update} save={saveConfig} saving={saving} fields={[
          { key: "max_retries", label: "Max Retries", type: "number" },
          { key: "rotation_interval", label: "Rotation Interval (min)", type: "number" },
          { key: "check_before_use", label: "Check Before Use", type: "boolean" },
          { key: "ban_threshold", label: "Ban Threshold (failures)", type: "number" },
        ]} />

        {/* Delay Tuning */}
        <Section icon={Timer} title="Delay Tuning" config={config} section="delay_tuning" update={update} save={saveConfig} saving={saving} fields={[
          { key: "action_delay_min", label: "Action Min Delay (s)", type: "number" },
          { key: "action_delay_max", label: "Action Max Delay (s)", type: "number" },
          { key: "typing_speed_min", label: "Typing Speed Min (chars/s)", type: "number" },
          { key: "typing_speed_max", label: "Typing Speed Max (chars/s)", type: "number" },
          { key: "error_cooldown", label: "Error Cooldown (s)", type: "number" },
        ]} />

        {/* Flood Protection */}
        <Section icon={Shield} title="Flood Protection" config={config} section="flood_protection" update={update} save={saveConfig} saving={saving} fields={[
          { key: "enabled", label: "Enabled", type: "boolean" },
          { key: "max_actions_per_minute", label: "Max Actions/Min", type: "number" },
          { key: "cooldown_multiplier", label: "Cooldown Multiplier", type: "number" },
          { key: "auto_pause_on_flood", label: "Auto Pause on Flood", type: "boolean" },
        ]} />

        {/* Database */}
        <Section icon={Database} title="Database" config={config} section="database" update={update} save={saveConfig} saving={saving} fields={[
          { key: "connection_pool", label: "Connection Pool Size", type: "number" },
          { key: "timeout", label: "Query Timeout (s)", type: "number" },
          { key: "auto_backup_interval", label: "Auto Backup Interval (h)", type: "number" },
          { key: "max_storage_mb", label: "Max Storage (MB)", type: "number" },
        ]} />

        {/* AI Tuning */}
        <Section icon={Brain} title="AI Tuning" config={config} section="ai_tuning" update={update} save={saveConfig} saving={saving} fields={[
          { key: "temperature", label: "Temperature (0-2)", type: "number" },
          { key: "max_tokens", label: "Max Tokens", type: "number" },
          { key: "context_window", label: "Context Window", type: "number" },
          { key: "retry_on_failure", label: "Retry on Failure", type: "boolean" },
        ]} />
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, config, section, update, save, saving, fields }: {
  icon: any; title: string; config: any; section: string; update: any; save: any; saving: boolean; fields: { key: string; label: string; type: string }[];
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" /> {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
            {f.type === "boolean" ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={!!(config[section]?.[f.key])} onChange={e => update(section, f.key, e.target.checked)} />
                <div className="w-9 h-5 bg-secondary rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            ) : (
              <input type={f.type} value={config[section]?.[f.key] ?? ""} onChange={e => update(section, f.key, f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            )}
          </div>
        ))}
      </div>
      <button onClick={() => save(section)} disabled={saving}
        className="mt-3 inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition disabled:opacity-50">
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
      </button>
    </div>
  );
}
