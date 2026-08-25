"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search, RefreshCw, Send, Users, MessageSquare, Radio, Bot, Pin,
  CheckCircle2, AlertTriangle, Loader2, ArrowLeft, Plus, ExternalLink,
  LogOut, Shield, Sparkles, Copy, Check, MessageCircle, Hash
} from "lucide-react";
import api from "@/lib/api";

interface Dialog {
  id: number;
  title: string;
  type: "group" | "supergroup" | "channel" | "dm" | "bot";
  unread_count: number;
  pinned: boolean;
  last_message: string;
  last_message_date: string | null;
  username?: string | null;
  participants_count?: number | null;
  is_creator?: boolean;
  is_verified?: boolean;
}

interface Message {
  id: number;
  text: string;
  date: string | null;
  out: boolean;
  sender_id?: number | null;
  sender_name?: string | null;
  media_type?: string | null;
  views?: number | null;
}

interface TelegramWebClientProps {
  accountId: number;
  accountPhone?: string;
  accountName?: string;
  onBack?: () => void;
}

export default function TelegramWebClient({
  accountId,
  accountPhone,
  accountName,
  onBack,
}: TelegramWebClientProps) {
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    groups: 0,
    channels: 0,
    dms: 0,
    bots: 0,
    unread: 0,
  });
  const [selectedDialog, setSelectedDialog] = useState<Dialog | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingDialogs, setLoadingDialogs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "groups" | "channels" | "dms" | "bots">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinTarget, setJoinTarget] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (accountId) {
      fetchDialogs();
    }
  }, [accountId, activeTab]);

  useEffect(() => {
    if (selectedDialog) {
      fetchMessages(selectedDialog.id);
    } else {
      setMessages([]);
    }
  }, [selectedDialog]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchDialogs = async () => {
    try {
      setLoadingDialogs(true);
      setErrorMsg("");
      const res = await api.get(`/accounts/${accountId}/dialogs`, {
        params: { folder: activeTab, limit: 100 },
      });
      if (res.data.error) {
        setErrorMsg(res.data.error);
      }
      setDialogs(res.data.dialogs || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail || "Failed to load chats from Telegram");
    } finally {
      setLoadingDialogs(false);
    }
  };

  const fetchMessages = async (dialogId: number) => {
    try {
      setLoadingMessages(true);
      const res = await api.get(`/accounts/${accountId}/dialogs/${dialogId}/messages`, {
        params: { limit: 50 },
      });
      setMessages(res.data.messages || []);
    } catch (e: any) {
      console.error("Failed to load messages", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedDialog || sending) return;
    const textToSend = messageText.trim();
    setMessageText("");
    setSending(true);

    // Optimistic message
    const tempMsg: Message = {
      id: Date.now(),
      text: textToSend,
      date: new Date().toISOString(),
      out: true,
      sender_name: "You",
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await api.post(`/accounts/${accountId}/dialogs/${selectedDialog.id}/send`, {
        text: textToSend,
      });
      // Refresh messages after brief delay
      setTimeout(() => fetchMessages(selectedDialog.id), 600);
    } catch (e: any) {
      alert("Failed to send message: " + (e?.response?.data?.detail || e.message));
    } finally {
      setSending(false);
    }
  };

  const handleJoinChat = async () => {
    if (!joinTarget.trim() || joining) return;
    setJoining(true);
    setJoinMsg("");
    try {
      const res = await api.post(`/accounts/${accountId}/dialogs/join`, {
        target: joinTarget.trim(),
      });
      setJoinMsg(res.data.detail || "Successfully joined chat!");
      setJoinTarget("");
      setTimeout(() => {
        setJoinModalOpen(false);
        setJoinMsg("");
        fetchDialogs();
      }, 1200);
    } catch (e: any) {
      setJoinMsg("Error: " + (e?.response?.data?.detail || "Could not join chat"));
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveChat = async (dialog: Dialog) => {
    if (!confirm(`Are you sure you want to leave "${dialog.title}"?`)) return;
    try {
      await api.post(`/accounts/${accountId}/dialogs/${dialog.id}/leave`);
      setDialogs((prev) => prev.filter((d) => d.id !== dialog.id));
      if (selectedDialog?.id === dialog.id) {
        setSelectedDialog(null);
      }
    } catch (e: any) {
      alert("Failed to leave chat: " + (e?.response?.data?.detail || e.message));
    }
  };

  const copyChatId = (id: number) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const filteredDialogs = dialogs.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.username && d.username.toLowerCase().includes(q)) ||
      (d.last_message && d.last_message.toLowerCase().includes(q))
    );
  });

  const getAvatarGradient = (id: number) => {
    const gradients = [
      "from-blue-500 to-indigo-600",
      "from-emerald-500 to-teal-600",
      "from-purple-500 to-pink-600",
      "from-amber-500 to-orange-600",
      "from-cyan-500 to-blue-600",
      "from-rose-500 to-red-600",
    ];
    return gradients[Math.abs(id) % gradients.length];
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-[780px] bg-card rounded-2xl border border-border overflow-hidden shadow-xl">
      {/* Top Header Bar */}
      <div className="h-14 bg-card border-b border-border px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xs shadow-xs">
              {(accountName || accountPhone || "TG").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {accountName || accountPhone || `Account #${accountId}`}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 border border-success/30 text-success text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  MTProto Live
                </span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground">
                {accountPhone || `ID: ${accountId}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setJoinModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-xs font-bold text-primary transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Join Chat / Channel
          </button>
          <button
            onClick={fetchDialogs}
            disabled={loadingDialogs}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Dialogs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingDialogs ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Sidebar + Right Chat Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Dialogs List */}
        <div className="w-80 md:w-96 border-r border-border flex flex-col bg-background/50 shrink-0">
          {/* Search Bar */}
          <div className="p-3 border-b border-border/80">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats, groups, channels..."
                className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Folder Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border/60 overflow-x-auto scrollbar-none text-[11px]">
            {[
              { id: "all", label: "All", count: stats.total },
              { id: "groups", label: "Groups", count: stats.groups },
              { id: "channels", label: "Channels", count: stats.channels },
              { id: "dms", label: "Direct", count: stats.dms },
              { id: "bots", label: "Bots", count: stats.bots },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono ${
                      activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Dialog Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {loadingDialogs ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs">Fetching chats from Telegram...</p>
              </div>
            ) : errorMsg ? (
              <div className="p-4 text-center space-y-2">
                <AlertTriangle className="h-6 w-6 text-destructive mx-auto" />
                <p className="text-xs text-destructive font-medium">{errorMsg}</p>
                <button
                  onClick={fetchDialogs}
                  className="px-3 py-1 bg-secondary border border-border rounded-lg text-xs font-bold"
                >
                  Retry
                </button>
              </div>
            ) : filteredDialogs.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-1">
                <MessageSquare className="h-6 w-6 mx-auto opacity-40 mb-2" />
                <p className="text-xs font-bold text-foreground">No chats found</p>
                <p className="text-[11px]">This account hasn't joined any chats yet in this folder.</p>
              </div>
            ) : (
              filteredDialogs.map((d) => {
                const isSelected = selectedDialog?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDialog(d)}
                    className={`p-3 flex items-start gap-3 cursor-pointer transition-colors relative ${
                      isSelected
                        ? "bg-primary/10 border-l-2 border-primary"
                        : "hover:bg-secondary/60"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`h-11 w-11 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                        d.id
                      )} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs relative`}
                    >
                      {d.title.slice(0, 2).toUpperCase()}
                      {d.type === "channel" && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-card border border-border flex items-center justify-center text-primary">
                          <Radio className="h-2.5 w-2.5" />
                        </div>
                      )}
                      {(d.type === "group" || d.type === "supergroup") && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-card border border-border flex items-center justify-center text-emerald-500">
                          <Users className="h-2.5 w-2.5" />
                        </div>
                      )}
                      {d.type === "bot" && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-card border border-border flex items-center justify-center text-amber-500">
                          <Bot className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Dialog Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-foreground truncate">
                          {d.title}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {formatTime(d.last_message_date)}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground truncate">
                        {d.last_message || "No messages yet"}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-1.5 py-0.2 rounded bg-secondary text-[9px] font-mono text-muted-foreground uppercase">
                          {d.type}
                        </span>
                        {d.participants_count ? (
                          <span className="text-[9px] font-mono text-muted-foreground">
                            {d.participants_count.toLocaleString()} members
                          </span>
                        ) : null}
                        {d.pinned && (
                          <Pin className="h-2.5 w-2.5 text-primary shrink-0 ml-auto" />
                        )}
                        {d.unread_count > 0 && (
                          <span className="ml-auto px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground font-bold text-[9px] font-mono">
                            {d.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Chat Pane */}
        <div className="flex-1 flex flex-col bg-card/30">
          {selectedDialog ? (
            <>
              {/* Chat Header */}
              <div className="h-14 border-b border-border px-4 flex items-center justify-between gap-3 bg-card shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-9 w-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                      selectedDialog.id
                    )} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs`}
                  >
                    {selectedDialog.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-foreground truncate">
                        {selectedDialog.title}
                      </h3>
                      {selectedDialog.username && (
                        <span className="text-[10px] font-mono text-primary">
                          @{selectedDialog.username}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground capitalize flex items-center gap-1.5">
                      <span>{selectedDialog.type}</span>
                      {selectedDialog.participants_count && (
                        <span>· {selectedDialog.participants_count.toLocaleString()} members</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyChatId(selectedDialog.id)}
                    className="p-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground hover:text-foreground text-xs transition-colors flex items-center gap-1"
                    title="Copy Chat ID"
                  >
                    {copiedId ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="text-[10px] font-mono">ID</span>
                  </button>
                  <button
                    onClick={() => handleLeaveChat(selectedDialog)}
                    className="p-1.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive text-xs transition-colors flex items-center gap-1"
                    title="Leave Chat"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold">Leave</span>
                  </button>
                  <button
                    onClick={() => fetchMessages(selectedDialog.id)}
                    disabled={loadingMessages}
                    className="p-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground hover:text-foreground transition-colors"
                    title="Refresh Messages"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingMessages ? "animate-spin text-primary" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-secondary/10">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-xs">Loading message stream...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-24 text-center text-muted-foreground space-y-1">
                    <MessageCircle className="h-8 w-8 mx-auto opacity-30 mb-2" />
                    <p className="text-xs font-bold text-foreground">No recent messages</p>
                    <p className="text-[11px]">Send a message below to start the conversation.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.out ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-xs ${
                            m.out
                              ? "bg-primary text-primary-foreground rounded-br-xs"
                              : "bg-card border border-border text-foreground rounded-bl-xs"
                          }`}
                        >
                          {!m.out && m.sender_name && (
                            <p className="text-[10px] font-bold text-primary mb-0.5">
                              {m.sender_name}
                            </p>
                          )}
                          <p className="text-xs whitespace-pre-wrap leading-relaxed break-words">
                            {m.text}
                          </p>
                          {m.media_type && (
                            <div className="mt-1 px-2 py-0.5 rounded bg-black/15 text-[10px] font-mono inline-block">
                              📎 {m.media_type.toUpperCase()}
                            </div>
                          )}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-mono ${
                              m.out ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            <span>{formatTime(m.date)}</span>
                            {m.out && <Check className="h-2.5 w-2.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="p-3 bg-card border-t border-border flex items-center gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Message ${selectedDialog.title}...`}
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  {sending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Send
                </button>
              </div>
            </>
          ) : (
            /* Empty State when no chat is selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                Telegram Web Live Workstation
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-6">
                Select any group, channel, or direct conversation on the left to read messages, post updates, or manage memberships in real time.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-md">
                <div className="p-3 bg-card border border-border rounded-xl text-center">
                  <p className="text-lg font-mono font-bold text-foreground">{stats.groups}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Groups</p>
                </div>
                <div className="p-3 bg-card border border-border rounded-xl text-center">
                  <p className="text-lg font-mono font-bold text-foreground">{stats.channels}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Channels</p>
                </div>
                <div className="p-3 bg-card border border-border rounded-xl text-center">
                  <p className="text-lg font-mono font-bold text-foreground">{stats.dms}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Direct DMs</p>
                </div>
                <div className="p-3 bg-card border border-border rounded-xl text-center">
                  <p className="text-lg font-mono font-bold text-primary">{stats.unread}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Unread</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Join Chat Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Join Telegram Group or Channel</h3>
              </div>
              <button
                onClick={() => setJoinModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Enter a public channel username (e.g. <span className="font-mono text-primary">@cryptogroup</span> or <span className="font-mono text-primary">telegram_channel</span>) or a private invite link (<span className="font-mono text-primary">https://t.me/+...</span>).
            </p>

            <input
              type="text"
              value={joinTarget}
              onChange={(e) => setJoinTarget(e.target.value)}
              placeholder="@username or https://t.me/..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 font-mono"
            />

            {joinMsg && (
              <p
                className={`text-xs font-bold ${
                  joinMsg.startsWith("Error") ? "text-destructive" : "text-success"
                }`}
              >
                {joinMsg}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleJoinChat}
                disabled={!joinTarget.trim() || joining}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                {joining && <Loader2 className="h-3 w-3 animate-spin" />}
                Join Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
