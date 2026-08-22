import { useEffect, useState, useRef } from "react";
import { paymentsApi, detail } from "../lib/api";
import { useAuth } from "../lib/auth";
import QRCode from "qrcode";
import {
  CreditCard,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  Copy,
  CheckCircle2,
  X,
  Puzzle,
  Lock,
  ArrowUpRight,
  AlertCircle,
  KeyRound,
  Share2,
  Flame,
  Crown,
  FolderSync,
  MessagesSquare,
  ShieldAlert,
  FileCode,
  QrCode,
  RefreshCw,
  Clock,
  Radio,
  ExternalLink,
} from "lucide-react";

interface PaymentRow {
  order_id: string;
  amount: number;
  currency: string;
  plan_tier?: string;
  billing_cycle?: string;
  status: string;
  created_at: string;
}

interface SubscriptionData {
  plan_tier: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  billing_cycle: string;
  auto_renew: boolean;
  max_accounts: number;
  max_campaigns: number;
  team_seats: number;
}

export default function Billing() {
  const { user } = useAuth();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [orders, setOrders] = useState<PaymentRow[]>([]);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Checkout Modal State
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; price: number; type: "plan" | "module"; period: string } | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState("USDT_TRC20");
  const [depositAddress, setDepositAddress] = useState("");
  const [userTxId, setUserTxId] = useState("");
  const [blockchainChecking, setBlockchainChecking] = useState(false);
  const [blockchainResult, setBlockchainResult] = useState<any>(null);
  const [busyCheckout, setBusyCheckout] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Web App Matched Base Plans
  const PLANS = [
    {
      id: "starter",
      name: "Demo License",
      price: 0,
      priceFormatted: "Free",
      period: "24h trial",
      desc: "Instant testing license for basic evaluation and learning materials.",
      accounts: 5,
      campaigns: 3,
      team_seats: 1,
      features: [
        "24-Hour Access",
        "Up to 5 Accounts",
        "3 Active Campaigns",
        "Basic Module Access",
        "Community Support",
      ],
      popular: false,
    },
    {
      id: "pro_1mo",
      name: "1 Month License",
      price: 120,
      priceFormatted: "$120",
      period: "/ month",
      desc: "Full standard license for active marketers and growth operations.",
      accounts: 50,
      campaigns: 20,
      team_seats: 5,
      features: [
        "30-Day Full Access",
        "Up to 50 Accounts",
        "20 Active Campaigns",
        "All Base Modules Unlocked",
        "Customer Chat & Priority Support",
        "Free Automatic Updates",
      ],
      popular: false,
    },
    {
      id: "pro_1yr",
      name: "1 Year License",
      price: 550,
      priceFormatted: "$550",
      period: "/ year",
      desc: "Our most popular professional tier with maximum savings and features.",
      accounts: 100,
      campaigns: 50,
      team_seats: 10,
      features: [
        "365-Day Access (Save 62%)",
        "Up to 100 Accounts",
        "50 Active Campaigns",
        "All Base Modules Unlocked",
        "VIP Customer Chat (3000+)",
        "Priority 24/7 Support",
        "Free Automatic Updates",
        "Best Value Guarantee",
      ],
      popular: true,
    },
    {
      id: "pro_2yr",
      name: "2 Years License",
      price: 1050,
      priceFormatted: "$1,050",
      period: "/ 2 years",
      desc: "High-capacity tier for sustained long-term marketing agencies.",
      accounts: 200,
      campaigns: 100,
      team_seats: 20,
      features: [
        "730-Day Access (Save 20%)",
        "Up to 200 Accounts",
        "100 Active Campaigns",
        "All Base Modules Unlocked",
        "VIP Customer Chat (3000+)",
        "Priority Support",
        "Free Updates",
      ],
      popular: false,
    },
    {
      id: "pro_3yr",
      name: "3 Years License",
      price: 1350,
      priceFormatted: "$1,350",
      period: "/ 3 years",
      desc: "Ultimate enterprise powerhouse for massive account farms.",
      accounts: 500,
      campaigns: 200,
      team_seats: 50,
      features: [
        "1095-Day Access (Save 38%)",
        "Up to 500 Accounts",
        "200 Active Campaigns",
        "All Base Modules Unlocked",
        "Dedicated Account Manager",
        "Pro Modules Discount",
        "Lifetime Engine Updates",
      ],
      popular: false,
    },
  ];

  // 10 PRO Module Add-ons with dedicated icons & capability chips
  const MODULE_ADDONS = [
    {
      id: "registrar",
      name: "Universal Registrar",
      price: 150,
      desc: "Automated SMS registration & 2FA across 10+ global virtual number providers.",
      icon: KeyRound,
      tags: ["10+ SMS APIs", "Auto 2FA", "Fingerprint Gen"],
      glow: "from-blue-500/20 to-cyan-500/10",
    },
    {
      id: "forwarder",
      name: "Message Forwarder",
      price: 100,
      desc: "Real-time message forwarding, filtering & automated channel broadcast bridge.",
      icon: Share2,
      tags: ["Real-Time Bridge", "Keyword Filter", "Watermark Strip"],
      glow: "from-cyan-500/20 to-teal-500/10",
    },
    {
      id: "booster",
      name: "Account Booster & Warmup",
      price: 80,
      desc: "Autonomous multi-account P2P dialogue generation & human activity simulator.",
      icon: Flame,
      tags: ["P2P AI Dialogues", "Post Views", "Emoji Reactions"],
      glow: "from-amber-500/20 to-orange-500/10",
    },
    {
      id: "interceptor",
      name: "Message Interceptor",
      price: 80,
      desc: "High-speed chat listener & instant buyer lead grabber across target groups.",
      icon: Sparkles,
      tags: ["Keyword Trigger", "Instant Direct DM", "Lead Pipeline"],
      glow: "from-purple-500/20 to-pink-500/10",
    },
    {
      id: "invite_via_admin",
      name: "Invite via Administrator",
      price: 80,
      desc: "Bypass Telegram invite flood limits by routing additions through admin rights.",
      icon: Crown,
      tags: ["Bypass Limits", "Admin Proxy", "Zero Ban Risk"],
      glow: "from-yellow-500/20 to-amber-500/10",
    },
    {
      id: "channel_cloner",
      name: "Channel Cloner",
      price: 80,
      desc: "Clone full posts, history, media & formatting from competitor channels to yours.",
      icon: FolderSync,
      tags: ["1:1 Media Mirror", "History Clone", "Live Mirror"],
      glow: "from-emerald-500/20 to-cyan-500/10",
    },
    {
      id: "chat_cloner",
      name: "Chat Cloner",
      price: 80,
      desc: "Mirror live group conversation flows between source and destination chats.",
      icon: MessagesSquare,
      tags: ["Live Sync", "Traffic Simulator", "Multi-Bot"],
      glow: "from-blue-500/20 to-indigo-500/10",
    },
    {
      id: "reporter",
      name: "The Reporter",
      price: 80,
      desc: "Automated distributed target reporting engine with randomized accounts.",
      icon: ShieldAlert,
      tags: ["Distributed Takedown", "Proxy Rotation", "Report Reasons"],
      glow: "from-red-500/20 to-pink-500/10",
    },
    {
      id: "duplicator",
      name: "Session Duplicator",
      price: 80,
      desc: "Clone active sessions with randomized device signatures and OS parameters.",
      icon: Copy,
      tags: ["Device Fingerprint", "Multi-Thread", "Session Cloner"],
      glow: "from-indigo-500/20 to-purple-500/10",
    },
    {
      id: "converter",
      name: "Format Converter",
      price: 50,
      desc: "Two-way Telethon/Pyrogram SQLite ⇄ Telegram Desktop TData converter.",
      icon: FileCode,
      tags: ["Two-Way TData", "Deep SQLite", "JSON Device Spec"],
      glow: "from-teal-500/20 to-emerald-500/10",
    },
  ];

  // Direct Manual Wallets with Blockchain Barcodes
  const WALLETS: Record<string, { name: string; currency: string; network: string; address: string; explorer: string }> = {
    USDT_TRC20: {
      name: "USDT (Tron TRC-20)",
      currency: "USDT",
      network: "TRC20",
      address: "TXk9Yd5M24dFzQz78PQR88qW9h7XyZ2abc",
      explorer: "https://tronscan.org/#/transaction/",
    },
    USDT_ERC20: {
      name: "USDT (Ethereum ERC-20)",
      currency: "USDT",
      network: "ERC20",
      address: "0x742d35Cc6634C0532925a3b8D4C9B569890FaC1c",
      explorer: "https://etherscan.io/tx/",
    },
    TON: {
      name: "The Open Network (TON)",
      currency: "TON",
      network: "TON",
      address: "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N",
      explorer: "https://tonscan.org/tx/",
    },
    SOL: {
      name: "Solana (SOL)",
      currency: "SOL",
      network: "SOL",
      address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      explorer: "https://solscan.io/tx/",
    },
    BTC: {
      name: "Bitcoin (BTC)",
      currency: "BTC",
      network: "BTC",
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      explorer: "https://mempool.space/tx/",
    },
    ETH: {
      name: "Ethereum (ETH Native)",
      currency: "ETH",
      network: "ETH",
      address: "0x742d35Cc6634C0532925a3b8D4C9B569890FaC1c",
      explorer: "https://etherscan.io/tx/",
    },
  };

  const loadData = async () => {
    try {
      const [subRes, ordersRes, modRes] = await Promise.allSettled([
        paymentsApi.subscription(),
        paymentsApi.orders(),
        paymentsApi.modules(),
      ]);

      if (subRes.status === "fulfilled") setSub(subRes.value.data);
      if (ordersRes.status === "fulfilled") {
        const ordData = ordersRes.value.data;
        setOrders(Array.isArray(ordData) ? ordData : (ordData as any)?.items || []);
      }
      if (modRes.status === "fulfilled") {
        setActiveModules(modRes.value.data?.active || []);
      }
    } catch (err) {
      setError(detail(err));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Render QR Code barcode when modal opens or crypto changes
  useEffect(() => {
    if (selectedItem && qrCanvasRef.current) {
      const w = WALLETS[selectedCrypto] || WALLETS["USDT_TRC20"];
      const payload = `${w.currency.toLowerCase()}:${w.address}`;
      QRCode.toCanvas(
        qrCanvasRef.current,
        payload,
        {
          width: 170,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (err) => {
          if (err) console.error("QR Code Error:", err);
        }
      );
    }
  }, [selectedItem, selectedCrypto]);

  const handleStartCheckout = (item: { id: string; name: string; price: number; type: "plan" | "module"; period: string }) => {
    setSelectedItem(item);
    const w = WALLETS[selectedCrypto] || WALLETS["USDT_TRC20"];
    setDepositAddress(w.address);
    setUserTxId("");
    setBlockchainResult(null);
  };

  const handleSelectCrypto = (coinKey: string) => {
    setSelectedCrypto(coinKey);
    const w = WALLETS[coinKey] || WALLETS["USDT_TRC20"];
    setDepositAddress(w.address);
    setBlockchainResult(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckBlockchain = async () => {
    if (!selectedItem) return;
    setBlockchainChecking(true);
    setBlockchainResult(null);
    setError("");

    try {
      const w = WALLETS[selectedCrypto] || WALLETS["USDT_TRC20"];
      const orderId = `DEP-${Date.now()}`;
      const res = await paymentsApi.checkBlockchain(orderId, {
        tx_hash: userTxId.trim() || undefined,
        network: w.network,
        amount: selectedItem.price,
      });

      const d = res.data;
      setBlockchainResult(d);
      if (d.matched) {
        await loadData();
      }
    } catch (err) {
      setError(detail(err));
    } finally {
      setBlockchainChecking(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-primary" />
            Billing, Licenses & PRO Add-ons
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select your base Telegram Geeks access duration and subscribe to specialized PRO automation modules.
          </p>
        </div>

        {sub && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5 backdrop-blur-md">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active License Tier</div>
              <div className="text-xs font-bold text-foreground capitalize">{sub.plan_tier} Plan ({sub.max_accounts} Accs)</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Base Pricing Plans Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Base Duration Licenses</h2>
            <p className="text-xs text-muted-foreground">Select your platform license duration with full access to 77+ standard modules.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-5 flex flex-col justify-between backdrop-blur-md transition-all duration-200 ${
                plan.popular
                  ? "border-primary/60 bg-primary/[0.04] shadow-lg shadow-primary/5 hover:border-primary"
                  : "border-border bg-card/40 hover:bg-card/70 hover:border-border/80"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-primary to-cyan-400 px-2.5 py-0.5 text-[10px] font-bold text-black shadow-sm">
                  MOST POPULAR
                </span>
              )}

              <div>
                <h3 className="font-bold text-sm text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-2xl font-extrabold text-primary">{plan.priceFormatted}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{plan.desc}</p>

                <div className="space-y-2 border-t border-border/50 pt-3 mb-6">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleStartCheckout({ id: plan.id, name: plan.name, price: plan.price, type: "plan", period: plan.period })}
                disabled={plan.price === 0}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  plan.popular
                    ? "bg-gradient-to-r from-primary to-cyan-400 text-black shadow-md hover:opacity-90"
                    : plan.price === 0
                    ? "bg-secondary text-muted-foreground cursor-default"
                    : "bg-card border border-border text-foreground hover:bg-primary/10 hover:border-primary/40"
                }`}
              >
                {plan.price === 0 ? "Default Plan" : <>Purchase <ArrowUpRight className="h-3.5 w-3.5" /></>}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Redesigned Luxury PRO Module Add-ons Section */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">PRO Module Add-ons</h2>
              <Puzzle className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">
              Elite monthly subscriptions for high-tier automation capabilities, reverse parsers, and custom bypass tools.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {MODULE_ADDONS.map((m) => {
            const isSubscribed = activeModules.includes(m.id);
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                className={`group relative rounded-2xl border p-5 flex flex-col justify-between backdrop-blur-md transition-all duration-300 ${
                  isSubscribed
                    ? "border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.06] to-transparent shadow-md shadow-emerald-500/5"
                    : "border-border/70 bg-gradient-to-b from-card/60 to-card/20 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                }`}
              >
                <div>
                  {/* Top Bar: Icon + Status Pill */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>

                    {isSubscribed ? (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        PRO
                      </span>
                    )}
                  </div>

                  {/* Title & Pricing */}
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors mb-1.5 leading-snug">
                    {m.name}
                  </h3>

                  <div className="flex items-baseline gap-1 mb-2.5">
                    <span className="text-2xl font-extrabold text-foreground tracking-tight">${m.price}</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 min-h-[38px]">
                    {m.desc}
                  </p>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {m.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-background/80 border border-border/50 text-muted-foreground font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleStartCheckout({ id: m.id, name: m.name, price: m.price, type: "module", period: "/ month" })}
                  disabled={isSubscribed}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSubscribed
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
                      : "bg-gradient-to-r from-primary to-cyan-400 text-black shadow-md hover:opacity-90 active:scale-[0.98]"
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Subscribed
                    </>
                  ) : (
                    <>
                      Subscribe Now <ArrowUpRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Orders History Table */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Order & Invoice History</h2>
          <p className="text-xs text-muted-foreground">Review your crypto transaction records and activation status.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/30 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-card/60 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium">Order ID</th>
                <th className="px-5 py-3 font-medium">Plan / Item</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {orders.map((o, idx) => (
                <tr key={o.order_id || idx} className="hover:bg-card/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-muted-foreground">{o.order_id || `ORD-${idx + 1001}`}</td>
                  <td className="px-5 py-3 font-medium capitalize">{o.plan_tier || "Pro Tier"}</td>
                  <td className="px-5 py-3 font-bold text-primary">${o.amount || 120} {o.currency || "USD"}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      o.status === "completed" || o.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {o.status || "Completed"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{o.created_at ? new Date(o.created_at).toLocaleDateString() : "Recent"}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No payment orders recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Manual Crypto Deposit Barcode & Auto-Monitor Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Manual Crypto Deposit & Auto-Scanner
                </h3>
                <p className="text-xs text-muted-foreground">Item: <strong className="text-foreground">{selectedItem.name}</strong> ({selectedItem.period})</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="rounded-2xl bg-background/80 p-4 border border-border flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Amount Due</div>
                  <div className="text-2xl font-extrabold text-primary">${selectedItem.price}.00 USD</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Detection Engine</div>
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-end">
                    <Radio className="h-3 w-3 animate-pulse" /> On-Chain Auto Monitor
                  </div>
                </div>
              </div>

              {/* Fee Notice Banner */}
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>Important: Network / Gas Fee Guidance</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Always add <strong>$10 – $15 extra</strong> to your transfer to ensure the received net balance covers the order. The blockchain monitor scans for the transaction and automatically activates your license once confirmed.
                </p>
              </div>

              {/* Crypto Selector */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Select Transfer Network</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(WALLETS).map((coinKey) => (
                    <button
                      key={coinKey}
                      type="button"
                      onClick={() => handleSelectCrypto(coinKey)}
                      className={`rounded-xl px-3 py-2 text-xs font-medium border transition-all ${
                        selectedCrypto === coinKey
                          ? "border-primary bg-primary/15 text-primary font-bold shadow-sm"
                          : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {WALLETS[coinKey].name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barcode QR and Deposit Address */}
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-border bg-background/60 p-4">
                <div className="p-2 bg-white rounded-xl shadow-inner shrink-0">
                  <canvas ref={qrCanvasRef} className="block" />
                </div>

                <div className="flex-1 w-full space-y-2">
                  <span className="text-xs font-medium text-muted-foreground block">
                    Deposit Wallet Address ({WALLETS[selectedCrypto]?.network})
                  </span>
                  <div className="flex items-center gap-2 rounded-xl bg-background border border-border p-2.5">
                    <span className="font-mono text-xs text-foreground truncate select-all">{depositAddress}</span>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg bg-card hover:bg-card/80 text-primary shrink-0 transition-colors"
                      title="Copy Address"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  {copied && <span className="text-[10px] text-emerald-400 block">Address copied!</span>}
                </div>
              </div>

              {/* Optional TXID Submit / Live Blockchain Verification */}
              <div className="rounded-2xl border border-border bg-card/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Fast-Track On-Chain Verification</span>
                  <span className="text-[10px] text-muted-foreground">Optional TX Hash</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter blockchain TX Hash (e.g. 0x... or Tron txid)"
                    value={userTxId}
                    onChange={(e) => setUserTxId(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCheckBlockchain}
                    disabled={blockchainChecking}
                    className="px-4 py-2 rounded-xl bg-primary text-black font-bold text-xs shadow-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${blockchainChecking ? "animate-spin" : ""}`} />
                    <span>{blockchainChecking ? "Scanning…" : "Verify Deposit"}</span>
                  </button>
                </div>

                {blockchainResult && (
                  <div className={`p-3 rounded-xl text-xs border ${
                    blockchainResult.matched
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-background/80 border-border text-muted-foreground"
                  }`}>
                    {blockchainResult.matched ? (
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Payment Confirmed! License Activated.
                        </span>
                        {blockchainResult.explorer_url && (
                          <a
                            href={blockchainResult.explorer_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            Explorer <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span>{blockchainResult.message || "Awaiting on-chain transfer detection."}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
