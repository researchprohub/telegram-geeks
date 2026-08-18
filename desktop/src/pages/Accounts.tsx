import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export default function Accounts() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/accounts")
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <ul>
      {data.map(a => <li key={a.id}>{a.name ?? a.id}</li>)}
    </ul>
  );
}
