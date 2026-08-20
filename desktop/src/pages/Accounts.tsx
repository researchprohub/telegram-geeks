import { FormEvent, useEffect, useState } from "react";
import { accountsApi, detail } from "../lib/api";

interface Row {
  id: number;
  phone_number?: string;
  username?: string;
  status?: string;
  [k: string]: unknown;
}

function extractItems(data: any): Row[] {
  const raw = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
  return (Array.isArray(raw) ? raw : []).filter((i: any) => i && typeof i === "object");
}

export default function Accounts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const r = await accountsApi.list(1);
      setRows(extractItems(r.data));
    } catch (err) { setError(detail(err)); }
  };

  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await accountsApi.create({ phone_number: phone, status: "active" });
      setPhone("");
      await load();
    } catch (err) { setError(detail(err)); }
    finally { setBusy(false); }
  };

  const act = async (id: number, fn: (id: number) => Promise<unknown>) => {
    setError("");
    try { await fn(id); await load(); }
    catch (err) { setError(detail(err)); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
      <header>
        <h1>Accounts</h1>
        <p className="text-muted-foreground">Session accounts on the embedded backend.</p>
      </header>
      <form className="card flex gap-2 p-4" onSubmit={create}>
        <input className="input" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <button className="btn-primary shrink-0" disabled={busy}>Add account</button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>ID</th><th>Phone</th><th>Username</th><th>Status</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.phone_number ?? "—"}</td>
                <td>{r.username ?? "—"}</td>
                <td>{r.status ?? "—"}</td>
                <td className="text-right">
                  <div className="inline-flex gap-1">
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, accountsApi.health)}>Health</button>
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, accountsApi.warmup)}>Warmup</button>
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, accountsApi.suspend)}>Suspend</button>
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, accountsApi.unsuspend)}>Unsuspend</button>
                    <button className="btn-destructive !px-2 !py-1 text-xs" onClick={() => act(r.id, accountsApi.delete)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No accounts yet. Add your first one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}