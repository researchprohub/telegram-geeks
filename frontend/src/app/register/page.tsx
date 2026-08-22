"use client";

import { useState, useMemo } from "react";
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
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  Check,
  Bot,
  PenTool,
  Shield,
  Layers,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("operator");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password strength calculation
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 12,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^a-zA-Z0-9]/.test(password),
    };
  }, [password]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (passwordCriteria.hasLetter && passwordCriteria.hasNumber) score++;
    if (passwordCriteria.hasSpecial) score++;
    return score; // 0 to 4
  }, [password, passwordCriteria]);

  const strengthLabel = useMemo(() => {
    if (!password) return { text: "Enter password", color: "bg-muted text-muted-foreground", width: "w-0" };
    if (strengthScore <= 1) return { text: "Weak", color: "bg-destructive text-destructive", width: "w-1/4" };
    if (strengthScore === 2) return { text: "Fair", color: "bg-amber-500 text-amber-400", width: "w-2/4" };
    if (strengthScore === 3) return { text: "Good", color: "bg-cyan-500 text-cyan-400", width: "w-3/4" };
    return { text: "Strong", color: "bg-emerald-500 text-emerald-400", width: "w-full" };
  }, [password, strengthScore]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError("Please accept the terms and service agreement to proceed.");
      return;
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.register(email, password, fullName, role);
      // Auto-login / redirect after registration
      router.push(role === "writer" ? "/dashboard/blog" : "/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
          
          {/* Left Hero Showcase */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6 shadow-sm shadow-primary/10">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>Instant Workspace Setup</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                Unlock Enterprise-Grade{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                  Telegram Automation
                </span>
              </h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                Join thousands of operators utilizing autonomous AI personas, high-speed scrapers, and intelligent account warming.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-card/60 backdrop-blur-md border border-border flex items-start gap-3.5 hover:border-primary/30 transition-colors shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Complete 77-Module Suite</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Instant access to conversion, scraping, mass messaging, and group tools.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-card/60 backdrop-blur-md border border-border flex items-start gap-3.5 hover:border-primary/30 transition-colors shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">AI Neuro-Text Engine</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Context-aware natural conversations, multi-language translation, & spam evasion.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-card/60 backdrop-blur-md border border-border flex items-start gap-3.5 hover:border-primary/30 transition-colors shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Encrypted Local & Cloud Execution</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Seamless synchronization across Web App and Windows Desktop Client.</p>
                </div>
              </div>
            </div>

            {/* Security Guarantee Pill */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border/80 text-xs">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Zero Cloud Lock-in</span>
              </div>
              <span className="text-muted-foreground">Self-Hosted Sessions & Dedicated DB</span>
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
                <h3 className="text-lg font-bold text-foreground mt-4">Create your account</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Get started with our full automation platform in seconds.</p>
              </div>

              {/* Error Alert */}
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

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition"
                      placeholder="Alex Mercer"
                      autoComplete="name"
                    />
                  </div>
                </div>

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
                      placeholder="alex@company.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Password <span className="text-[11px] text-muted-foreground font-normal">(Min 12 characters)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition"
                      placeholder="••••••••••••"
                      required
                      minLength={12}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Strength:</span>
                        <span className={`font-semibold ${strengthLabel.color.split(" ")[1]}`}>
                          {strengthLabel.text}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strengthLabel.color.split(" ")[0]} ${strengthLabel.width}`}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-muted-foreground">
                        <span className={`flex items-center gap-1 ${passwordCriteria.length ? "text-emerald-400 font-medium" : ""}`}>
                          {passwordCriteria.length ? <Check className="h-3 w-3" /> : "•"} 12+ chars
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasLetter ? "text-emerald-400 font-medium" : ""}`}>
                          {passwordCriteria.hasLetter ? <Check className="h-3 w-3" /> : "•"} Letters
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasNumber ? "text-emerald-400 font-medium" : ""}`}>
                          {passwordCriteria.hasNumber ? <Check className="h-3 w-3" /> : "•"} Numbers
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="rounded border-border bg-secondary text-primary focus:ring-primary/30 h-4 w-4 mt-0.5"
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
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
                      <Loader2 className="h-4 w-4 animate-spin" /> Provisioning Workspace...
                    </>
                  ) : (
                    <>
                      Create Workspace <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 pt-5 border-t border-border/80 text-center">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline font-semibold">
                    Sign in
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
