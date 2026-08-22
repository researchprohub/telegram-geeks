import { useState, useEffect, FormEvent } from "react";
import { groupsApi, modulesApi, accountsApi, detail } from "../lib/api";
import {
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  LogOut,
  Copy,
  Layers,
  Sparkles,
  Users,
  ShieldAlert,
  FolderSync,
  ExternalLink,
} from "lucide-react";

interface GroupItem {
  id: number;
  name: string;
  group_type?: string;
  username?: string;
  member_count?: number;
  created_at?: string;
}

export default function Groups() {
  const [activeTab, setActiveTab] = useState<"manager" | "admin_search" | "mass_leave" | "cloner">("manager");
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [name, setName] = useState("");
  const [targetLink, setTargetLink] = useState("");
  const [type, setType] = useState("supergroup");

  // Admin Search State
  const [adminUsername, setAdminUsername] = useState("");
  const [adminSearchResults, setAdminSearchResults] = useState<any[]>([]);

  // Mass Leave State
  const [leaveAccounts, setLeaveAccounts] = useState<any[]>([]);
  const [selectedAccIds, setSelectedAccIds] = useState<number[]>([]);
  const [leaveChannelsOnly, setLeaveChannelsOnly] = useState(true);

  // Cloner State
  const [sourceChannel, setSourceChannel] = useState("");
  const [targetChannel, setTargetChannel] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    try {
      const [grpRes, accRes] = await Promise.allSettled([
        groupsApi.list(1),
        accountsApi.list(1, 200),
      ]);

      if (grpRes.status === "fulfilled") {
        const d = grpRes.value.data as any;
        const raw = d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
        setGroups(Array.isArray(raw) ? raw : []);
      }

      if (accRes.status === "fulfilled") {
        const raw = accRes.value.data as any;
        const list = raw?.items ?? (Array.isArray(raw) ? raw : []);
        setLeaveAccounts(list);
        if (selectedAccIds.length === 0 && list.length > 0) {
          setSelectedAccIds(list.slice(0, 5).map((a: any) => a.id));
        }
      }
    } catch (err) {
      setError(detail(err));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGroup = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    setSuccessMsg("");

    try {
      await groupsApi.create({
        name: name.trim(),
        group_type: type,
        username: targetLink.trim(),
      });
      setName("");
      setTargetLink("");
      setSuccessMsg("Community target added to workspace!");
      await loadData();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveGroup = async (id: number) => {
    setError("");
    try {
      await groupsApi.delete(id);
      await loadData();
    } catch (err) {
      setError(detail(err));
    }
  };

  const handleAdminSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim()) return;
    setBusy(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await groupsApi.adminSearch(adminUsername.trim());
      const d = res.data as any;
      const items = d?.chats || d?.results || (Array.isArray(d) ? d : []);
      setAdminSearchResults(items);
      setSuccessMsg(`Found ${items.length} chats managed by @${adminUsername.replace("@", "")}!`);
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleMassLeave = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedAccIds.length === 0) {
      setError("Please select at least 1 account.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await groupsApi.massUnsubscribe(selectedAccIds, leaveChannelsOnly);
      setSuccessMsg("Mass leave operation completed across selected accounts!");
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRunCloner = async (e: FormEvent) => {
    e.preventDefault();
    if (!sourceChannel.trim() || !targetChannel.trim()) {
      setError("Please specify both source and target channel links.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await modulesApi.execute("channel_cloner", "clone_channel", {
        source: sourceChannel.trim(),
        target: targetChannel.trim(),
        copy_media: true,
      });
      setSuccessMsg("Channel cloning job started successfully!");
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-primary" />
            Groups & Communities Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage target groups, search communities by administrator, mass unsubscribe dead chats, and clone channels.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("manager")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "manager"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Target Group Manager</span>
        </button>

        <button
          onClick={() => setActiveTab("admin_search")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "admin_search"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Find Chats by Admin</span>
        </button>

        <button
          onClick={() => setActiveTab("mass_leave")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "mass_leave"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <LogOut className="h-4 w-4" />
          <span>Mass Leave / Cleaner</span>
        </button>

        <button
          onClick={() => setActiveTab("cloner")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "cloner"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <FolderSync className="h-4 w-4" />
          <span>Channel / Post Cloner</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "manager" && (
        <div className="space-y-6">
          {/* Add Target Community Form */}
          <form onSubmit={handleCreateGroup} className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Community Name / Label</label>
              <input
                type="text"
                placeholder="e.g. Dubai Crypto Whales"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex-1 w-full space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Username / Invite Link</label>
              <input
                type="text"
                placeholder="https://t.me/example or @group"
                value={targetLink}
                onChange={(e) => setTargetLink(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="w-full sm:w-44 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/80 px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="supergroup">Supergroup</option>
                <option value="channel">Channel</option>
                <option value="private">Private Invite</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 shrink-0"
            >
              Add Target
            </button>
          </form>

          {/* Groups Table */}
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-card/60 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Link / Handle</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {groups.map((g) => (
                  <tr key={g.id} className="hover:bg-card/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold">{g.name}</td>
                    <td className="px-5 py-3.5 font-mono text-muted-foreground">{g.username || "—"}</td>
                    <td className="px-5 py-3.5 capitalize text-muted-foreground">{g.group_type || "Supergroup"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleRemoveGroup(g.id)}
                        className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground text-xs">
                      No target communities added yet. Add public groups or channels above to track them.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Search Tab */}
      {activeTab === "admin_search" && (
        <div className="space-y-6">
          <form onSubmit={handleAdminSearch} className="max-w-2xl rounded-2xl border border-border bg-card/40 backdrop-blur-md p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">Search Communities by Admin</h3>
              <p className="text-xs text-muted-foreground">Find all public groups and channels that share the same administrator username.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target Admin Username</label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="@admin_handle or username"
                required
                className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                <span>{busy ? "Searching…" : "Search Communities"}</span>
              </button>
            </div>
          </form>

          {adminSearchResults.length > 0 && (
            <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 space-y-3">
              <span className="text-xs font-bold text-foreground">Matched Communities ({adminSearchResults.length})</span>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {adminSearchResults.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-background/60 border border-border/40 text-xs flex items-center justify-between">
                    <span className="font-semibold text-foreground">{r.title || r.name}</span>
                    <span className="font-mono text-muted-foreground">{r.username ? `@${r.username}` : `ID: ${r.id}`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mass Leave Tab */}
      {activeTab === "mass_leave" && (
        <form onSubmit={handleMassLeave} className="max-w-2xl rounded-2xl border border-border bg-card/40 backdrop-blur-md p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1">Mass Leave / Unsubscribe</h3>
            <p className="text-xs text-muted-foreground">Bulk leave unnecessary channels or groups across your farm to clean dialog lists.</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground">Select Accounts ({selectedAccIds.length} chosen)</label>
                <button
                  type="button"
                  onClick={() => setSelectedAccIds(leaveAccounts.map((a) => a.id))}
                  className="text-[11px] text-primary hover:underline"
                >
                  Select All
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto rounded-xl border border-border bg-background/60 p-2.5 space-y-1.5 custom-scrollbar">
                {leaveAccounts.map((acc) => (
                  <label key={acc.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAccIds.includes(acc.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedAccIds([...selectedAccIds, acc.id]);
                        else setSelectedAccIds(selectedAccIds.filter((id) => id !== acc.id));
                      }}
                      className="h-3.5 w-3.5 accent-primary rounded"
                    />
                    <span className="font-mono text-muted-foreground">{acc.phone || `Account #${acc.id}`}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="channelsOnly"
                checked={leaveChannelsOnly}
                onChange={(e) => setLeaveChannelsOnly(e.target.checked)}
                className="h-4 w-4 accent-primary rounded"
              />
              <label htmlFor="channelsOnly" className="text-xs text-foreground">
                Leave Broadcast Channels only (Keep active supergroups)
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2.5 rounded-xl bg-destructive text-white text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>{busy ? "Leaving Chats…" : "Execute Mass Unsubscribe"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Cloner Tab */}
      {activeTab === "cloner" && (
        <form onSubmit={handleRunCloner} className="max-w-2xl rounded-2xl border border-border bg-card/40 backdrop-blur-md p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1">Telegram Channel & Post Cloner</h3>
            <p className="text-xs text-muted-foreground">Clone full history, media, formatting, and future posts from a source channel into your owned channel.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Source Channel (Public Link or Username)</label>
              <input
                type="text"
                value={sourceChannel}
                onChange={(e) => setSourceChannel(e.target.value)}
                placeholder="https://t.me/source_channel"
                required
                className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Destination Owned Channel</label>
              <input
                type="text"
                value={targetChannel}
                onChange={(e) => setTargetChannel(e.target.value)}
                placeholder="https://t.me/my_new_channel"
                required
                className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <FolderSync className="h-4 w-4" />
              <span>{busy ? "Starting Cloner…" : "Start Channel Cloner"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}