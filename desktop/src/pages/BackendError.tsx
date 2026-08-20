import { useAuth } from "../lib/auth";

export default function BackendError() {
  const setBackendOk = useAuth((s) => s.setBackendOk);
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="card max-w-md space-y-3 p-6 text-center">
        <h1 className="text-primary">Backend unavailable</h1>
        <p className="text-muted-foreground">
          The embedded backend could not start (port 8765 in use, or Python missing).
          Close other TelegramGeeks instances and try again.
        </p>
        <button className="btn-secondary" onClick={() => setBackendOk(true)}>Retry</button>
      </div>
    </div>
  );
}