import { useEffect, useState } from "react";
import { paymentsApi, detail } from "../lib/api";

function items(data: any): any[] {
  const raw = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
  return (Array.isArray(raw) ? raw : []).filter((i: any) => i && typeof i === "object");
}

export default function Billing() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try { setRows(items((await paymentsApi.history(1)).data)); }
      catch (err) { setError(detail(err)); }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>Billing</h1></header>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>ID</th><th>Status</th><th className="text-right">Details</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.status ?? "—"}</td>
                <td className="text-right text-xs text-muted-foreground">{Object.keys(r).filter((k) => !["id", "status"].includes(k)).slice(0, 3).join(", ")}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">No payments yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}