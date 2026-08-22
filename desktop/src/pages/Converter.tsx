import { useState } from "react";
import { modulesApi, detail } from "../lib/api";
import {
  RefreshCw,
  FolderSync,
  Copy,
  FileCode,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Layers,
  Sparkles,
  ArrowRightLeft,
  Check,
} from "lucide-react";

export default function Converter() {
  const [activeTab, setActiveTab] = useState<"converter" | "duplicator" | "params" | "fingerprint">("converter");
  const [direction, setDirection] = useState<"session_to_tdata" | "tdata_to_session">("session_to_tdata");

  // Form State - Converter
  const [sessionInput, setSessionInput] = useState("");
  const [outputDir, setOutputDir] = useState("C:\\TelegramGeeks\\converted_tdata");
  const [phone, setPhone] = useState("");
  const [apiPreset, setApiPreset] = useState("tdesktop_win");
  const [customApiId, setCustomApiId] = useState("2040");
  const [customApiHash, setCustomApiHash] = useState("b18441a1ff607e10a989891a5462e627");

  // Form State - Duplicator
  const [sourceSession, setSourceSession] = useState("");
  const [duplicateCount, setDuplicateCount] = useState(3);
  const [randomizeDevice, setRandomizeDevice] = useState(true);

  // Form State - Params Generator
  const [deviceCount, setDeviceCount] = useState(10);
  const [targetPlatform, setTargetPlatform] = useState("android");

  // Results & Logs
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const PRESETS: Record<string, { api_id: string; api_hash: string; name: string; platform: string }> = {
    tdesktop_win: { api_id: "2040", api_hash: "b18441a1ff607e10a989891a5462e627", name: "Telegram Desktop (Windows x64)", platform: "Windows" },
    android_official: { api_id: "6", api_hash: "eb06d4abfb49dc3eeb1aeb98ae0f581e", name: "Telegram Android Official", platform: "Android" },
    ios_official: { api_id: "10840", api_hash: "b18441a1ff607e10a989891a5462e627", name: "Telegram iOS Official", platform: "iOS" },
    macos_official: { api_id: "2834", api_hash: "68875f756c9b437a8b916ca3de215815", name: "Telegram macOS Native", platform: "macOS" },
    webz: { api_id: "2496", api_hash: "8da85b0d5b1650521489a5f8260bc3c5", name: "Telegram WebZ / WebK", platform: "Web" },
  };

  const handlePresetChange = (key: string) => {
    setApiPreset(key);
    if (PRESETS[key]) {
      setCustomApiId(PRESETS[key].api_id);
      setCustomApiHash(PRESETS[key].api_hash);
    }
  };

  const handleRunConverter = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccessMsg("");
    setResult(null);

    try {
      if (direction === "session_to_tdata") {
        const res = await modulesApi.execute("converter", "convert_to_tdata", {
          session_string: sessionInput,
          output_dir: outputDir,
          phone_number: phone,
          api_id: Number(customApiId) || 2040,
          api_hash: customApiHash,
          device_model: PRESETS[apiPreset]?.name || "Desktop",
          app_version: "5.4.1 x64",
        });
        setResult(res.data);
        setSuccessMsg("Successfully converted session to Telegram Desktop TData folder!");
      } else {
        const res = await modulesApi.execute("two_way_converter", "tdata_to_session", {
          tdata_path: sessionInput,
          api_id: Number(customApiId) || 2040,
          api_hash: customApiHash,
        });
        setResult(res.data);
        setSuccessMsg("Successfully converted TData folder to SQLite Telethon session!");
      }
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRunDuplicator = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccessMsg("");
    setResult(null);

    try {
      const res = await modulesApi.execute("duplicator", "duplicate_session", {
        session_id: sourceSession,
        count: duplicateCount,
        randomize_device: randomizeDevice,
      });
      setResult(res.data);
      setSuccessMsg(`Successfully generated ${duplicateCount} duplicated sessions with unique device fingerprints!`);
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRunParamsGenerator = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccessMsg("");
    setResult(null);

    try {
      const res = await modulesApi.execute("json_generator", "generate_json_params", {
        count: deviceCount,
        platform: targetPlatform,
      });
      setResult(res.data);
      setSuccessMsg(`Generated ${deviceCount} valid device JSON parameter pairs!`);
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <RefreshCw className="h-6 w-6 text-primary" />
            Session & Format Converter Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bidirectional Telethon/Pyrogram SQLite ⇄ Telegram Desktop TData converter, session duplicator & JSON generator.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("converter")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "converter"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Two-Way Converter (Session ⇄ TData)</span>
        </button>

        <button
          onClick={() => setActiveTab("duplicator")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "duplicator"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <Copy className="h-4 w-4" />
          <span>Session Duplicator</span>
        </button>

        <button
          onClick={() => setActiveTab("params")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "params"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <FileCode className="h-4 w-4" />
          <span>JSON Parameter Generator</span>
        </button>
      </div>

      {/* TAB 1: Two-Way Converter */}
      {activeTab === "converter" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleRunConverter} className="lg:col-span-2 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Conversion Direction</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDirection("session_to_tdata")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    direction === "session_to_tdata"
                      ? "bg-primary text-black border-primary font-bold shadow-sm"
                      : "bg-background/50 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Session ➔ TData
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("tdata_to_session")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    direction === "tdata_to_session"
                      ? "bg-primary text-black border-primary font-bold shadow-sm"
                      : "bg-background/50 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  TData ➔ Session
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  {direction === "session_to_tdata" ? "Pyrogram / Telethon Session String or File Path" : "Path to Telegram Desktop TData Folder"}
                </label>
                <textarea
                  rows={3}
                  value={sessionInput}
                  onChange={(e) => setSessionInput(e.target.value)}
                  placeholder={direction === "session_to_tdata" ? "Paste 1BVtsOI... string or path to session.sqlite" : "C:\\Users\\User\\Downloads\\tdata"}
                  required
                  className="w-full rounded-xl border border-border bg-background/80 p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Associated Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Output Directory</label>
                  <input
                    type="text"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* API ID / Hash Preset */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Official Client API Preset</label>
                <select
                  value={apiPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {Object.entries(PRESETS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name} (API ID: {v.api_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">API ID</label>
                  <input
                    type="text"
                    value={customApiId}
                    onChange={(e) => setCustomApiId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">API Hash</label>
                  <input
                    type="text"
                    value={customApiHash}
                    onChange={(e) => setCustomApiHash(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                <span>{busy ? "Converting Format…" : "Execute Conversion"}</span>
              </button>
            </div>
          </form>

          {/* Info Card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card/30 p-5 backdrop-blur-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Format Compatibility Matrix</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Telegram Geeks uses a custom high-performance MTProto binary unpacker compatible with all Telegram Desktop v4.x and v5.x key formats.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground pt-1">
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  <span>Pyrogram SQLite Sessions</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  <span>Telethon SQLite Sessions</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  <span>Telegram Desktop `tdata` (key_datas, D872...)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  <span>Session + JSON Pairs</span>
                </li>
              </ul>
            </div>

            {result && (
              <div className="rounded-2xl border border-border bg-card/30 p-4 space-y-2">
                <div className="text-xs font-bold text-foreground">Conversion Output</div>
                <pre className="p-3 rounded-xl bg-background/80 font-mono text-[11px] text-muted-foreground overflow-auto max-h-48">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Session Duplicator */}
      {activeTab === "duplicator" && (
        <form onSubmit={handleRunDuplicator} className="max-w-2xl rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md space-y-5">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1">Session Duplicator & Fingerprint Cloner</h3>
            <p className="text-xs text-muted-foreground">Clone authorization keys while randomizing device signatures to bypass suspicious IP association.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Source Session String or ID</label>
              <input
                type="text"
                value={sourceSession}
                onChange={(e) => setSourceSession(e.target.value)}
                placeholder="1BVtsOI... or Account ID"
                required
                className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Duplicate Instances Count</label>
              <input
                type="number"
                min={1}
                max={20}
                value={duplicateCount}
                onChange={(e) => setDuplicateCount(Number(e.target.value) || 1)}
                className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="randDev"
                checked={randomizeDevice}
                onChange={(e) => setRandomizeDevice(e.target.checked)}
                className="h-4 w-4 accent-primary rounded"
              />
              <label htmlFor="randDev" className="text-xs text-foreground">
                Automatically generate fresh device models (Samsung, Xiaomi, iPhone) and app version headers.
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              <span>{busy ? "Cloning Sessions…" : "Duplicate Sessions"}</span>
            </button>
          </div>

          {result && (
            <div className="pt-4 border-t border-border">
              <div className="text-xs font-bold text-foreground mb-2">Cloned Sessions Result</div>
              <pre className="p-3 rounded-xl bg-background/80 font-mono text-[11px] text-muted-foreground overflow-auto max-h-48">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </form>
      )}

      {/* TAB 3: JSON Parameter Generator */}
      {activeTab === "params" && (
        <form onSubmit={handleRunParamsGenerator} className="max-w-2xl rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md space-y-5">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1">JSON Parameter Generator</h3>
            <p className="text-xs text-muted-foreground">Bulk generate official Telegram client fingerprint JSON files for session pools.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target Platform</label>
                <select
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="android">Android (Samsung, Xiaomi, Pixel)</option>
                  <option value="ios">iOS (iPhone 14/15 Pro Max)</option>
                  <option value="windows">Windows 10/11 Desktop</option>
                  <option value="macos">macOS Sonoma / Ventura</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Number of Profiles</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={deviceCount}
                  onChange={(e) => setDeviceCount(Number(e.target.value) || 1)}
                  className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <FileCode className="h-4 w-4" />
              <span>{busy ? "Generating…" : "Generate JSON Params"}</span>
            </button>
          </div>

          {result && (
            <div className="pt-4 border-t border-border">
              <div className="text-xs font-bold text-foreground mb-2">Generated Profiles</div>
              <pre className="p-3 rounded-xl bg-background/80 font-mono text-[11px] text-muted-foreground overflow-auto max-h-56">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </form>
      )}
    </div>
  );
}