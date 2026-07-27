"use client";

import { useState, useEffect } from "react";
import { Folder, ArrowLeft, Play, Loader2, Plus, Trash2, Edit3, List } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { LogPanel } from "@/components/modules/LogPanel";
import { ModuleFooter } from "@/components/modules/ModuleFooter";

export default function FolderManagerPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [action, setAction] = useState<"list" | "create" | "delete" | "rename">("list");
  const [folderName, setFolderName] = useState("");
  const [folderId, setFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [executing, setExecuting] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/", { params: { pageSize: 100 } }).then(r => setAccounts(r.data?.items || r.data || [])).catch(() => {});
  }, []);

  function addLog(text: string, level = "info") { setLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text, level }]); }

  async function handleExecute() {
    if (!accountId) { setError("Select account"); return; }
    if ((action === "create" && !folderName) || (action === "delete" && !folderId) || (action === "rename" && (!folderId || !newFolderName))) {
      setError("Fill required fields"); return;
    }
    setExecuting(true); setError("");
    try {
      addLog(`${action} folder...`);
      const r = await api.post("/modules/account_folders/execute", {
        operation: action === "list" ? "list_folders" : action === "create" ? "create_folder" : action === "delete" ? "delete_folder" : "rename_folder",
        params: { account_id: accountId, folder_name: folderName || undefined, folder_id: folderId || undefined, new_name: newFolderName || undefined },
      });
      const res = r.data?.result || r.data;
      if (action === "list") { setFolders(res.folders || res || []); addLog(`Found ${res.folders?.length || 0} folders`, "info"); }
      else addLog(`Folder ${action}ed successfully`, "success");
    } catch (e: any) { const msg = e.response?.data?.detail || e.message; setError(msg); addLog(msg, "error"); }
    finally { setExecuting(false); }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/modules")} className="p-1 rounded-lg hover:bg-secondary transition-colors"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Folder className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-lg font-bold text-foreground">Folder Manager</h1><p className="text-xs text-muted-foreground">Manage Telegram chat folders</p></div>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            {[
              { id: "list", label: "List", icon: List },
              { id: "create", label: "Create", icon: Plus },
              { id: "delete", label: "Delete", icon: Trash2 },
              { id: "rename", label: "Rename", icon: Edit3 },
            ].map(m => (
              <button key={m.id} onClick={() => setAction(m.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${action === m.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Account</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select account...</option>
                {accounts.map((a: any) => (<option key={a.id} value={a.phone_number || a.phone}>{a.phone_number || a.phone || `#${a.id}`}</option>))}
              </select>
            </div>
            {action === "create" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Folder Name</label>
                <input type="text" value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="My Folder" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
            )}
            {(action === "delete" || action === "rename") && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Folder ID</label>
                <input type="text" value={folderId} onChange={e => setFolderId(e.target.value)} placeholder="1" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
            )}
            {action === "rename" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">New Name</label>
                <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Renamed Folder" className="w-full bg-secondary border-0 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </div>
            )}
          </div>
          <button onClick={handleExecute} disabled={executing || !accountId}
            className="mt-3 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5">
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {executing ? "Processing..." : action.charAt(0).toUpperCase() + action.slice(1)}
          </button>
        </div>
        {folders.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Folders</h3>
            <div className="space-y-1">
              {folders.map((f: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-1.5 text-xs">
                  <span className="text-foreground">{f.name || f.title || f.id}</span>
                  <span className="text-muted-foreground">ID: {f.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <LogPanel entries={log} />
        <ModuleFooter />
      </div>
    </div>
  );
}
