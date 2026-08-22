"use client";

import { useState, useMemo } from "react";
import { Users, Search, Check, Filter, ShieldCheck, Flame, Star, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccountItem {
  id: string | number;
  phone_number?: string;
  phone?: string;
  username?: string;
  first_name?: string;
  status?: string;
  folder?: string;
  proxy_id?: number | null;
}

interface AccountPickerProps {
  accounts: AccountItem[];
  selectedIds: (string | number)[];
  onSelectionChange: (ids: (string | number)[]) => void;
  singleSelect?: boolean;
  label?: string;
  required?: boolean;
}

export function AccountPicker({
  accounts,
  selectedIds,
  onSelectionChange,
  singleSelect = false,
  label = "Select Sender Accounts",
  required = true,
}: AccountPickerProps) {
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [expanded, setExpanded] = useState(false);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchSearch =
        search === "" ||
        (acc.phone_number || acc.phone || "").toLowerCase().includes(search.toLowerCase()) ||
        (acc.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (acc.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
        String(acc.id).includes(search);

      const matchFolder =
        folderFilter === "all" ||
        (acc.folder || "active").toLowerCase() === folderFilter.toLowerCase();

      return matchSearch && matchFolder;
    });
  }, [accounts, search, folderFilter]);

  const toggleSelect = (id: string | number) => {
    if (singleSelect) {
      onSelectionChange(selectedIds.includes(id) ? [] : [id]);
    } else {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((item) => String(item) !== String(id)));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    }
  };

  const selectAllFiltered = () => {
    if (singleSelect) return;
    const allFilteredIds = filteredAccounts.map((a) => a.id);
    const newSelection = Array.from(new Set([...selectedIds, ...allFilteredIds]));
    onSelectionChange(newSelection);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const getFolderBadge = (acc: AccountItem) => {
    const f = (acc.folder || acc.status || "active").toLowerCase();
    if (f.includes("warm")) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-warning/15 text-warning text-[9px] font-bold flex items-center gap-0.5">
          <Flame className="h-2.5 w-2.5" /> WARMING
        </span>
      );
    }
    if (f.includes("prem")) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-bold flex items-center gap-0.5">
          <Star className="h-2.5 w-2.5" /> PREMIUM
        </span>
      );
    }
    if (f.includes("ban") || f.includes("spam")) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-destructive/15 text-destructive text-[9px] font-bold flex items-center gap-0.5">
          <AlertTriangle className="h-2.5 w-2.5" /> BLOCKED
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9px] font-bold flex items-center gap-0.5">
        <ShieldCheck className="h-2.5 w-2.5" /> ACTIVE
      </span>
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-bold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {label} {required && <span className="text-destructive">*</span>}
          <span className="px-2 py-0.5 rounded-full bg-secondary text-primary font-mono text-[11px] font-black">
            {selectedIds.length} {singleSelect ? "selected" : `of ${accounts.length}`}
          </span>
        </label>

        <div className="flex items-center gap-2 text-xs">
          {!singleSelect && (
            <>
              <button
                type="button"
                onClick={selectAllFiltered}
                className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-[11px] transition-colors"
              >
                Select Filtered ({filteredAccounts.length})
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-[11px] transition-colors"
                >
                  Clear
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] transition-colors"
          >
            {expanded ? "Collapse List" : "Expand Accounts"}
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phone, username, or ID..."
            className="w-full bg-secondary border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border">
          {["all", "active", "warming", "premium"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFolderFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                folderFilter === f
                  ? "bg-card text-primary shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Account List */}
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto pr-1 transition-all",
          expanded ? "max-h-72" : "max-h-36"
        )}
      >
        {filteredAccounts.length === 0 ? (
          <div className="col-span-full py-6 text-center text-xs text-muted-foreground italic bg-secondary/30 rounded-xl border border-dashed border-border">
            No accounts matching criteria
          </div>
        ) : (
          filteredAccounts.map((acc) => {
            const isSelected = selectedIds.some((id) => String(id) === String(acc.id));
            const phone = acc.phone_number || acc.phone || `Account #${acc.id}`;
            const username = acc.username ? `@${acc.username}` : acc.first_name || "No username";

            return (
              <div
                key={acc.id}
                onClick={() => toggleSelect(acc.id)}
                className={cn(
                  "p-2.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between text-xs",
                  isSelected
                    ? "bg-primary/10 border-primary shadow-xs"
                    : "bg-secondary/40 border-border hover:bg-secondary hover:border-border/80"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>

                  <div className="truncate">
                    <span className="font-bold text-foreground block truncate font-mono text-[11px]">
                      {phone}
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {username}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">{getFolderBadge(acc)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
