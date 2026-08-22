import { useState, useEffect } from "react";
import { modulesApi, accountsApi, detail } from "../lib/api";
import {
  Zap,
  Flame,
  MessageSquare,
  Eye,
  Heart,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Sparkles,
  Users,
  Activity,
  Sliders,
} from "lucide-react";

export default function Booster() {
  const [activeTab, setActiveTab] = useState<"dialogues" | "views" | "reactions" | "schedule">("dialogues");
  const [accounts, setAccounts] = useState<any[]>([]);

  // Dialogues Form
  const [selectedAccIds, setSelectedAccIds] = useState<number[]>([]);
  const [dialogueTopic, setDialogueTopic] = useState("crypto_discussion");
  const [rounds, setRounds] = useState(10);
  const [delayMin, setDelayMin] = useState(5);
  const [delayMax, setDelayMax] = useState(15);
  const [typingSim, setTypingSim] = useState(true);

  // Views Booster Form
  const [postLinks, setPostLinks] = useState("");
  const [viewsCount, setViewsCount] = useState(500);
  const [useProxies, setUseProxies] = useState(true);

  // Reactions Booster Form
  const [targetPost, setTargetPost] = useState("");
  const [selectedReactions, setSelectedReactions] = useState<string[]>(["👍", "🔥", "❤️", "🚀"]);
  const [reactionsCount, setReactionsCount] = useState(50);

  // Status & Logs
  const [busy, setBusy] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const TOPICS = [
    { id: "crypto_discussion", name: "Crypto & Web3 Market Trends" },
    { id: "tech_ai", name: "AI Tech, Coding & Automation" },
    { id: "casual_chat", name: "Casual Everyday Conversation" },
    { id: "business_ecom", name: "Business, Marketing & E-Commerce" },
    { id: "gaming_lifestyle", name: "Gaming, Memes & Lifestyle" },
  ];

  const EMOJIS = ["👍", "❤️", "🔥", "🚀", "🎉", "👏", "🤩", "⚡", "💯", "👌"];

  useEffect(() => {
    (async () => {
      try {
        const res = await accountsApi.list(1, 200);
        const raw = res.data;
        const list = (raw as any)?.items ?? (Array.isArray(raw) ? raw : []);
        setAccounts(list);
        if (list.length > 0) {
          setSelectedAccIds(list.slice(0, 5).map((a: any) => a.id));
        }
      } catch {}
    })();
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const handleStartDialogueWarmup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccIds.length < 2) {
      setError("Please select at least 2 accounts to conduct peer-to-peer dialogues.");
      return;
    }
    setBusy(true);
    setIsRunning(true);
    setError("");
    setSuccessMsg("");
    addLog(`Initiating peer-to-peer warmup across ${selectedAccIds.length} accounts (Topic: ${dialogueTopic})...`);

    try {
      const res = await modulesApi.execute("booster", "start_dialogue_warmup", {
        account_ids: selectedAccIds,
        topic: dialogueTopic,
        rounds: rounds,
        delay_min: delayMin,
        delay_max: delayMax,
        simulate_typing: typingSim,
      });
      const d = res.data as any;
      addLog(`Warmup process started: ${JSON.stringify(d?.data || d?.message || "OK")}`);
      setSuccessMsg("Multi-account warmup engine is actively generating dialogues!");
    } catch (err) {
      setError(detail(err));
      addLog(`Error: ${detail(err)}`);
      setIsRunning(false);
    } finally {
      setBusy(false);
    }
  };

  const handleRunViewsBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postLinks.trim()) {
      setError("Please specify at least one Telegram post URL.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccessMsg("");
    addLog(`Sending ${viewsCount} post views boost via proxy network...`);

    try {
      const links = postLinks.split("\n").map((l) => l.trim()).filter(Boolean);
      const res = await modulesApi.execute("views_boost", "boost_post_views", {
        posts: links,
        views_target: viewsCount,
        use_proxy_pool: useProxies,
      });
      addLog(`Views boost completed: ${JSON.stringify(res.data || "Success")}`);
      setSuccessMsg(`Successfully queued ${viewsCount} impressions across target posts!`);
    } catch (err) {
      setError(detail(err));
      addLog(`Error: ${detail(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRunReactions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPost.trim()) {
      setError("Please enter a valid post URL.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccessMsg("");
    addLog(`Dispatching ${reactionsCount} reactions to ${targetPost}...`);

    try {
      const res = await modulesApi.execute("reactions", "boost_reactions", {
        post_url: targetPost,
        reactions: selectedReactions,
        count: reactionsCount,
        account_ids: selectedAccIds.length > 0 ? selectedAccIds : undefined,
      });
      addLog(`Reactions dispatched: ${JSON.stringify(res.data || "Success")}`);
      setSuccessMsg(`Dispatched ${reactionsCount} randomized emoji reactions!`);
    } catch (err) {
      setError(detail(err));
      addLog(`Error: ${detail(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const toggleReaction = (emoji: string) => {
    if (selectedReactions.includes(emoji)) {
      if (selectedReactions.length > 1) {
        setSelectedReactions(selectedReactions.filter((e) => e !== emoji));
      }
    } else {
      setSelectedReactions([...selectedReactions, emoji]);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Zap className="h-6 w-6 text-amber-400" />
            Account Booster & Activity Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Simulate realistic human behavior, automated peer-to-peer dialogues, post views, and reaction spikes.
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("dialogues")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "dialogues"
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Peer-to-Peer Dialogues</span>
        </button>

        <button
          onClick={() => setActiveTab("views")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "views"
              ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <Eye className="h-4 w-4" />
          <span>Views Booster (via Proxy)</span>
        </button>

        <button
          onClick={() => setActiveTab("reactions")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "reactions"
              ? "bg-pink-500/15 text-pink-400 border border-pink-500/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <Heart className="h-4 w-4" />
          <span>Reaction Booster</span>
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "schedule"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Warmup Schedule & Rules</span>
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form (2 cols) */}
        <div className="lg:col-span-2">
          {/* TAB 1: Peer-to-Peer Dialogues */}
          {activeTab === "dialogues" && (
            <form onSubmit={handleStartDialogueWarmup} className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Autonomous AI Dialogues</h3>
                <p className="text-xs text-muted-foreground">
                  Select 2 or more accounts. They will automatically start realistic conversations with each other using AI neuro-text templates.
                </p>
              </div>

              <div className="space-y-4">
                {/* Account Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Select Warmup Accounts ({selectedAccIds.length} chosen)</label>
                    <button
                      type="button"
                      onClick={() => setSelectedAccIds(accounts.map((a) => a.id))}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-border bg-background/60 p-2.5 space-y-1.5 custom-scrollbar">
                    {accounts.map((acc) => (
                      <label key={acc.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-card p-1 rounded">
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
                        {acc.first_name && <span className="text-muted-foreground">({acc.first_name})</span>}
                      </label>
                    ))}
                    {accounts.length === 0 && <p className="text-xs text-muted-foreground p-2">No accounts found in system.</p>}
                  </div>
                </div>

                {/* Topic Selector */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Dialogue Topic & Personality</label>
                  <select
                    value={dialogueTopic}
                    onChange={(e) => setDialogueTopic(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    {TOPICS.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Delay and Rounds */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Exchange Rounds</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={rounds}
                      onChange={(e) => setRounds(Number(e.target.value) || 1)}
                      className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Min Delay (s)</label>
                    <input
                      type="number"
                      min={1}
                      value={delayMin}
                      onChange={(e) => setDelayMin(Number(e.target.value) || 1)}
                      className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Max Delay (s)</label>
                    <input
                      type="number"
                      min={1}
                      value={delayMax}
                      onChange={(e) => setDelayMax(Number(e.target.value) || 1)}
                      className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="typingSim"
                    checked={typingSim}
                    onChange={(e) => setTypingSim(e.target.checked)}
                    className="h-4 w-4 accent-primary rounded"
                  />
                  <label htmlFor="typingSim" className="text-xs text-foreground">
                    Send real MTProto `SendMessageTypingAction` before dispatching messages.
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="h-4 w-4 fill-black" />
                  <span>{busy ? "Starting Warmup…" : "Start Dialogue Warmup"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Views Booster */}
          {activeTab === "views" && (
            <form onSubmit={handleRunViewsBoost} className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Post Views Booster</h3>
                <p className="text-xs text-muted-foreground">Boost channel post impressions across public Telegram channels using fast SOCKS5 proxies.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target Post URLs (One per line)</label>
                  <textarea
                    rows={4}
                    value={postLinks}
                    onChange={(e) => setPostLinks(e.target.value)}
                    placeholder="https://t.me/channel_name/123&#10;https://t.me/channel_name/124"
                    required
                    className="w-full rounded-xl border border-border bg-background/80 p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target Views Count</label>
                    <input
                      type="number"
                      min={50}
                      max={50000}
                      step={50}
                      value={viewsCount}
                      onChange={(e) => setViewsCount(Number(e.target.value) || 50)}
                      className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="useProx"
                      checked={useProxies}
                      onChange={(e) => setUseProxies(e.target.checked)}
                      className="h-4 w-4 accent-primary rounded"
                    />
                    <label htmlFor="useProx" className="text-xs text-foreground">
                      Rotate through SOCKS5 proxy pool
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-primary text-black text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>{busy ? "Dispatching Views…" : "Boost Post Views"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Reactions */}
          {activeTab === "reactions" && (
            <form onSubmit={handleRunReactions} className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Post Emoji Reaction Booster</h3>
                <p className="text-xs text-muted-foreground">Send organic-looking reaction spikes (fires, hearts, rockets) to channel posts.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target Post URL</label>
                  <input
                    type="text"
                    value={targetPost}
                    onChange={(e) => setTargetPost(e.target.value)}
                    placeholder="https://t.me/channel_name/123"
                    required
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Select Reaction Emojis to Randomize</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => toggleReaction(emoji)}
                        className={`h-10 w-10 rounded-xl text-lg flex items-center justify-center border transition-all ${
                          selectedReactions.includes(emoji)
                            ? "bg-pink-500/20 border-pink-500 scale-110 shadow-sm"
                            : "bg-background/60 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Reactions Count</label>
                  <input
                    type="number"
                    min={5}
                    max={1000}
                    value={reactionsCount}
                    onChange={(e) => setReactionsCount(Number(e.target.value) || 5)}
                    className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-400 text-white text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Heart className="h-4 w-4 fill-white" />
                  <span>{busy ? "Dispatching…" : "Send Reactions"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Schedule */}
          {activeTab === "schedule" && (
            <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">Recommended Progressive Warmup Schedule</h3>
                <p className="text-xs text-muted-foreground">Follow this roadmap to build 100% account trust score and avoid early spam block.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-background/60 border border-border/50">
                  <span className="font-bold text-amber-400 block mb-1">Day 1 - 2: Account Activation</span>
                  <p className="text-muted-foreground text-[11px]">Set avatar, bio, username. Join 2-3 channels. Stay idle for 24 hours.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-background/60 border border-border/50">
                  <span className="font-bold text-cyan-400 block mb-1">Day 3 - 4: Peer Dialogue Phase</span>
                  <p className="text-muted-foreground text-[11px]">Run 5-10 dialogue rounds between farm accounts. Scroll 10+ channel posts.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-background/60 border border-border/50">
                  <span className="font-bold text-primary block mb-1">Day 5 - 6: Reaction & Light Outreach</span>
                  <p className="text-muted-foreground text-[11px]">Post reactions to public channels. Send 5-10 direct messages with Spintax.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-background/60 border border-border/50">
                  <span className="font-bold text-emerald-400 block mb-1">Day 7+: Full Scale Operation</span>
                  <p className="text-muted-foreground text-[11px]">Uncapped campaign mode. Up to 40-50 messages per account per day safely.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Log Stream Panel */}
        <div className="rounded-2xl border border-border bg-card/30 p-5 backdrop-blur-md flex flex-col justify-between h-[480px]">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Activity className="h-4 w-4 text-amber-400" />
                <span>Booster Activity Log</span>
              </div>
              <button onClick={() => setLogs([])} className="text-[10px] text-muted-foreground hover:text-foreground">
                Clear
              </button>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] overflow-y-auto max-h-[360px] custom-scrollbar pr-1">
              {logs.map((l, i) => (
                <div key={i} className="text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-2">
                  {l}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-16 text-muted-foreground text-xs font-sans">
                  No active operations. Launch a warmup, view, or reaction task to view real-time events.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Anti-Spam Throttling: <strong>Active</strong></span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Safe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}