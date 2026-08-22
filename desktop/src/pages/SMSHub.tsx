import { useEffect, useState } from "react";
import { smsApi, detail } from "../lib/api";
import { Smartphone, RefreshCw, Key, ShieldCheck, PhoneCall, CheckCircle2, AlertCircle } from "lucide-react";

export default function SMSHub() {
  const [providers, setProviders] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Key configuration
  const [selectedProvider, setSelectedProvider] = useState("");
  const [apiKey, setApiKey] = useState("");

  // Number Request
  const [targetProvider, setTargetProvider] = useState("5sim");
  const [targetCountry, setTargetCountry] = useState("any");
  const [activeNumber, setActiveNumber] = useState<any>(null);

  // SMS Code polling
  const [smsCode, setSmsCode] = useState("");
  const [polling, setPolling] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [pRes, hRes] = await Promise.allSettled([
        smsApi.listProviders(),
        smsApi.health(),
      ]);
      if (pRes.status === "fulfilled") {
        const raw = pRes.value.data?.providers ?? pRes.value.data ?? [];
        setProviders(Array.isArray(raw) ? raw : []);
      }
      if (hRes.status === "fulfilled") setHealth(hRes.value.data);
    } catch (err) {
      setError(detail(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleConfigure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !apiKey) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await smsApi.configure(selectedProvider, apiKey);
      setSuccess(`Provider ${selectedProvider} configured successfully.`);
      setApiKey("");
      await load();
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGetNumber = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const r = await smsApi.getPhone({
        provider: targetProvider,
        country: targetCountry,
        service: "telegram",
      });
      setActiveNumber(r.data);
      setSuccess(`Purchased number: ${r.data?.phone || JSON.stringify(r.data)}`);
    } catch (err) {
      setError(detail(err));
    } finally {
      setBusy(false);
    }
  };

  const handlePollCode = async () => {
    if (!activeNumber?.phone) return;
    setPolling(true);
    setError("");
    try {
      const r = await smsApi.getCode(activeNumber.phone, activeNumber.provider || targetProvider);
      if (r.data?.code) {
        setSmsCode(r.data.code);
        setSuccess(`Received SMS Code: ${r.data.code}`);
      } else {
        setSuccess("Waiting for SMS code from Telegram...");
      }
    } catch (err) {
      setError(detail(err));
    } finally {
      setPolling(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            SMS & Registrar Gateway
          </h1>
          <p className="text-sm text-muted-foreground">
            Multi-provider SMS activation hub (5SIM, SMS-Activate, Grizzly) & automated account registration.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {error && <div className="card border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
      {success && <div className="card border-primary/50 bg-primary/10 p-3 text-xs text-primary">{success}</div>}

      {/* Grid: Purchase Number & Configure Provider */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Purchase Number */}
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-primary" />
            Order Verification Number
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">SMS Provider</label>
              <select
                className="input mt-1"
                value={targetProvider}
                onChange={(e) => setTargetProvider(e.target.value)}
              >
                <option value="5sim">5SIM</option>
                <option value="sms_activate">SMS-Activate</option>
                <option value="grizzly">Grizzly SMS</option>
                <option value="vaksms">VakSMS</option>
                <option value="smspool">SMSPool</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Country</label>
              <input
                type="text"
                className="input mt-1"
                placeholder="any, usa, germany, indonesia, etc."
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
              />
            </div>
            <button
              onClick={handleGetNumber}
              disabled={busy}
              className="btn-primary w-full"
            >
              Get Telegram Number
            </button>
          </div>

          {activeNumber && (
            <div className="mt-4 rounded-lg border border-border p-4 bg-background/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Active Number</span>
                <span className="font-mono text-sm font-bold text-primary">{activeNumber.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Provider</span>
                <span className="text-xs font-medium text-foreground">{activeNumber.provider || targetProvider}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handlePollCode}
                  disabled={polling}
                  className="btn-secondary flex-1 text-xs"
                >
                  {polling ? "Checking..." : "Fetch SMS Code"}
                </button>
              </div>
              {smsCode && (
                <div className="mt-2 rounded bg-primary/10 border border-primary/30 p-2 text-center">
                  <div className="text-xs text-muted-foreground">Telegram Verification Code</div>
                  <div className="text-xl font-bold font-mono text-primary mt-0.5">{smsCode}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configure Provider */}
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            Configure Provider API Key
          </h2>
          <form onSubmit={handleConfigure} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Select Provider</label>
              <select
                className="input mt-1"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                required
              >
                <option value="">-- Choose Provider --</option>
                <option value="5sim">5SIM</option>
                <option value="sms_activate">SMS-Activate</option>
                <option value="grizzly">Grizzly SMS</option>
                <option value="vaksms">VakSMS</option>
                <option value="smspool">SMSPool</option>
                <option value="tiger_sms">Tiger SMS</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">API Token / Secret Key</label>
              <input
                type="password"
                className="input mt-1"
                placeholder="Enter API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={busy || !selectedProvider || !apiKey} className="btn-secondary w-full">
              Save API Key
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
