import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, meApi, detail } from "../lib/api";
import { useAuth, SessionUser } from "../lib/auth";
import { ParticleMeshBackground } from "../components/ParticleMeshBackground";
import { BrandLogo } from "../components/BrandLogo";
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
  Cpu,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);

  const handleFillDemo = (type: "admin" | "demo") => {
    if (type === "admin") {
      setEmail("admin@test.com");
      setPassword("admin123");
    } else {
      setEmail("demo@test.com");
      setPassword("demo123");
    }
    setError("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await authApi.login(email, password);
      const token = r.data.access_token;
      await window.api?.tokenSet(token);
      
      let me: SessionUser = { id: 1, email, role: "admin" };
      try {
        const meRes = await meApi.me();
        if (meRes.data) me = meRes.data;
      } catch {
        // Fallback user object
      }

      setSession(token, me);
      navigate("/");
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background text-foreground overflow-hidden p-6">
      {/* Particle Mesh Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
        <ParticleMeshBackground />
      </div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(47,252,212,0.1),transparent)] z-0" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Desktop Features & Engine Status */}
        <div className="hidden md:flex md:col-span-6 flex-col justify-between space-y-6 pr-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4 shadow-sm shadow-primary/10">
              <Cpu className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span>Desktop Engine v2.4 Native</span>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight leading-snug">
              Local Power,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                Zero Cloud Lock-in
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Standalone Windows automation workstation with direct hardware DPAPI encryption, embedded SQLite, and 77 MTProto modules.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-card/60 backdrop-blur-md border border-border flex items-start gap-3 shadow-sm">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">77 Automation Modules</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">High-speed scrapers, 2-way converters, warmers, & flood checkers.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card/60 backdrop-blur-md border border-border flex items-start gap-3 shadow-sm">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Autonomous AI Persona Memory</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Dual Soul Prompts, emotional states, and contextual warmups.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-foreground font-medium">Local Engine:</span>
              <span className="text-emerald-400 font-semibold">Active (127.0.0.1)</span>
            </div>
            <span className="font-mono text-muted-foreground">DPAPI Encrypted</span>
          </div>
        </div>

        {/* Right Side: Sign-In Form */}
        <div className="md:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-7 shadow-2xl shadow-black/50 relative">
            
            {/* Header */}
            <div className="mb-6">
              <BrandLogo size="md" to="/login" className="mb-3" />
              <p className="text-xs text-muted-foreground mt-0.5">Enter your operator credentials to access workstation.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition"
                    placeholder="admin@test.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition"
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
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

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-2 rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 pt-5 border-t border-border/80 text-center">
              <p className="text-xs text-muted-foreground">
                Need an account?{" "}
                <Link to="/register" className="text-primary hover:underline font-semibold">
                  Register here
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}