import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { adminApi, detail } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Admin() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    (async () => {
      try {
        const [o, u] = await Promise.all([adminApi.overview(), adminApi.users(1)]);
        setOverview(o.data as Record<string, unknown>);
        setUsers((u.data as any)?.items ?? (Array.isArray(u.data) ? u.data : []));
      } catch (err) { setError(detail(err)); }
    })();
  }, [user]);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>Admin</h1></header>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <pre className="card max-h-60 overflow-auto p-4 text-xs text-muted-foreground">{overview ? JSON.stringify(overview, null, 2) : "Loading…"}</pre>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>ID</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email ?? "—"}</td>
                <td>{u.role ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}