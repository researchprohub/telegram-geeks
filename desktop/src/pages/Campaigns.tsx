import { FormEvent, useEffect, useState } from "react";
import { campaignsApi, detail } from "../lib/api";

function items(data: any): any[] {
  const raw = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
  return (Array.isArray(raw) ? raw : []).filter((i: any) => i && typeof i === "object");
}

export default function Campaigns() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => { try { setRows(items((await campaignsApi.list(1)).data)); } catch (err) { setError(detail(err)); } };
  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await campaignsApi.create({ name, status: "draft" }); setName(""); await load(); }
    catch (err) { setError(detail(err)); } finally { setBusy(false); }
  };

  const act = async (id: number, fn: (id: number) => Promise<unknown>) => {
    setError("");
    try { await fn(id); await load(); } catch (err) { setError(detail(err)); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>Campaigns</h1></header>
      <form className="card flex gap-2 p-4" onSubmit={create}>
        <input className="input" placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="btn-primary shrink-0" disabled={busy}>Create</button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>ID</th><th>Name</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name ?? "—"}</td>
                <td>{r.status ?? "—"}</td>
                <td className="text-right">
                  <div className="inline-flex gap-1">
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, campaignsApi.start)}>Start</button>
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, campaignsApi.pause)}>Pause</button>
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, campaignsApi.stop)}>Stop</button>
                    <button className="btn-destructive !px-2 !py-1 text-xs" onClick={() => act(r.id, campaignsApi.delete)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No campaigns.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}