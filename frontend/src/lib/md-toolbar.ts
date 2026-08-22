"use client";

// WordPress classic-editor style toolbar that wraps markdown around the
// selection inside a <textarea>. No deps (native range/replaceText).

export function applyMd(
  ref: HTMLTextAreaElement | null,
  kind: string,
  state: { onWrap: () => void }
) {
  if (!ref) return;
  const s0 = ref.selectionStart ?? 0;
  const s1 = ref.selectionEnd ?? 0;
  const val = ref.value;
  const sel = val.slice(s0, s1);

  let before = "";
  let content = sel;
  let after = "";
  const empty = s0 === s1;

  switch (kind) {
    case "bold":
      before = "**"; after = "**";
      if (empty) content = "bold text";
      break;
    case "italic":
      before = "*"; after = "*";
      if (empty) content = "italic text";
      break;
    case "strike":
      before = "~~"; after = "~~";
      if (empty) content = "strikethrough";
      break;
    case "h2":
      before = "\n## "; after = "";
      if (empty) content = "Heading 2";
      break;
    case "h3":
      before = "\n### "; after = "";
      if (empty) content = "Heading 3";
      break;
    case "quote":
      before = "\n> "; after = "";
      if (empty) content = "blockquote";
      break;
    case "ul":
      before = "\n- "; after = "";
      if (empty) content = "list item";
      break;
    case "ol":
      before = "\n1. "; after = "";
      if (empty) content = "list item";
      break;
    case "code":
      before = "`"; after = "`";
      if (empty) content = "code";
      break;
    case "link":
      before = "["; content = sel || "link text"; after = "](https://)";
      break;
    case "hr":
      before = "\n---\n"; after = "";
      content = "";
      break;
    default:
      return;
  }

  const next = val.slice(0, s0) + before + content + after + val.slice(s1);
  ref.value = next;
  const newPos = s0 + before.length + content.length;
  ref.focus();
  try {
    ref.setSelectionRange(newPos, newPos);
  } catch {
    /* noop */
  }
  state.onWrap();
}

// Convert markdown body to plain-text-safe excerpt (no HTML).
export function excerptFrom(md: string, n = 160): string {
  const text = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > n ? text.slice(0, n).trimEnd() + "…" : text;
}