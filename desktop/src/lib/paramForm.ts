export type FieldKind = "text" | "number" | "checkbox" | "json";
export interface FormField { key: string; kind: FieldKind; }

export function fieldList(defaults: Record<string, unknown>): FormField[] {
  return Object.entries(defaults).map(([key, value]) => {
    let kind: FieldKind = "text";
    if (typeof value === "number") kind = "number";
    else if (typeof value === "boolean") kind = "checkbox";
    else if (value !== null && typeof value === "object") kind = "json";
    return { key, kind };
  });
}

export function toParamValue(kind: FieldKind, raw: string | boolean | null): unknown {
  if (kind === "checkbox") return raw === true || raw === "true";
  if (kind === "number") return raw === "" || raw === null ? null : Number(raw);
  if (kind === "json") {
    if (typeof raw !== "string") return raw ?? "";
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw ?? "";
}