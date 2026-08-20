import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { modulesApi, detail } from "../lib/api";
import type { ModuleRecord } from "../types";

export default function ModulesGrid() {
  const [categories, setCategories] = useState<string[]>([]);
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await modulesApi.list();
        if (!cancelled) {
          setCategories(r.data.categories);
          setModules(r.data.modules);
        }
      } catch (err) { setError(detail(err)); }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
      <header>
        <h1>Modules</h1>
        <p className="text-muted-foreground">{modules.length} available tools.</p>
      </header>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {categories.map((cat) => {
        const grouped = modules.filter((m) => m.category === cat);
        if (grouped.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="mb-3 capitalize text-muted-foreground">{cat}</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {grouped.map((m) => (
                <Link key={m.id} to={`/modules/${m.id}`} className="card p-4 transition-colors hover:bg-primary/10">
                  <div className="font-medium text-primary">{m.name}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.description}</div>
                  <div className="mt-2 text-[10px] uppercase text-muted-foreground">{m.tier}</div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}