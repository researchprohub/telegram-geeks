import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, detail } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Register() {
  const [fullName, setFullName] = useState("");
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
      await authApi.register(email, password, fullName);
      const r = await authApi.login(email, password);
      const token = r.data.access_token;
      await window.api?.tokenSet(token);
      const me = await fetch("http://127.0.0.1:8765/api/v1/auth/me", { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json());
      setSession(token, me);
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
        <h1 className="text-xl text-primary">Create account</h1>
        <div>
          <label className="label" htmlFor="fullName">Full name</label>
          <input id="fullName" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        <p className="text-center text-sm text-muted-foreground">
          Have an account? <Link className="text-primary" to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}