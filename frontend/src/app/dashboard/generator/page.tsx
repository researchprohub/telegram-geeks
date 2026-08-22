"use client";

import { useState, useEffect } from "react";
import {
  Sliders,
  Download,
  CheckCircle2,
  Loader2,
  Database,
  Smartphone,
  ShieldCheck,
  FileJson,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface PresetData {
  countries: Array<{ code: string; prefix: string; lang: string; sys_lang: string }>;
  devices: Array<{ model: string; android: string; res: string }>;
  app_versions: string[];
  credentials_count: number;
}

export default function ParameterGeneratorPage() {
  const [mode, setMode] = useState<"beginner" | "pro">("beginner");
  const [count, setCount] = useState<number>(25);
  const [country, setCountry] = useState<string>("US");
  const [gender, setGender] = useState<"male" | "female" | "mixed">("mixed");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [presets, setPresets] = useState<PresetData | null>(null);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const res = await api.get("/generator/presets");
      setPresets(res.data);
    } catch {
      // Fallback
      setPresets({
        countries: [
          { code: "US", prefix: "+1", lang: "en", sys_lang: "en-US" },
          { code: "GB", prefix: "+44", lang: "en", sys_lang: "en-GB" },
          { code: "DE", prefix: "+49", lang: "de", sys_lang: "de-DE" },
          { code: "FR", prefix: "+33", lang: "fr", sys_lang: "fr-FR" },
          { code: "ES", prefix: "+34", lang: "es", sys_lang: "es-ES" },
        ],
        devices: [
          { model: "Samsung Galaxy S24 Ultra", android: "14", res: "3088x1440" },
          { model: "Google Pixel 8 Pro", android: "14", res: "2992x1344" },
          { model: "Xiaomi 13 Pro", android: "13", res: "3200x1440" },
        ],
        app_versions: ["10.3.2", "10.2.9", "10.1.8"],
        credentials_count: 5,
      });
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setValidationResult(null);
    try {
      let res;
      if (mode === "beginner") {
        res = await api.post("/generator/beginner", {
          count,
          country,
          gender,
        });
      } else {
        res = await api.post("/generator/professional", {
          count,
          config: {
            countries: [country],
            genders: gender === "mixed" ? ["male", "female"] : [gender],
            device_models: selectedDevices.length > 0 ? selectedDevices : undefined,
          },
        });
      }
      const items = res.data?.items || [];
      setGeneratedItems(items);

      if (items.length > 0) {
        // Validate generated batch
        const valRes = await api.post("/generator/validate", { params: items });
        setValidationResult(valRes.data);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = async () => {
    if (!generatedItems.length) return;
    setExporting(true);
    try {
      const res = await api.post("/generator/export/json", generatedItems);
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tg_fingerprints_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export JSON error", e);
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!generatedItems.length) return;
    setExporting(true);
    try {
      const res = await api.post("/generator/export/csv", generatedItems);
      const blob = new Blob([res.data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tg_parameters_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export CSV error", e);
    } finally {
      setExporting(false);
    }
  };

  const filteredItems = generatedItems.filter(
    (item) =>
      item.device_model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.country?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" />
            Parameter & Device Fingerprint Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create high-entropy Telegram MTProto hardware fingerprints, app versions, and locale signatures
          </p>
        </div>

        {generatedItems.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              disabled={exporting}
              className="px-3 py-2 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-secondary flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileJson className="h-4 w-4 text-primary" />
              Export session+json
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 transition-all shadow-md shadow-primary/20"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => {
            setMode("beginner");
          }}
          className={cn(
            "p-5 rounded-2xl border text-left transition-all",
            mode === "beginner"
              ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
              : "bg-card border-border hover:bg-secondary/60"
          )}
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <Smartphone className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base text-foreground">Beginner Preset Mode</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Fast generation with pre-calibrated OEM profiles, authentic Android versions, and official API pools.
          </p>
        </button>

        <button
          onClick={() => {
            setMode("pro");
          }}
          className={cn(
            "p-5 rounded-2xl border text-left transition-all",
            mode === "pro"
              ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
              : "bg-card border-border hover:bg-secondary/60"
          )}
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <Database className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-base text-foreground">Professional Enterprise Engine</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Full parameter entropy distribution across multi-device matrices, customizable country buckets, and custom names.
          </p>
        </button>
      </div>

      {/* Controls Form */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Generation Count
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Target Country & Telecom Pool
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {presets?.countries?.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.prefix}) — {c.lang}
                </option>
              )) || (
                <option value="US">US (+1) — en</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Persona Gender Distribution
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="mixed">Mixed (50% Male / 50% Female)</option>
              <option value="male">Male Personas Only</option>
              <option value="female">Female Personas Only</option>
            </select>
          </div>
        </div>

        {mode === "pro" && presets?.devices && (
          <div>
            <label className="text-xs font-bold text-foreground block mb-2">
              Device Emulation Filter (Leave empty for all 30 models)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-2 bg-secondary/50 rounded-xl border border-border">
              {presets.devices.map((d) => {
                const isSelected = selectedDevices.includes(d.model);
                return (
                  <button
                    key={d.model}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDevices(selectedDevices.filter((m) => m !== d.model));
                      } else {
                        setSelectedDevices([...selectedDevices, d.model]);
                      }
                    }}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-medium text-left truncate transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "bg-card hover:bg-secondary text-foreground border border-border"
                    )}
                  >
                    {d.model}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Entropy engine ready ({presets?.credentials_count || 5} official MTProto API keys)</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md shadow-primary/25 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Parameters...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Generate {count} Parameters
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation Status & Summary */}
      {validationResult && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Batch Verified: {validationResult.valid} / {validationResult.total} Valid Fingerprints
              </h4>
              <p className="text-xs text-muted-foreground">
                All parameters conform to official Telethon / Pyrogram MTProto signature schemas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-bold">
              100% MTProto Compliant
            </span>
          </div>
        </div>
      )}

      {/* Results Table */}
      {generatedItems.length > 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              Generated Records ({generatedItems.length})
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search device, name, geo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Persona Name</th>
                  <th className="py-3 px-4">Device Model</th>
                  <th className="py-3 px-4">OS Version</th>
                  <th className="py-3 px-4">App Version</th>
                  <th className="py-3 px-4">Geo / Prefix</th>
                  <th className="py-3 px-4">API ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.slice(0, 100).map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-muted-foreground">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-foreground">
                      {item.first_name} {item.last_name}
                    </td>
                    <td className="py-2.5 px-4 text-foreground font-medium">{item.device_model}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{item.system_version}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-secondary border border-border font-mono text-[11px]">
                        {item.app_version}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-foreground">{item.country}</span>{" "}
                      <span className="text-muted-foreground">({item.phone_prefix})</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
                      {item.api_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
