import { useEffect, useState } from "react";
import { analyticsApi, detail } from "../lib/api";

export default function Analytics() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try { setData((await analyticsApi.overview()).data as Record<string, unknown>); }
      catch (err) { setError(detail(err)); }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>Analytics</h1></header>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <pre className="card max-h-[70vh] overflow-auto p-4 text-xs text-muted-foreground">
        {data ? JSON.stringify(data, null, 2) : "Loading…"}
      </pre>
    </div>
  );
}