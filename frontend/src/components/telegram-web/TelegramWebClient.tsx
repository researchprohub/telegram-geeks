"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search, RefreshCw, Send, Users, MessageSquare, Radio, Bot, Pin,
  CheckCircle2, AlertTriangle, Loader2, ArrowLeft, Plus, ExternalLink,
  LogOut, Shield, Sparkles, Copy, Check, MessageCircle, Hash, Smile,
  Paperclip, Download, Globe, Heart, Flame, ThumbsUp, PartyPopper,
  Settings, Image, Video, FileText, X, Archive, ChevronRight, Share2,
  Lock, Eye, Volume2, UserCheck, Smartphone
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
  has_photo?: boolean;
  is_creator?: boolean;
  is_verified?: boolean;
}

interface MessageMedia {
  type: "photo" | "document" | "video" | "voice" | "audio";
  file_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  duration?: number | null;
  download_url: string;
}

interface Reaction {
  emoji: string;
  count: number;
  chosen?: boolean;
}

interface Message {
  id: number;
  text: string;
  date: string | null;
  out: boolean;
  sender_id?: number | null;
  sender_name?: string | null;
  sender_username?: string | null;
  media?: MessageMedia | null;
  reactions?: Reaction[];
  views?: number | null;
  translated_text?: string | null;
  translating?: boolean;
}

interface TelegramWebClientProps {
  accountId: number;
  accountPhone?: string;
  accountName?: string;
  onBack?: () => void;
}

const COMMON_EMOJIS = [
  "😀", "😂", "🔥", "❤️", "👍", "👏", "🎉", "🚀", "💎", "⭐",
  "🙌", "💯", "🤩", "😎", "🤝", "⚡", "✨", "🎯", "💰", "👀"
];

const QUICK_REACTIONS = ["❤️", "👍", "🔥", "👏", "🎉", "🤩", "💩", "🙏", "⚡", "🥰"];

/**
 * Authenticated Image Component
 * Loads binary images via axios `api` using Authorization headers,
 * caching as local Blob URLs to bypass browser unauthenticated img limitations.
 */
function AuthenticatedImage({
  src,
  alt,
  className,
  fallback,
  onClick,
}: {
  src: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
  onClick?: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setHasError(false);

    api
      .get(src, { responseType: "blob" })
      .then((res) => {
        if (isMounted) {
          const url = URL.createObjectURL(res.data);
          setBlobUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className={`${className} bg-secondary/80 flex items-center justify-center animate-pulse`}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasError || !blobUrl) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={blobUrl}
      alt={alt || ""}
      className={className}
      onClick={onClick}
    />
  );
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
    archived: 0,
  });
  const [archivedPreview, setArchivedPreview] = useState<{ count: number; snippet: string } | null>(null);
  const [isArchivedFolder, setIsArchivedFolder] = useState(false);

  const [selectedDialog, setSelectedDialog] = useState<Dialog | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingDialogs, setLoadingDialogs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "groups" | "channels" | "dms" | "bots">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Panels
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinTarget, setJoinTarget] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState("");

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [telegramProfile, setTelegramProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editUsername, setEditUsername] = useState("");

  const [storiesModalOpen, setStoriesModalOpen] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [storyCaption, setStoryCaption] = useState("");

  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachCaption, setAttachCaption] = useState("");
  const [sendingAttachment, setSendingAttachment] = useState(false);

  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<number | null>(null);
  const [activeMediaPreview, setActiveMediaPreview] = useState<string | null>(null);
  const [downloadingMsgId, setDownloadingMsgId] = useState<number | null>(null);

  const [copiedId, setCopiedId] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [outgoingTranslating, setOutgoingTranslating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (accountId) {
      fetchDialogs();
    }
  }, [accountId, activeTab, isArchivedFolder]);

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
      const folderParam = isArchivedFolder ? "archived" : activeTab;
      const res = await api.get(`/accounts/${accountId}/dialogs`, {
        params: { folder: folderParam, limit: 100 },
      });
      if (res.data.error) {
        setErrorMsg(res.data.error);
      }
      setDialogs(res.data.dialogs || []);
      setStats(res.data.stats || { total: 0, groups: 0, channels: 0, dms: 0, bots: 0, unread: 0, archived: 0 });
      if (res.data.archived_preview) {
        setArchivedPreview(res.data.archived_preview);
      }
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail || e.message || "Failed to load chats");
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !selectedDialog) return;

    const textToSend = messageText.trim();
    setMessageText("");
    setSending(true);

    const tempMsg: Message = {
      id: Date.now(),
      text: textToSend,
      date: new Date().toISOString(),
      out: true,
      sender_name: "You",
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await api.post(`/accounts/${accountId}/dialogs/${selectedDialog.id}/send`, {
        text: textToSend,
      });
      if (res.data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? { ...m, id: res.data.message.id } : m))
        );
      }
    } catch (err: any) {
      setErrorMsg("Failed to send message: " + (err.response?.data?.detail || err.message));
    } finally {
      setSending(false);
    }
  };

  const handleDownloadMedia = async (dialogId: number | string, messageId: number, filename: string) => {
    try {
      setDownloadingMsgId(messageId);
      const res = await api.get(`/accounts/${accountId}/dialogs/${dialogId}/messages/${messageId}/media`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setErrorMsg("Download failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setDownloadingMsgId(null);
    }
  };

  const handleSendReaction = async (messageId: number, emoji: string) => {
    if (!selectedDialog) return;

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = m.reactions || [];
        const existingIdx = currentReactions.findIndex((r) => r.emoji === emoji);
        let updated = [...currentReactions];
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            count: updated[existingIdx].count + 1,
            chosen: true,
          };
        } else {
          updated.push({ emoji, count: 1, chosen: true });
        }
        return { ...m, reactions: updated };
      })
    );

    try {
      await api.post(`/accounts/${accountId}/dialogs/${selectedDialog.id}/messages/${messageId}/react`, {
        emoji,
      });
    } catch (e) {
      console.error("Reaction failed", e);
    }
  };

  const handleTranslateMessage = async (msgId: number, text: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, translating: true } : m))
    );

    try {
      const res = await api.post(`/accounts/translate`, {
        text,
        target_lang: "en",
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, translating: false, translated_text: res.data.translated }
            : m
        )
      );
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, translating: false } : m))
      );
    }
  };

  const handleOutgoingTranslate = async () => {
    if (!messageText.trim()) return;
    setOutgoingTranslating(true);
    try {
      const res = await api.post(`/accounts/translate`, {
        text: messageText,
        target_lang: "en",
      });
      if (res.data.translated) {
        setMessageText(res.data.translated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOutgoingTranslating(false);
    }
  };

  const handleSendAttachment = async () => {
    if (!attachFile || !selectedDialog) return;
    setSendingAttachment(true);

    const formData = new FormData();
    formData.append("file", attachFile);
    if (attachCaption.trim()) {
      formData.append("caption", attachCaption.trim());
    }

    try {
      await api.post(`/accounts/${accountId}/dialogs/${selectedDialog.id}/send-media`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachModalOpen(false);
      setAttachFile(null);
      setAttachCaption("");
      fetchMessages(selectedDialog.id);
    } catch (e: any) {
      setErrorMsg("Failed to upload attachment: " + (e.response?.data?.detail || e.message));
    } finally {
      setSendingAttachment(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsModalOpen(true);
    setLoadingProfile(true);
    try {
      const res = await api.get(`/accounts/${accountId}/telegram-settings`);
      setTelegramProfile(res.data);
      setEditFirstName(res.data.first_name || "");
      setEditLastName(res.data.last_name || "");
      setEditBio(res.data.bio || "");
      setEditUsername(res.data.username || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    setUpdatingProfile(true);
    try {
      await api.post(`/accounts/${accountId}/telegram-settings/update`, {
        first_name: editFirstName,
        last_name: editLastName,
        bio: editBio,
        username: editUsername,
      });
      setSettingsModalOpen(false);
      fetchDialogs();
    } catch (e: any) {
      setErrorMsg("Profile update failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setUpdatingProfile(false);
    }
  };

  const fetchStories = async () => {
    setStoriesModalOpen(true);
    setLoadingStories(true);
    try {
      const res = await api.get(`/accounts/${accountId}/stories`);
      setStories(res.data.stories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStories(false);
    }
  };

  const handleUploadStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStory(true);
    const formData = new FormData();
    formData.append("file", file);
    if (storyCaption.trim()) {
      formData.append("caption", storyCaption.trim());
    }

    try {
      await api.post(`/accounts/${accountId}/stories/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStoryCaption("");
      fetchStories();
    } catch (err: any) {
      setErrorMsg("Failed to upload story: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploadingStory(false);
    }
  };

  const handleJoinChat = async () => {
    if (!joinTarget.trim()) return;
    setJoining(true);
    setJoinMsg("");
    try {
      const res = await api.post(`/accounts/${accountId}/dialogs/join`, {
        target: joinTarget.trim(),
      });
      setJoinMsg(res.data.detail || "Successfully joined!");
      setTimeout(() => {
        setJoinModalOpen(false);
        setJoinTarget("");
        setJoinMsg("");
        fetchDialogs();
      }, 1200);
    } catch (e: any) {
      setJoinMsg("Error: " + (e.response?.data?.detail || e.message));
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveChat = async (dialogId: number) => {
    if (!confirm("Are you sure you want to leave this chat/channel?")) return;
    try {
      await api.post(`/accounts/${accountId}/dialogs/${dialogId}/leave`);
      setSelectedDialog(null);
      fetchDialogs();
    } catch (e: any) {
      setErrorMsg("Failed to leave chat: " + (e.response?.data?.detail || e.message));
    }
  };

  const filteredDialogs = dialogs.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.username && d.username.toLowerCase().includes(q)) ||
      d.last_message.toLowerCase().includes(q)
    );
  });

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const getInitials = (title: string) => {
    if (!title) return "TG";
    const clean = title.replace(/[^\w\s]/gi, "").trim();
    const parts = clean.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return title.slice(0, 2).toUpperCase();
  };

  const getGradient = (id: number) => {
    const gradients = [
      "from-blue-600 to-cyan-500",
      "from-emerald-600 to-teal-500",
      "from-purple-600 to-indigo-500",
      "from-amber-600 to-orange-500",
      "from-rose-600 to-pink-500",
      "from-violet-600 to-fuchsia-500",
    ];
    return gradients[Math.abs(id) % gradients.length];
  };

  const renderClickableContent = (text: string, isOut: boolean) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+|t\.me\/[^\s]+|@[a-zA-Z0-9_]{4,})/g;
    const parts = text.split(urlRegex);

    return (
      <span>
        {parts.map((part, index) => {
          if (!part) return null;
          if (part.startsWith("http://") || part.startsWith("https://") || part.startsWith("t.me/")) {
            const href = part.startsWith("http") ? part : `https://${part}`;
            return (
              <a
                key={index}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`underline font-semibold break-all hover:opacity-80 transition-opacity ${
                  isOut ? "text-white hover:text-white/90" : "text-primary hover:text-primary/80"
                }`}
              >
                {part}
              </a>
            );
          } else if (part.startsWith("@") && part.length > 1) {
            const username = part.slice(1);
            return (
              <a
                key={index}
                href={`https://t.me/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`font-semibold underline hover:opacity-80 transition-opacity ${
                  isOut ? "text-white/95" : "text-primary"
                }`}
              >
                {part}
              </a>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[780px] bg-card rounded-2xl border border-border overflow-hidden shadow-xl">
      {/* 🧭 Top Station Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/70 border-b border-border text-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          {/* Account Avatar with Story Ring */}
          <div
            onClick={fetchStories}
            className="relative cursor-pointer group"
            title="View & Post Telegram Stories"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-[2px] shadow-xs group-hover:scale-105 transition-transform">
              <div className="h-full w-full rounded-full bg-secondary flex items-center justify-center font-bold text-foreground text-[10px]">
                {getInitials(accountName || accountPhone || "TG")}
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">
                {accountName || accountPhone || `Account #${accountId}`}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                MTProto Live
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              {accountPhone ? `+${accountPhone.replace("+", "")}` : `ID: ${accountId}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStories}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 hover:from-amber-500/20 hover:to-rose-500/20 border border-amber-500/20 text-amber-500 text-[11px] font-bold flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Stories
          </button>

          <button
            onClick={fetchSettings}
            className="p-2 rounded-xl bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold transition-all"
            title="Telegram Account Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            onClick={() => setJoinModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            Join Chat
          </button>

          <button
            onClick={() => fetchDialogs()}
            disabled={loadingDialogs}
            className="p-2 rounded-xl bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold transition-all"
            title="Refresh All Dialogs"
          >
            <RefreshCw className={`h-4 w-4 ${loadingDialogs ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-destructive hover:opacity-70">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace (Left Dialogs | Right Chat View) */}
      <div className="flex flex-1 overflow-hidden">
        {/* ================= LEFT SIDEBAR ================= */}
        <div className="w-80 border-r border-border flex flex-col bg-card/60 shrink-0">
          {/* Search bar */}
          <div className="p-3 border-b border-border/80">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search chats, groups, channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Archived Chats Folder Bar */}
          {!isArchivedFolder && (archivedPreview || stats.archived > 0) && (
            <div
              onClick={() => setIsArchivedFolder(true)}
              className="px-3 py-2.5 bg-secondary/40 hover:bg-secondary/80 border-b border-border/80 cursor-pointer transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Archive className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    Archived chats
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[170px]">
                    {archivedPreview?.snippet || "Muted and archived dialogs"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
                  {stats.archived || archivedPreview?.count || 0}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
              </div>
            </div>
          )}

          {isArchivedFolder && (
            <div
              onClick={() => setIsArchivedFolder(false)}
              className="px-3 py-2 bg-primary/10 hover:bg-primary/20 border-b border-primary/20 cursor-pointer transition-colors flex items-center gap-2 text-primary text-xs font-bold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Main Chats</span>
            </div>
          )}

          {/* Folder tabs */}
          {!isArchivedFolder && (
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/60 overflow-x-auto text-[11px] font-bold scrollbar-none">
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
                  className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[9px] px-1 rounded-full ${
                      activeTab === tab.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Dialogs List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {loadingDialogs ? (
              <div className="p-8 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading Telegram dialogs...</span>
              </div>
            ) : filteredDialogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No chats found in this folder.
              </div>
            ) : (
              filteredDialogs.map((d) => {
                const isSelected = selectedDialog?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDialog(d)}
                    className={`px-3 py-2.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-l-4 border-primary"
                        : "hover:bg-secondary/40"
                    }`}
                  >
                    {/* Display Photo Avatar */}
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-secondary relative flex items-center justify-center text-white font-bold text-xs shadow-xs">
                        {d.has_photo ? (
                          <AuthenticatedImage
                            src={`/accounts/${accountId}/dialogs/${d.id}/avatar`}
                            alt={d.title}
                            className="h-full w-full object-cover"
                            fallback={
                              <div
                                className={`h-full w-full bg-gradient-to-tr ${getGradient(
                                  d.id
                                )} flex items-center justify-center text-white font-bold`}
                              >
                                {getInitials(d.title)}
                              </div>
                            }
                          />
                        ) : (
                          <div
                            className={`h-full w-full bg-gradient-to-tr ${getGradient(
                              d.id
                            )} flex items-center justify-center text-white font-bold`}
                          >
                            {getInitials(d.title)}
                          </div>
                        )}
                      </div>
                      {d.type === "bot" && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[8px] font-bold">
                          B
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className={`text-xs font-bold truncate ${
                              isSelected ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {d.title}
                          </span>
                          {d.is_verified && (
                            <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                          )}
                        </div>
                        {d.last_message_date && (
                          <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                            {formatTime(d.last_message_date)}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground truncate">
                        {d.last_message || "No messages yet"}
                      </p>

                      <div className="flex items-center justify-between gap-1 mt-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          {d.type} {d.participants_count ? `• ${d.participants_count}` : ""}
                        </span>

                        <div className="flex items-center gap-1">
                          {d.pinned && <Pin className="h-3 w-3 text-muted-foreground rotate-45" />}
                          {d.unread_count > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                              {d.unread_count > 99 ? "99+" : d.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT CHAT PANE ================= */}
        <div className="flex-1 flex flex-col bg-secondary/15 relative">
          {selectedDialog ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-2.5 bg-card/80 border-b border-border/80 flex items-center justify-between backdrop-blur-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-secondary relative flex items-center justify-center text-white font-bold text-xs shadow-xs">
                    {selectedDialog.has_photo ? (
                      <AuthenticatedImage
                        src={`/accounts/${accountId}/dialogs/${selectedDialog.id}/avatar`}
                        alt={selectedDialog.title}
                        className="h-full w-full object-cover"
                        fallback={
                          <div
                            className={`h-full w-full bg-gradient-to-tr ${getGradient(
                              selectedDialog.id
                            )} flex items-center justify-center text-white font-bold`}
                          >
                            {getInitials(selectedDialog.title)}
                          </div>
                        }
                      />
                    ) : (
                      <div
                        className={`h-full w-full bg-gradient-to-tr ${getGradient(
                          selectedDialog.id
                        )} flex items-center justify-center text-white font-bold`}
                      >
                        {getInitials(selectedDialog.title)}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-foreground">{selectedDialog.title}</h3>
                      {selectedDialog.username && (
                        <span className="text-[11px] text-primary font-mono">
                          @{selectedDialog.username}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {selectedDialog.type}{" "}
                      {selectedDialog.participants_count
                        ? `• ${selectedDialog.participants_count.toLocaleString()} members`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(String(selectedDialog.id));
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 1500);
                    }}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold transition-colors flex items-center gap-1"
                    title="Copy Chat ID"
                  >
                    {copiedId ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span className="font-mono text-[10px]">ID</span>
                  </button>

                  <button
                    onClick={() => handleLeaveChat(selectedDialog.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs font-bold transition-colors flex items-center gap-1"
                    title="Leave Chat/Channel"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Leave</span>
                  </button>

                  <button
                    onClick={() => fetchMessages(selectedDialog.id)}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                    title="Refresh Messages"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${loadingMessages ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
                  backgroundSize: "20px 20px",
                }}
              >
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Loading message history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                    No messages yet in this chat.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOut = m.out;
                    const isHovered = hoveredMsgId === m.id;

                    return (
                      <div
                        key={m.id}
                        onMouseEnter={() => setHoveredMsgId(m.id)}
                        onMouseLeave={() => setHoveredMsgId(null)}
                        className={`flex flex-col group relative ${
                          isOut ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Floating Quick Reactions Toolbar */}
                        {isHovered && (
                          <div
                            className={`absolute -top-7 z-20 flex items-center gap-1 p-1 rounded-full bg-card border border-border shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 ${
                              isOut ? "right-2" : "left-2"
                            }`}
                          >
                            {QUICK_REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleSendReaction(m.id, emoji)}
                                className="h-6 w-6 rounded-full hover:bg-secondary flex items-center justify-center text-xs hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              onClick={() => handleTranslateMessage(m.id, m.text)}
                              className="px-2 py-0.5 rounded-full hover:bg-secondary text-[10px] font-bold text-primary flex items-center gap-0.5"
                              title="Translate Message"
                            >
                              <Globe className="h-3 w-3" />
                              Translate
                            </button>
                          </div>
                        )}

                        <div
                          className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs shadow-xs relative space-y-1.5 ${
                            isOut
                              ? "bg-primary text-primary-foreground rounded-br-xs"
                              : "bg-card border border-border text-foreground rounded-bl-xs"
                          }`}
                        >
                          {/* Sender Name */}
                          {!isOut && m.sender_name && (
                            <p className="text-[10px] font-bold text-primary truncate">
                              {m.sender_name}
                            </p>
                          )}

                          {/* Media Preview / Attachments */}
                          {m.media && (
                            <div className="rounded-xl overflow-hidden bg-black/10 border border-white/10 p-2 space-y-1.5">
                              {m.media.type === "photo" ? (
                                <div className="cursor-pointer group/photo relative rounded-lg overflow-hidden max-h-60">
                                  <AuthenticatedImage
                                    src={`/accounts/${accountId}/dialogs/${selectedDialog.id}/messages/${m.id}/media`}
                                    alt={m.media.file_name}
                                    className="w-full object-cover group-hover/photo:scale-105 transition-transform"
                                    onClick={() =>
                                      setActiveMediaPreview(
                                        `/accounts/${accountId}/dialogs/${selectedDialog.id}/messages/${m.id}/media`
                                      )
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-3 p-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                      {m.media.type === "video" ? (
                                        <Video className="h-4 w-4" />
                                      ) : (
                                        <FileText className="h-4 w-4" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold truncate">
                                        {m.media.file_name}
                                      </p>
                                      <p className="text-[9px] opacity-75 font-mono">
                                        {formatFileSize(m.media.file_size)}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDownloadMedia(
                                        selectedDialog.id,
                                        m.id,
                                        m.media?.file_name || `file_${m.id}`
                                      )
                                    }
                                    disabled={downloadingMsgId === m.id}
                                    className="p-1.5 rounded-lg bg-secondary hover:bg-card text-foreground transition-colors shrink-0 disabled:opacity-50"
                                    title="Download File"
                                  >
                                    {downloadingMsgId === m.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                    ) : (
                                      <Download className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message Text with Clickable Links */}
                          {m.text && (
                            <div className="whitespace-pre-wrap leading-relaxed break-words">
                              {renderClickableContent(m.text, isOut)}
                            </div>
                          )}

                          {/* Inline Translated Text Box */}
                          {m.translated_text && (
                            <div className="p-2 rounded-xl bg-secondary/50 border border-border text-foreground text-[11px] space-y-1">
                              <div className="flex items-center gap-1 text-[9px] font-bold text-primary uppercase">
                                <Globe className="h-3 w-3" /> Translated English
                              </div>
                              <div className="italic leading-relaxed">
                                {renderClickableContent(m.translated_text, false)}
                              </div>
                            </div>
                          )}

                          {m.translating && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic">
                              <Loader2 className="h-3 w-3 animate-spin" /> Translating message...
                            </div>
                          )}

                          {/* Footer Info: Views & Timestamp */}
                          <div
                            className={`flex items-center justify-end gap-1.5 text-[9px] ${
                              isOut ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {m.views !== undefined && m.views !== null && (
                              <span className="flex items-center gap-0.5">
                                <Eye className="h-2.5 w-2.5" />
                                {m.views}
                              </span>
                            )}
                            <span className="font-mono">{formatTime(m.date)}</span>
                            {isOut && <Check className="h-2.5 w-2.5" />}
                          </div>
                        </div>

                        {/* Reaction Pill Badges */}
                        {m.reactions && m.reactions.length > 0 && (
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isOut ? "justify-end" : "justify-start"
                            }`}
                          >
                            {m.reactions.map((r, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSendReaction(m.id, r.emoji)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                                  r.chosen
                                    ? "bg-primary/20 border-primary text-primary"
                                    : "bg-card border-border hover:bg-secondary text-foreground"
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span className="font-mono text-[9px]">{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-3 bg-card/80 border-t border-border/80 space-y-2">
                {/* AI Text Translator & Rewrite helper */}
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={handleOutgoingTranslate}
                    disabled={outgoingTranslating || !messageText.trim()}
                    className="flex items-center gap-1.5 text-primary hover:underline font-semibold disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {outgoingTranslating
                      ? "Translating text..."
                      : "Rewrite, translate and correct text with AI"}
                  </button>
                  <span className="text-[10px] text-muted-foreground">
                    Press Enter to send, Shift+Enter for new line
                  </span>
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => setAttachModalOpen(true)}
                    className="p-2 rounded-xl bg-secondary hover:bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
                    title="Send file, photo, or document"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  {/* Emoji Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                      className="p-2 rounded-xl bg-secondary hover:bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
                      title="Add Emoji"
                    >
                      <Smile className="h-4 w-4" />
                    </button>

                    {/* Emoji Popover */}
                    {emojiPickerOpen && (
                      <div className="absolute bottom-12 left-0 z-30 p-2 bg-card border border-border rounded-2xl shadow-2xl grid grid-cols-5 gap-1.5 w-60 animate-in fade-in zoom-in-95 duration-100">
                        {COMMON_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setMessageText((prev) => prev + emoji);
                              setEmojiPickerOpen(false);
                            }}
                            className="h-8 w-8 rounded-xl hover:bg-secondary flex items-center justify-center text-base hover:scale-110 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Message ${selectedDialog.title}...`}
                    className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40"
                  />

                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {sending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-xs gap-3 p-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-secondary/80 flex items-center justify-center text-primary shadow-xs">
                <MessageSquare className="h-8 w-8 opacity-80" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Select a Telegram Chat</p>
                <p className="text-muted-foreground text-xs mt-1 max-w-xs">
                  Choose any joined group, channel, or direct DM from the left sidebar to view
                  messages, send media, and interact live.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: JOIN CHAT ================= */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> Join Channel or Group
              </h3>
              <button
                onClick={() => setJoinModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                  Telegram Username or Invite Link
                </label>
                <input
                  type="text"
                  value={joinTarget}
                  onChange={(e) => setJoinTarget(e.target.value)}
                  placeholder="@cryptogroup or https://t.me/+joinhash"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none font-mono"
                />
              </div>

              {joinMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold ${
                    joinMsg.startsWith("Error")
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  }`}
                >
                  {joinMsg}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-card"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleJoinChat}
                disabled={joining || !joinTarget.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90 disabled:opacity-50"
              >
                {joining && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{joining ? "Joining..." : "Join Target"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ATTACHMENT UPLOADER ================= */}
      {attachModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-primary" /> Send File / Media
              </h3>
              <button
                onClick={() => setAttachModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setAttachFile(e.target.files?.[0] || null)}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-secondary/40 transition-colors"
              >
                <Image className="h-8 w-8 text-primary mb-2 opacity-80" />
                <p className="text-xs font-bold text-foreground">
                  {attachFile ? attachFile.name : "Click to select a Photo, Document, or Video"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {attachFile ? formatFileSize(attachFile.size) : "Supports JPG, PNG, MP4, PDF, TXT, ZIP"}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  value={attachCaption}
                  onChange={(e) => setAttachCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-xs text-foreground outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAttachModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-card"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAttachment}
                disabled={sendingAttachment || !attachFile}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90 disabled:opacity-50"
              >
                {sendingAttachment && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{sendingAttachment ? "Uploading..." : "Send Media"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TELEGRAM SETTINGS ================= */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" /> Telegram Account Settings
              </h3>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingProfile ? (
              <div className="p-8 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading profile settings...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Username
                  </label>
                  <div className="flex items-center bg-secondary border border-border rounded-xl px-3 py-2">
                    <span className="text-muted-foreground text-xs mr-1">@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full bg-transparent text-xs text-foreground outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Bio / About
                  </label>
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Short bio shown on your profile..."
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground outline-none"
                  />
                </div>

                {telegramProfile && (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-secondary/30 rounded-xl border border-border/80 text-[10px]">
                    <div>
                      <span className="text-muted-foreground block">Phone</span>
                      <span className="font-mono font-bold text-foreground">
                        {telegramProfile.phone || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Data Center</span>
                      <span className="font-mono font-bold text-foreground">
                        DC {telegramProfile.dc_id || 4}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Premium Status</span>
                      <span
                        className={`font-bold ${
                          telegramProfile.is_premium ? "text-amber-500" : "text-muted-foreground"
                        }`}
                      >
                        {telegramProfile.is_premium ? "⭐ Telegram Premium" : "Free Tier"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-card"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={updatingProfile}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90 disabled:opacity-50"
              >
                {updatingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{updatingProfile ? "Saving..." : "Save Profile"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: STORIES ================= */}
      {storiesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> Telegram Stories
              </h3>
              <button
                onClick={() => setStoriesModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="file"
                ref={storyFileInputRef}
                onChange={handleUploadStory}
                accept="image/*,video/*"
                className="hidden"
              />

              <div className="p-3 bg-secondary/40 rounded-xl border border-border text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Post a New Story</span>
                  {uploadingStory && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
                <input
                  type="text"
                  value={storyCaption}
                  onChange={(e) => setStoryCaption(e.target.value)}
                  placeholder="Story caption (optional)..."
                  className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs text-foreground outline-none"
                />
                <button
                  type="button"
                  onClick={() => storyFileInputRef.current?.click()}
                  disabled={uploadingStory}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold shadow-xs hover:opacity-90 transition-opacity"
                >
                  + Upload Story Image/Video
                </button>
              </div>

              {/* Active Stories List */}
              <div>
                <h4 className="text-[11px] font-bold uppercase text-muted-foreground mb-2">
                  Active Stories ({stories.length})
                </h4>
                {loadingStories ? (
                  <div className="p-4 flex items-center justify-center text-xs text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading stories...
                  </div>
                ) : stories.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No active stories published on this account.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {stories.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-secondary/50 border border-border flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-foreground truncate max-w-[200px]">
                            {s.caption || "Story Photo"}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            Expires: {s.expire_date ? formatTime(s.expire_date) : "24h"}
                          </p>
                        </div>
                        {s.views && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-primary font-bold">
                            <Eye className="h-3 w-3" /> {s.views}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setStoriesModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-card"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX IMAGE PREVIEW ================= */}
      {activeMediaPreview && (
        <div
          onClick={() => setActiveMediaPreview(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
            <AuthenticatedImage
              src={activeMediaPreview}
              alt="Media Preview"
              className="max-h-[85vh] w-auto object-contain"
            />
            <button
              onClick={() => setActiveMediaPreview(null)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
