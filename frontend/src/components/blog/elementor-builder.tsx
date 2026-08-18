"use client";

// Elementor-style Single Post template builder. Lets the writer pick which
// "widgets" appear on the public post page and reorder them. Persisted as a
// `template` JSON list of section keys on the post.

import { useState } from "react";
import { GripVertical, ArrowUp, ArrowDown, Eye, EyeOff, Plus } from "lucide-react";
import { SECTION_DEFS, DEFAULT_TEMPLATE } from "@/lib/template";

export { SECTION_DEFS, DEFAULT_TEMPLATE };

export default function ElementorBuilder({
  sections,
  onChange,
}: {
  sections: string[];
  onChange: (sections: string[]) => void;
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const keys = Object.keys(SECTION_DEFS);

  function toggleVisibility(key: string) {
    setHidden((h) => (h.includes(key) ? h.filter((k) => k !== key) : [...h, key]));
  }

  function add(key: string) {
    if (sections.includes(key)) return;
    onChange([...sections, key]);
  }

  function move(key: string, dir: -1 | 1) {
    const i = sections.indexOf(key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition";

  return (
    <div className="space-y-4">
      {/* Structured layout preview */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
        {sections.map((key, idx) =>
          SECTION_DEFS[key] ? (
            <div
              key={key}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 bg-card ${
                hidden.includes(key) ? "opacity-45 border-dashed" : "border-border"
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-none">
                  {SECTION_DEFS[key].label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {SECTION_DEFS[key].desc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => move(key, -1)}
                disabled={idx === 0}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 transition"
                title="Move up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(key, 1)}
                disabled={idx === sections.length - 1}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 transition"
                title="Move down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => toggleVisibility(key)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                title={hidden.includes(key) ? "Show" : "Hide"}
              >
                {hidden.includes(key) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          ) : null
        )}
        {sections.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">Add widgets to build the page layout.</p>
        )}
      </div>

      {/* Widget palette */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
          Add widget
        </p>
        {keys.filter((k) => !sections.includes(k)).length > 0 ? (
          <select className={inputCls} onChange={(e) => e.target.value && add(e.target.value)} value="">
            <option value="" disabled>
              Select a widget to add…
            </option>
            {keys
              .filter((k) => !sections.includes(k))
              .map((k) => (
                <option key={k} value={k}>
                  {SECTION_DEFS[k].label}
                </option>
              ))}
          </select>
        ) : (
          <div className="not-italic text-xs text-muted-foreground px-1 py-1.5">
            All widgets are already in the layout — use the eye icon to toggle any on/off.
          </div>
        )}
      </div>
    </div>
  );
}