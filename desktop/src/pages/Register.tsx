import { FormEvent, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, meApi, detail } from "../lib/api";
import { useAuth, SessionUser } from "../lib/auth";
import { ParticleMeshBackground } from "../components/ParticleMeshBackground";
import { BrandLogo } from "../components/BrandLogo";
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
  Layers,
  Cpu,
} from "lucide-react";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);

  // Password criteria check
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
    return score;
  }, [password, passwordCriteria]);

  const strengthLabel = useMemo(() => {
    if (!password) return { text: "Enter password", color: "bg-muted text-muted-foreground", width: "w-0" };
    if (strengthScore <= 1) return { text: "Weak", color: "bg-destructive text-destructive", width: "w-1/4" };
    if (strengthScore === 2) return { text: "Fair", color: "bg-amber-500 text-amber-400", width: "w-2/4" };
    if (strengthScore === 3) return { text: "Good", color: "bg-cyan-500 text-cyan-400", width: "w-3/4" };
    return { text: "Strong", color: "bg-emerald-500 text-emerald-400", width: "w-full" };
  }, [password, strengthScore]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await authApi.register(email, password, fullName);
      const r = await authApi.login(email, password);
      const token = r.data.access_token;
      await window.api?.tokenSet(token);
      
      let me: SessionUser = { id: 1, email, role: "admin", full_name: fullName };
      try {
        const meRes = await meApi.me();
        if (meRes.data) me = meRes.data;
      } catch {
        // Fallback
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
        
        {/* Left Side: Desktop Features */}
        <div className="hidden md:flex md:col-span-6 flex-col justify-between space-y-6 pr-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4 shadow-sm shadow-primary/10">
              <Cpu className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span>Dedicated Operator License</span>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight leading-snug">
              Setup Your Local{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                Command Center
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Create an operator account to unlock high-concurrency Telegram automation, multi-proxy rotation, and AI persona training.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-card/60 backdrop-blur-md border border-border flex items-start gap-3 shadow-sm">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Complete 77 Modules</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Scrapers, warmers, 2-way converters, and invitation engines.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card/60 backdrop-blur-md border border-border flex items-start gap-3 shadow-sm">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Autonomous AI Personas</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Dynamic 3-tier memory, prompt tuning, and natural chat synthesis.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">Local SQLite Engine</span>
            </div>
            <span className="font-mono text-muted-foreground">Zero Cloud Lock-in</span>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="md:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-7 shadow-2xl shadow-black/50 relative">
            
            {/* Header */}
            <div className="mb-6">
              <BrandLogo size="md" to="/register" className="mb-3" />
              <h3 className="text-base font-bold text-foreground mt-4">Create account</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Initialize your operator identity on this workstation.</p>
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
                <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="fullName">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition"
                    placeholder="Alex Mercer"
                  />
                </div>
              </div>

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
                    placeholder="alex@company.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="password">
                  Password <span className="text-[11px] text-muted-foreground font-normal">(Min 12 chars)</span>
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
                    autoComplete="new-password"
                    required
                    minLength={12}
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

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-2 rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Provisioning...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 pt-5 border-t border-border/80 text-center">
              <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Sign in
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}