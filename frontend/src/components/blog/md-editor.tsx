"use client";

// WordPress-classic-style content editor: a toolbar that wraps markdown
// around the selection plus a live "Preview" tab rendered from markdown.

import { useRef, useState } from "react";
import { markdownToHtml } from "@/lib/markdown";
import { applyMd } from "@/lib/md-toolbar";
import { blogApi } from "@/lib/api";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, Quote,
  List, ListOrdered, Code, Link2, Minus, Eye, PenLine, Loader2, Image as ImageIcon,
} from "lucide-react";

const BTN: Record<string, { icon: any; title: string; label?: string; image?: boolean }> = {
  bold: { icon: Bold, title: "Bold" },
  italic: { icon: Italic, title: "Italic" },
  strike: { icon: Strikethrough, title: "Strikethrough" },
  h2: { icon: Heading2, title: "Heading 2" },
  h3: { icon: Heading3, title: "Heading 3" },
  quote: { icon: null, label: "Quote", title: "Blockquote" },
  ul: { icon: List, title: "Bulleted list" },
  ol: { icon: ListOrdered, title: "Numbered list" },
  code: { icon: null, label: "Code", title: "Inline code" },
  link: { icon: Link2, title: "Insert link" },
  hr: { icon: Minus, title: "Horizontal rule" },
  image: { icon: ImageIcon, title: "Insert image", image: true },
};

type ToolKey = keyof typeof BTN;

const ORDER: ToolKey[] = ["bold", "italic", "strike", "h2", "h3", "quote", "ul", "ol", "code", "link", "hr", "image"];

export default function MdEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<"text" | "preview">("text");
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploading, setUploading] = useState(false);

  function markdown() {
    const v = ref.current?.value ?? value;
    onChange(v);
  }

  async function uploadAndInsert(file: File) {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const res = await blogApi.uploadImage(file);
      const url = (res as any)?.data?.url;
      const ta = ref.current;
      const md = `\n\n![image](${url})\n\n`;
      if (ta) {
        const start = ta.selectionStart ?? value.length;
        const next = value.slice(0, start) + md + value.slice(start);
        onChange(next);
      } else {
        onChange(value + md);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadAndInsert(file);
  }

  function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadAndInsert(file);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = e.clipboardData?.files?.[0];
    if (file) {
      e.preventDefault();
      uploadAndInsert(file);
    }
  }

  function showPreview() {
    setPreviewHtml(markdownToHtml(value));
    setTab("preview");
  }

  const iconCls = "h-4 w-4";

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* WordPress-style top bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/40 border-b border-border">
        <div className="flex items-center gap-0.5">
          {tab === "text" ? (
            <div className="flex items-center gap-0.5 flex-wrap">
              {ORDER.map((t) => {
                const cfg = BTN[t];
                const Icon = cfg.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    title={cfg.title}
                    disabled={cfg.image && uploading}
                    onClick={() => (cfg.image ? fileRef.current?.click() : applyMd(ref.current, t, { onWrap: markdown }))}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition disabled:opacity-50"
                  >
                    {uploading && cfg.image ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className={iconCls} /> : <span className="text-[11px] font-bold">{cfg.label}</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">Preview</span>
          )}
        </div>

        {/* Visual / Text tabs à la WordPress */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab("text")}
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition ${
              tab === "text" ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PenLine className="h-3 w-3" /> Text
          </button>
          <button
            type="button"
            onClick={showPreview}
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition ${
              tab === "preview" ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="h-3 w-3" /> Preview
          </button>
        </div>
      </div>

      {tab === "text" ? (
        <>
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={handlePaste}
            rows={18}
            placeholder="Start writing your post…  •  Tip: paste or drop an image anywhere to upload it"
            className="w-full bg-card text-sm text-foreground leading-relaxed outline-none resize-y p-4 font-mono"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFile}
          />
        </>
      ) : (
        <div className="h-56 overflow-y-auto p-4 bg-card">
          {previewHtml ? (
            <div
              className="prose prose-sm prose-invert prose-headings:text-foreground prose-p:text-foreground/75 max-w-none !text-foreground/90"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing to preview yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}