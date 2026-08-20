import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, detail } from "../lib/api";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await authApi.login(email, password);
      const token = r.data.access_token;
      await window.api?.tokenSet(token);
      const me = await api.get("/auth/me");
      setSession(token, me.data);
      navigate("/");
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form className="card w-full max-w-sm space-y-4 p-6" onSubmit={submit}>
        <h1 className="text-xl text-primary">Sign in</h1>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="text-center text-xs text-muted-foreground">
          Demo: <span className="text-foreground">admin@test.com / admin123</span>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          No account? <Link className="text-primary" to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}