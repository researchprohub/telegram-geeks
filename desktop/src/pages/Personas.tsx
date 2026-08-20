import { FormEvent, useEffect, useState } from "react";
import { personasApi, detail } from "../lib/api";

function items(data: any): any[] {
  const raw = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
  return (Array.isArray(raw) ? raw : []).filter((i: any) => i && typeof i === "object");
}

export default function Personas() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => { try { setRows(items((await personasApi.list(1)).data)); } catch (err) { setError(detail(err)); } };
  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await personasApi.create({ name }); setName(""); await load(); }
    catch (err) { setError(detail(err)); } finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    setError("");
    try { await personasApi.delete(id); await load(); } catch (err) { setError(detail(err)); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>AI Personas</h1></header>
      <form className="card flex gap-2 p-4" onSubmit={create}>
        <input className="input" placeholder="Persona name" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="btn-primary shrink-0" disabled={busy}>Create</button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>ID</th><th>Name</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name ?? "—"}</td>
                <td className="text-right"><button className="btn-destructive !px-2 !py-1 text-xs" onClick={() => remove(r.id)}>Delete</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">No personas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}