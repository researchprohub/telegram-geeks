// Enhanced, dependency-free Markdown to HTML parser for blog articles.
// Supports: Headings with auto IDs, code blocks with language labels,
// markdown images with captions, tables, alerts/callouts, lists, blockquotes,
// bold/italic, inline code, and links.

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-secondary/80 text-primary font-mono text-[13px] border border-border/60">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="italic text-foreground/90">$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      return `<figure class="my-8 rounded-2xl overflow-hidden border border-border bg-card/60 shadow-xl"><img src="${src}" alt="${alt || 'Illustration'}" class="w-full h-auto object-cover max-h-[480px]" loading="lazy" />${alt ? `<figcaption class="px-4 py-2.5 text-xs text-center text-muted-foreground bg-secondary/30 border-t border-border/50 font-medium">${alt}</figcaption>` : ''}</figure>`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary font-medium underline underline-offset-4 hover:text-cyan-300 transition-colors">$1</a>');
}

export function markdownToHtml(md: string): string {
  if (!md) return "";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let inCode = false;
  let codeLang = "";
  let codeBuf: string[] = [];
  let listBuf: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listBuf.length && listType) {
      const cls = listType === "ul" ? "list-disc pl-6 space-y-2 my-4 text-muted-foreground" : "list-decimal pl-6 space-y-2 my-4 text-muted-foreground";
      out.push(`<${listType} class="${cls}">${listBuf.map((li) => `<li class="leading-relaxed pl-1">${li}</li>`).join("")}</${listType}>`);
    }
    listBuf = [];
    listType = null;
  };

  const flushCode = () => {
    if (inCode) {
      const langLabel = codeLang ? `<div class="flex items-center justify-between px-4 py-2 bg-secondary/80 border-b border-border text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground"><span>${esc(codeLang)}</span><span class="text-primary/70">MTProto Engine</span></div>` : '';
      out.push(`<div class="my-6 rounded-xl border border-border bg-[#05080f] overflow-hidden shadow-2xl">${langLabel}<pre class="p-4 text-xs font-mono overflow-x-auto text-cyan-200 leading-relaxed"><code>${codeBuf.join("\n")}</code></pre></div>`);
      codeBuf = [];
      inCode = false;
      codeLang = "";
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code Blocks
    const codeMatch = line.trim().match(/^```([a-zA-Z0-9_-]*)/);
    if (codeMatch && !inCode) {
      flushList();
      inCode = true;
      codeLang = codeMatch[1] || "";
      codeBuf = [];
      i++;
      continue;
    }
    if (inCode && /^```/.test(line.trim())) {
      flushCode();
      i++;
      continue;
    }
    if (inCode) {
      codeBuf.push(esc(line));
      i++;
      continue;
    }

    // Standalone Image Line
    const imgLineMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgLineMatch) {
      flushList();
      const alt = imgLineMatch[1];
      const src = imgLineMatch[2];
      out.push(`<figure class="my-8 rounded-2xl overflow-hidden border border-border bg-card/60 shadow-xl"><img src="${src}" alt="${alt || 'Illustration'}" class="w-full h-auto object-cover max-h-[480px]" loading="lazy" />${alt ? `<figcaption class="px-4 py-2.5 text-xs text-center text-muted-foreground bg-secondary/30 border-t border-border/50 font-medium">${alt}</figcaption>` : ''}</figure>`);
      i++;
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      const rawText = h[2];
      const id = slugify(rawText);
      const sizes: Record<number, string> = {
        1: "text-2xl sm:text-3xl font-extrabold text-foreground mt-10 mb-4 tracking-tight border-b border-border/60 pb-3",
        2: "text-xl sm:text-2xl font-bold text-foreground mt-8 mb-3 tracking-tight flex items-center gap-2",
        3: "text-lg sm:text-xl font-bold text-foreground mt-6 mb-2 tracking-tight",
        4: "text-base sm:text-lg font-semibold text-foreground mt-4 mb-2",
      };
      const cls = sizes[level] || "text-base font-semibold text-foreground mt-4 mb-2";
      out.push(`<h${level} id="${id}" class="${cls}"><a href="#${id}" class="hover:text-primary transition-colors">${inline(esc(rawText))}</a></h${level}>`);
      i++;
      continue;
    }

    // List items
    const bullet = line.match(/^[-*+]\s+(.*)$/);
    const num = line.match(/^\d+\.\s+(.*)$/);
    if (bullet || num) {
      const type = bullet ? "ul" : "ol";
      if (!listType) listType = type;
      if (type !== listType) flushList();
      listBuf.push(inline(esc((bullet || num)![1])));
      i++;
      continue;
    }

    // Empty Line
    if (/^\s*$/.test(line)) {
      flushList();
      i++;
      continue;
    }

    // GitHub-Style Alert Blockquotes: > [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT]
    const alertMatch = line.match(/^>\s?\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);
    if (alertMatch) {
      flushList();
      const alertType = alertMatch[1].toUpperCase();
      const firstLineText = alertMatch[2];
      const alertLines = firstLineText ? [firstLineText] : [];
      i++;
      while (i < lines.length && /^>\s?(.*)$/.test(lines[i])) {
        alertLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      
      const styles: Record<string, { border: string; bg: string; text: string; icon: string; title: string }> = {
        NOTE: { border: "border-sky-500/40", bg: "bg-sky-500/10", text: "text-sky-400", icon: "ℹ️", title: "Note" },
        TIP: { border: "border-primary/40", bg: "bg-primary/10", text: "text-primary", icon: "💡", title: "Pro Tip" },
        IMPORTANT: { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-400", icon: "⚡", title: "Important" },
        WARNING: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400", icon: "⚠️", title: "Warning" },
        CAUTION: { border: "border-rose-500/40", bg: "bg-rose-500/10", text: "text-rose-400", icon: "🛑", title: "Caution" },
      };
      const s = styles[alertType] || styles.NOTE;
      out.push(`
        <div class="my-6 rounded-xl border ${s.border} ${s.bg} p-4 text-xs sm:text-sm leading-relaxed">
          <div class="flex items-center gap-2 font-bold uppercase tracking-wider ${s.text} mb-2 text-[11px]">
            <span>${s.icon}</span>
            <span>${s.title}</span>
          </div>
          <div class="text-foreground/90 space-y-1">${inline(esc(alertLines.join(" ")))}</div>
        </div>
      `);
      continue;
    }

    // Standard Blockquotes
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushList();
      out.push(`<blockquote class="my-6 border-l-4 border-primary pl-4 italic text-muted-foreground text-sm bg-secondary/20 py-2.5 rounded-r-lg">${inline(esc(quote[1]))}</blockquote>`);
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^\s*---+$/.test(line)) {
      flushList();
      out.push('<hr class="my-10 border-border" />');
      i++;
      continue;
    }

    // Markdown Tables
    if (/^\s*\|(.+)\|/.test(line)) {
      flushList();
      const tableRows: string[] = [];
      while (i < lines.length && /^\s*\|(.+)\|/.test(lines[i])) {
        tableRows.push(lines[i].trim());
        i++;
      }

      if (tableRows.length >= 2) {
        const headerCols = tableRows[0].slice(1, -1).split("|").map((c) => c.trim());
        let bodyStartIndex = 1;
        if (/^\|?[\s\-:|]+\|?$/.test(tableRows[1])) {
          bodyStartIndex = 2;
        }

        let tableHtml = '<div class="overflow-x-auto my-8 rounded-xl border border-border bg-card/60 shadow-lg"><table class="w-full text-left text-xs sm:text-sm border-collapse">';
        tableHtml += '<thead class="bg-secondary/80 text-foreground font-semibold border-b border-border"><tr>';
        for (const h of headerCols) {
          tableHtml += `<th class="px-4 py-3.5 uppercase tracking-wider text-[11px] text-muted-foreground">${inline(esc(h))}</th>`;
        }
        tableHtml += '</tr></thead><tbody class="divide-y divide-border/40">';

        for (let r = bodyStartIndex; r < tableRows.length; r++) {
          const cells = tableRows[r].slice(1, -1).split("|").map((c) => c.trim());
          tableHtml += '<tr class="hover:bg-secondary/40 transition-colors">';
          for (let c = 0; c < headerCols.length; c++) {
            const val = cells[c] || "";
            tableHtml += `<td class="px-4 py-3 text-foreground/90 font-medium">${inline(esc(val))}</td>`;
          }
          tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table></div>';
        out.push(tableHtml);
      }
      continue;
    }

    flushList();
    // Standard Paragraph
    const buf: string[] = [line];
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() !== "" &&
      !/^(#{1,6})\s/.test(lines[i + 1]) &&
      !/^```/.test(lines[i + 1].trim()) &&
      !/^\s*---+$/.test(lines[i + 1]) &&
      !/^[-*+]\s/.test(lines[i + 1]) &&
      !/^\d+\.\s/.test(lines[i + 1]) &&
      !/^\s*\|(.+)\|/.test(lines[i + 1]) &&
      !/^>\s?/.test(lines[i + 1]) &&
      !/^!\[([^\]]*)\]\(([^)]+)\)$/.test(lines[i + 1].trim())
    ) {
      i++;
      buf.push(lines[i]);
    }
    out.push(`<p class="my-4 text-sm sm:text-base leading-relaxed text-foreground/85">${inline(esc(buf.join(" ")))}</p>`);
    i++;
  }

  flushCode();
  flushList();
  return out.join("\n");
}