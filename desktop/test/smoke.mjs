// Smoke test: boots the embedded backend the way electron/main.js does,
// then exercises the API contract the SPA depends on.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const here = fileURLToPath(import.meta.url);
const DESKTOP = join(here, "..", "..");
const REPO = join(DESKTOP, "..");
const HOST = "127.0.0.1";
const PORT = 8765;
const BASE = `http://${HOST}:${PORT}`;
const PY = join(REPO, "backend", ".venv", "Scripts", "python.exe");
const DATA_DIR = join(process.env.LOCALAPPDATA || REPO, "TelegramGeeks");
mkdirSync(DATA_DIR, { recursive: true });
const db = join(DATA_DIR, "smoke-geeks.db").replace(/\\/g, "/");

function portInUse() {
  return new Promise((resolve) => {
    const s = net.connect(PORT, HOST);
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("error", () => resolve(false));
  });
}

async function json(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

const backend = spawn(PY, ["-m", "uvicorn", "app.main:app", "--host", HOST, "--port", String(PORT), "--log-level", "warning"], {
  cwd: join(REPO, "backend"),
  env: {
    ...process.env,
    PYTHONPATH: [REPO, join(REPO, "backend")].join(delimiter),
    DATABASE_URL: `sqlite+aiosqlite:///${db}`,
    JWT_SECRET: "smoke-secret",
    JWT_EXPIRE_MINUTES: "480",
    CORS_ORIGINS: "[]",
    ENVIRONMENT: "desktop",
    ENABLE_DOCS: "false",
    DEFAULT_AI_PROVIDER: "none",
  },
  windowsHide: true,
  stdio: "ignore",
});

const deadline = Date.now() + 90000;
while (Date.now() < deadline) {
  if (backend.exitCode !== null) { console.error("SMOKE FAIL: backend exited early"); process.exit(1); }
  try {
    const h = await json("GET", "/health");
    if (h.checks?.database === true) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
console.log("PASS backend started and seeded");

const u = `smoke_${Date.now()}@example.com`;
const pw = "DeskTopPass!2026";
await json("POST", "/api/v1/auth/register", { email: u, password: pw, full_name: "Smoke" });
console.log("PASS registered");

const login = await json("POST", "/api/v1/auth/login", { email: u, password: pw });
if (!login.access_token) throw new Error("no access_token");
console.log("PASS login");

const me = await json("GET", "/api/v1/auth/me", undefined, login.access_token);
console.log("PASS /me role=" + me.role);

const mods = await json("GET", "/api/v1/modules/", undefined, login.access_token);
if (!(mods.total > 40)) throw new Error("expected >40 modules");
console.log("PASS modules total=" + mods.total);

const p = await json("GET", "/api/v1/modules/converter/params", undefined, login.access_token);
if (!p.operations.convert_to_tdata) throw new Error("expected converter.params");
console.log("PASS params converter.operations=" + Object.keys(p.operations).join(","));

const ex = await json("POST", "/api/v1/modules/converter/execute", {
  operation: "convert_to_tdata",
  params: { output_dir: "./converted", phone_number: "test", device_model: "TelegramGeeks", app_version: "1.0.0", session_string: "TEST_SESSION", api_id: 12345, api_hash: "test_hash" },
}, login.access_token);
console.log("PASS execute status=" + ex.status);

const acc = await json("GET", "/api/v1/accounts/", undefined, login.access_token);
console.log("PASS accounts total=" + (acc.total ?? 0));

backend.kill();
console.log("SMOKE OK");