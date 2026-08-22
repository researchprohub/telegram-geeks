"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { authApi } from "@/lib/api";
import { ParticleMeshBackground } from "@/components/marketing/TelegramExpertAnimation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  Zap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  Bot,
  Layers,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type: "pro" | "admin") => {
    if (type === "pro") {
      setEmail("demo@test.com");
      setPassword("demo123");
    } else {
      setEmail("admin@test.com");
      setPassword("admin123");
    }
    setError("");
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground relative overflow-hidden">
      {/* Background Particle Mesh */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0">
        <ParticleMeshBackground />
      </div>
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(47,252,212,0.08),transparent)] z-0" />

      {/* Main Container */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Brand & Feature Showcase (Visible on Large Screens) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4"
          >
            {/* Top Brand Pill */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6 shadow-sm shadow-primary/10">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>Next-Gen Telegram Automation OS</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                Scale Telegram Growth with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                  AI Precision
                </span>
              </h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                77+ high-concurrency MTProto modules, autonomous persona warming, neuro-text generation, and anti-detection shields.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-card/60 backdrop-blur-md border border-border flex items-start gap-3.5 hover:border-primary/30 transition-colors shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">77+ Automation Modules</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Scrapers, 2-way TData converters, bulk invite engines, & warmers.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-card/60 backdrop-blur-md border border-border flex items-start gap-3.5 hover:border-primary/30 transition-colors shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Autonomous AI Personas</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Dual Soul Prompts, 3-tier memory engine, and conversational warmup.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-card/60 backdrop-blur-md border border-border flex items-start gap-3.5 hover:border-primary/30 transition-colors shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Zero-Ban Fingerprint Cloaking</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Predictive flood guards, anomaly detection, & rotating 4G proxy pools.</p>
                </div>
              </div>
            </div>

            {/* Live Stats Pill */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border/80 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-muted-foreground">Global API Cluster:</span>
                <span className="font-semibold text-foreground">Online</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>⚡ Latency: <strong className="text-foreground font-mono">38ms</strong></span>
                <span>🔒 MTProto Encrypted</span>
              </div>
            </div>
          </motion.div>

          {/* Right Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="lg:col-span-6 w-full max-w-md mx-auto"
          >
            <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-7 lg:p-8 shadow-2xl shadow-black/40 relative overflow-hidden">
              
              {/* Header */}
              <div className="mb-6">
                <BrandLogo size="md" href="/" className="mb-4" />
                <h3 className="text-lg font-bold text-foreground mt-4">Welcome back</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Sign in to your control center to manage accounts and campaigns.</p>
              </div>
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive flex items-center gap-2.5"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition"
                      placeholder="name@company.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-foreground">
                      Password
                    </label>
                    <Link
                      href="/contact"
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      Need help?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition"
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-border bg-secondary text-primary focus:ring-primary/30 h-3.5 w-3.5"
                    />
                    <span>Remember this device</span>
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to Workspace <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 pt-5 border-t border-border/80 text-center">
                <p className="text-xs text-muted-foreground">
                  Don't have an account yet?{" "}
                  <Link href="/register" className="text-primary hover:underline font-semibold">
                    Create an account
                  </Link>
                </p>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
