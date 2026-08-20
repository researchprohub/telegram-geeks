import { useEffect, useState } from "react";
import { settingsApi, detail } from "../lib/api";

export default function Settings() {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError("");
    try { setRaw(JSON.stringify((await settingsApi.get()).data, null, 2)); }
    catch (err) { setError(detail(err)); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true); setError(""); setSaved(false);
    try {
      await settingsApi.update(JSON.parse(raw));
      setSaved(true);
    } catch (err) { setError(detail(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-6">
      <header><h1>Settings</h1></header>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {saved && <p className="text-xs text-success">Saved.</p>}
      <textarea className="input min-h-96 font-mono" value={raw} onChange={(e) => setRaw(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn-secondary" onClick={load}>Reload</button>
        <button className="btn-primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}