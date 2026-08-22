import { useEffect, useState } from "react";
import { settingsApi, detail } from "../lib/api";
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Cpu,
  Shield,
  CreditCard,
  Code2,
  CheckCircle2,
  Sliders,
} from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Tabs: 'general' | 'telegram' | 'ai' | 'crypto' | 'raw'
  const [tab, setTab] = useState<"general" | "telegram" | "ai" | "crypto" | "raw">("general");

  // Form Fields
  const [platformName, setPlatformName] = useState("TelegramGeeks Pro");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  // Pricing
  const [starterMonthly, setStarterMonthly] = useState(29);
  const [proMonthly, setProMonthly] = useState(79);
  const [agencyMonthly, setAgencyMonthly] = useState(199);

  // AI Settings
  const [defaultAiProvider, setDefaultAiProvider] = useState("openai");
  const [openaiKey, setOpenaiKey] = useState("");
  const [deepseekKey, setDeepseekKey] = useState("");
  const [aiTemperature, setAiTemperature] = useState(0.7);

  // Telegram MTProto
  const [defaultApiId, setDefaultApiId] = useState("2040");
  const [defaultApiHash, setDefaultApiHash] = useState("b18441a1ff607e10a989891a5462e627");
  const [floodWaitMax, setFloodWaitMax] = useState(300);

  // Raw JSON
  const [rawJson, setRawJson] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await settingsApi.get();
      const data: any = res.data || {};
      setRawJson(JSON.stringify(data, null, 2));

      if (data.platform_name !== undefined) setPlatformName(data.platform_name);
      if (data.maintenance_mode !== undefined) setMaintenanceMode(Boolean(data.maintenance_mode));
      if (data.registration_enabled !== undefined) setRegistrationEnabled(Boolean(data.registration_enabled));

      if (data.starter_price_monthly !== undefined) setStarterMonthly(data.starter_price_monthly);
      if (data.pro_price_monthly !== undefined) setProMonthly(data.pro_price_monthly);
      if (data.agency_price_monthly !== undefined) setAgencyMonthly(data.agency_price_monthly);

      if (data.default_ai_provider !== undefined) setDefaultAiProvider(data.default_ai_provider);
      if (data.openai_api_key !== undefined) setOpenaiKey(data.openai_api_key);
      if (data.deepseek_api_key !== undefined) setDeepseekKey(data.deepseek_api_key);
      if (data.ai_temperature !== undefined) setAiTemperature(data.ai_temperature);

      if (data.default_api_id !== undefined) setDefaultApiId(String(data.default_api_id));
      if (data.default_api_hash !== undefined) setDefaultApiHash(data.default_api_hash);
      if (data.flood_wait_max !== undefined) setFloodWaitMax(Number(data.flood_wait_max));
    } catch (err) {
      setError(detail(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaveStructured = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);

    let baseObj = {};
    try {
      baseObj = JSON.parse(rawJson || "{}");
    } catch {}

    const payload = {
      ...baseObj,
      platform_name: platformName,
      maintenance_mode: maintenanceMode,
      registration_enabled: registrationEnabled,
      starter_price_monthly: starterMonthly,
      pro_price_monthly: proMonthly,
      agency_price_monthly: agencyMonthly,
      default_ai_provider: defaultAiProvider,
      openai_api_key: openaiKey,
      deepseek_api_key: deepseekKey,
      ai_temperature: aiTemperature,
      default_api_id: defaultApiId,
      default_api_hash: defaultApiHash,
      flood_wait_max: floodWaitMax,
    };

    try {
      await settingsApi.update(payload);
      setRawJson(JSON.stringify(payload, null, 2));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveRaw = async () => {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const parsed = JSON.parse(rawJson);
      await settingsApi.update(parsed);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await load();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            System & Engine Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure MTProto parameters, AI LLM routing, platform defaults, and pricing.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Reload
        </button>
      </header>

      {error && <div className="card border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
      {saved && (
        <div className="card border-primary/50 bg-primary/10 p-3 text-xs text-primary flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" />
          Settings saved successfully!
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setTab("general")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            tab === "general"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          General & Pricing
        </button>
        <button
          type="button"
          onClick={() => setTab("telegram")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            tab === "telegram"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          Telegram MTProto
        </button>
        <button
          type="button"
          onClick={() => setTab("ai")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            tab === "ai"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          AI & Neuro-Text
        </button>
        <button
          type="button"
          onClick={() => setTab("raw")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            tab === "raw"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          Raw JSON Editor
        </button>
      </div>

      {/* Tab: General */}
      {tab === "general" && (
        <form onSubmit={handleSaveStructured} className="card p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Platform Defaults</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Platform Name</label>
                <input
                  type="text"
                  className="input mt-1"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center gap-6 pt-5">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registrationEnabled}
                    onChange={(e) => setRegistrationEnabled(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>Allow User Registration</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>Maintenance Mode</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <h2 className="text-base font-semibold text-foreground">Subscription Pricing Rates (USD / Month)</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs text-muted-foreground">Starter Tier Price ($)</label>
                <input
                  type="number"
                  className="input mt-1"
                  value={starterMonthly}
                  onChange={(e) => setStarterMonthly(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Pro Tier Price ($)</label>
                <input
                  type="number"
                  className="input mt-1"
                  value={proMonthly}
                  onChange={(e) => setProMonthly(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Agency Tier Price ($)</label>
                <input
                  type="number"
                  className="input mt-1"
                  value={agencyMonthly}
                  onChange={(e) => setAgencyMonthly(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button type="submit" disabled={busy} className="btn-primary flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              {busy ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}

      {/* Tab: Telegram MTProto */}
      {tab === "telegram" && (
        <form onSubmit={handleSaveStructured} className="card p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Default Telegram App Credentials</h2>
            <p className="text-xs text-muted-foreground">
              These credentials are used when importing raw session files or registering new accounts.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Default API ID</label>
                <input
                  type="text"
                  className="input mt-1 font-mono"
                  value={defaultApiId}
                  onChange={(e) => setDefaultApiId(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Default API Hash</label>
                <input
                  type="text"
                  className="input mt-1 font-mono"
                  value={defaultApiHash}
                  onChange={(e) => setDefaultApiHash(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <h2 className="text-base font-semibold text-foreground">Anti-Ban & Flood Circuit Breaker</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Max Flood-Wait Threshold (Seconds)</label>
                <input
                  type="number"
                  className="input mt-1"
                  value={floodWaitMax}
                  onChange={(e) => setFloodWaitMax(Number(e.target.value))}
                />
                <span className="text-[11px] text-muted-foreground">
                  If an account encounters a flood wait greater than this value, it is automatically paused.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button type="submit" disabled={busy} className="btn-primary flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              {busy ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}

      {/* Tab: AI & Neuro-Text */}
      {tab === "ai" && (
        <form onSubmit={handleSaveStructured} className="card p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">AI Neuro-Text Engine & LLM Routing</h2>
            <p className="text-xs text-muted-foreground">
              Configure the AI provider powering dynamic spintax variations, persona dialogues, and context copywriting.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Primary AI Provider</label>
                <select
                  className="input mt-1"
                  value={defaultAiProvider}
                  onChange={(e) => setDefaultAiProvider(e.target.value)}
                >
                  <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                  <option value="deepseek">DeepSeek (V3 / R1)</option>
                  <option value="anthropic">Anthropic (Claude 3.5)</option>
                  <option value="none">Disabled / Local Heuristics</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Creativity / Temperature (0.0 - 1.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  className="input mt-1"
                  value={aiTemperature}
                  onChange={(e) => setAiTemperature(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">OpenAI API Key</label>
                <input
                  type="password"
                  className="input mt-1 font-mono"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">DeepSeek API Key</label>
                <input
                  type="password"
                  className="input mt-1 font-mono"
                  placeholder="sk-..."
                  value={deepseekKey}
                  onChange={(e) => setDeepseekKey(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button type="submit" disabled={busy} className="btn-primary flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              {busy ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}

      {/* Tab: Raw JSON */}
      {tab === "raw" && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Advanced Raw JSON Configuration</h2>
              <p className="text-xs text-muted-foreground">
                Directly edit the underlying database settings dictionary.
              </p>
            </div>
          </div>
          <textarea
            className="input min-h-96 font-mono text-xs"
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={load}>
              Reload
            </button>
            <button className="btn-primary" disabled={busy} onClick={handleSaveRaw}>
              {busy ? "Saving..." : "Save JSON"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
