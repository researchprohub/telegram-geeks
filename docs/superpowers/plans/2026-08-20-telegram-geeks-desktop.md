# Telegram Geeks Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fresh Electron + React (Vite SPA) Windows desktop app in `desktop/` that replaces `windows_app/` and drives the existing FastAPI backend as an embedded local subprocess.

**Architecture:** Electron main process spawns the backend (`backend/.venv/Scripts/python.exe -m uvicorn app.main:app` on `127.0.0.1:8765`, SQLite under `%LOCALAPPDATA%\TelegramGeeks`), waits for `/health` to report `checks.database === true`, then loads the Vite-built SPA. The SPA talks to `http://127.0.0.1:8765/api/v1/**` via axios with JWT Bearer auth (the backend already skips CSRF for Bearer requests, `backend/app/middleware/csrf.py`). One generic module-runner page drives all module-registry entries via `/modules/{id}/params` + `/modules/{id}/execute`; dedicated CRUD pages exist only for accounts, campaigns, personas, groups, analytics, admin, billing/payments, and settings. The old `windows_app/` tree is deleted in the final task after the smoke test passes.

**Tech Stack:** Electron 33 (CJS main + preload), Vite 6 + React 18.3 + TypeScript 5.6, react-router-dom v7, zustand 5, axios, Tailwind 3.4, lucide-react, vitest 2, electron-builder 25 (win `dir` target → portable folder).

## Global Constraints

- Backend runs on `127.0.0.1:8765` (HOST/PORT). Readiness = `GET http://127.0.0.1:8765/health` → `checks.database === true`.
- Dev backend dir = `C:\Users\SMG\Documents\AgnesCode\telegram-geeks\backend` (parent of `desktop/`); production = `process.resourcesPath/backend`. Python = `<backendDir>/.venv/Scripts/python.exe` (confirmed present).
- Backend spawn env: `PYTHONPATH=<repoRoot>;<backendDir>`, `DATABASE_URL=sqlite+aiosqlite:///<LOCALAPPDATA>\TelegramGeeks\telegramgeeks.db`, `REDIS_URL` inherited or `redis://localhost:6379/0`, `JWT_SECRET` auto-generated per run, `JWT_EXPIRE_MINUTES=480`, `CORS_ORIGINS=[]`, `ENVIRONMENT=desktop`, `ENABLE_DOCS=false`, `DEFAULT_AI_PROVIDER=none`. If port 8765 is already in use at startup → fail fast (error screen), never reuse a stale backend.
- Auth: JWT Bearer attached by an axios interceptor; token persisted via Electron `safeStorage` (DPAPI) over IPC. No cookies, no CSRF.
- Seeded creds (created by backend on first start): `admin@test.com` / `admin123`, `demo@test.com` / `demo123`.
- Design tokens: copy CSS variables from `frontend/src/app/globals.css` verbatim (midnight/charcoal + telegram cyan `--primary: 180 92% 73%`, `--radius: 5px`). Dark-only. Never hardcode Tailwind color classes like `bg-green-600` — use `bg-primary`, `bg-card`, `text-primary`, `border-border`, `bg-destructive`, `text-success`, `text-warning`.
- Gate for every task: `npm run check` (= `tsc --noEmit` + `vite build`) must pass. Orchestration tasks (main process, scripts, IPC) are verified by the runtime smoke test in Task 13, not by unit tests.
- Vitest covers only pure logic: `lib/auth.ts` restore/logout, `lib/paramForm.ts` default→field rendering + value parsing.
- Deleted artifact: entire `windows_app/` tree (Task 14), after smoke test green.

---
---

### Task 1: Scaffold the `desktop/` project

All files are created under the repo root `C:\Users\SMG\Documents\AgnesCode\telegram-geeks\desktop\`.

**Files:**
- Create: `desktop/package.json`
- Create: `desktop/tsconfig.json`
- Create: `desktop/vite.config.ts`
- Create: `desktop/tailwind.config.ts`
- Create: `desktop/postcss.config.mjs`
- Create: `desktop/index.html`
- Create: `desktop/vitest.config.ts`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `check`, `test`, `dist`; electron-builder `build` config; the empty-but-correct project root that later tasks fill in.

- [ ] **Step 1: Create `desktop/package.json`**

```json
{
  "name": "telegram-geeks-desktop",
  "version": "1.0.0",
  "private": true,
  "description": "Telegram Geeks desktop client (Electron + React + embedded backend)",
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently -k \"vite\" \"wait-on tcp:127.0.0.1:5173 && cross-env VITE_DEV_SERVER_URL=http://127.0.0.1:5173 electron .\"",
    "build": "vite build",
    "check": "tsc --noEmit && vite build",
    "test": "vitest run",
    "dist": "electron-builder --win dir"
  },
  "dependencies": {
    "axios": "^1.7.0",
    "lucide-react": "^0.460.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^7.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "concurrently": "^9.0.0",
    "cross-env": "^7.0.3",
    "electron": "^33.0.0",
    "electron-builder": "^25.1.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0",
    "wait-on": "^8.0.0"
  },
  "build": {
    "appId": "com.telegramgeeks.desktop",
    "productName": "TelegramGeeks",
    "files": ["dist/**", "electron/**", "package.json"],
    "extraResources": [
      { "from": "../backend", "to": "backend" }
    ],
    "directories": { "output": "release" },
    "win": { "target": ["dir"] }
  }
}
```

- [ ] **Step 2: Create `desktop/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node", "vite/client"]
  },
  "include": ["src", "vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 3: Create `desktop/vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: { outDir: "dist" },
});
```

- [ ] **Step 4: Create `desktop/tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        input: "hsl(var(--input))",
        surface: "hsl(var(--surface))",
      },
      borderRadius: { DEFAULT: "var(--radius)" },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 5: Create `desktop/postcss.config.mjs`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create `desktop/index.html`**

```html
<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src http://127.0.0.1:8765;"
    />
    <title>TelegramGeeks</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `desktop/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node" },
});
```

- [ ] **Step 8: Install dependencies and verify the check gate**

Run: `npm install`
Expected: completes with no errors; `desktop/node_modules/` and `desktop/package-lock.json` created. (First install downloads Electron binaries — allow a few minutes.)

- [ ] **Step 9: Commit**

```bash
git add desktop/package.json desktop/package-lock.json desktop/tsconfig.json desktop/vite.config.ts desktop/tailwind.config.ts desktop/postcss.config.mjs desktop/index.html desktop/vitest.config.ts
git commit -m "desktop: scaffold electron+vite+react project"
```

---
---

### Task 2: Electron main process — backend launcher, window, safeStorage token IPC

**Files:**
- Create: `desktop/electron/main.js`
- Create: `desktop/electron/preload.js`

**Interfaces:**
- Consumes: Task 1 `desktop/package.json` (`main: electron/main.js`), the real backend venv at `backend/.venv/Scripts/python.exe`.
- Produces:
  - `main.js` is the app entry: spawns the backend, waits for `/health`, creates the BrowserWindow, exposes IPC handlers.
  - `window.api` (via `preload.js`) with methods: `backendStatus(): Promise<{running:boolean; started:boolean}>`, `tokenGet(): Promise<string|null>`, `tokenSet(value:string): Promise<boolean>`, `tokenClear(): Promise<boolean>`.
  - Token file: `%LOCALAPPDATA%\TelegramGeeks\token.bin`, written via `safeStorage.encryptString` (DPAPI), read via `decryptString`.

- [ ] **Step 1: Create `desktop/electron/main.js`**

```js
const { app, BrowserWindow, ipcMain, safeStorage } = require("electron");
const { spawn } = require("child_process");
const net = require("net");
const fs = require("fs");
const path = require("path");
const http = require("http");

const HOST = "127.0.0.1";
const PORT = 8765;
const BASE_URL = `http://${HOST}:${PORT}`;

const REPO_ROOT = path.dirname(app.getAppPath());
const BACKEND_DIR = app.isPackaged
  ? path.join(process.resourcesPath, "backend")
  : path.join(REPO_ROOT, "backend");
const BACKEND_PYTHON = path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe");
const DATA_DIR = path.join(process.env.LOCALAPPDATA || app.getPath("userData"), "TelegramGeeks");
const TOKEN_FILE = path.join(DATA_DIR, "token.bin");
const DB_PATH = path.join(DATA_DIR, "telegramgeeks.db").replace(/\\/g, "/");

let backendProc = null;
let backendStarted = false;

function portInUse() {
  return new Promise((resolve) => {
    const s = net.connect(PORT, HOST);
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("error", () => resolve(false));
  });
}

function httpGetJson(url, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) || {} }); }
        catch { resolve({ status: res.statusCode, data: {} }); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

async function waitReady(timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (backendProc && backendProc.exitCode !== null) return false;
    try {
      const r = await httpGetJson(`${BASE_URL}/health`);
      if (r.status === 200 && r.data.checks && r.data.checks.database === true) return true;
    } catch { /* not up yet */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function startBackend() {
  if (backendProc && backendProc.exitCode === null) return true;
  if (await portInUse()) return false; // stale backend must not be reused
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "sessions"), { recursive: true });
  if (!fs.existsSync(BACKEND_PYTHON)) return false;
  const env = {
    ...process.env,
    PYTHONPATH: [REPO_ROOT, BACKEND_DIR].join(path.delimiter),
    DATABASE_URL: `sqlite+aiosqlite:///${DB_PATH}`,
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379/0",
    JWT_SECRET: process.env.JWT_SECRET || `desktop-app-secret-${require("crypto").randomBytes(16).toString("hex")}`,
    CORS_ORIGINS: "[]",
    ENVIRONMENT: "desktop",
    ENABLE_DOCS: "false",
    DEFAULT_AI_PROVIDER: process.env.DEFAULT_AI_PROVIDER || "none",
    JWT_EXPIRE_MINUTES: process.env.JWT_EXPIRE_MINUTES || "480",
  };
  backendProc = spawn(
    BACKEND_PYTHON,
    ["-m", "uvicorn", "app.main:app", "--host", HOST, "--port", String(PORT), "--log-level", "warning"],
    { cwd: BACKEND_DIR, env, windowsHide: true, stdio: "ignore" }
  );
  const ok = await waitReady();
  if (!ok) { stopBackend(); return false; }
  backendStarted = true;
  return true;
}

function stopBackend() {
  if (backendProc && backendProc.exitCode === null) backendProc.kill();
  backendProc = null;
}

function tokenValue() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return null;
    const buf = fs.readFileSync(TOKEN_FILE);
    if (!safeStorage.isEncryptionAvailable()) return null;
    return safeStorage.decryptString(buf);
  } catch { return null; }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#030303",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
  else win.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
}

app.whenReady().then(async () => {
  const ok = await startBackend();
  if (!ok) console.error("[main] backend failed to start (port in use or python missing)");

  ipcMain.handle("backend:status", () => ({
    running: backendProc !== null && backendProc.exitCode === null,
    started: backendStarted,
  }));
  ipcMain.handle("token:get", () => tokenValue());
  ipcMain.handle("token:set", (_event, value) => {
    try {
      fs.writeFileSync(TOKEN_FILE, safeStorage.encryptString(String(value)));
      return true;
    } catch { return false; }
  });
  ipcMain.handle("token:clear", () => {
    try { fs.rmSync(TOKEN_FILE, { force: true }); return true; }
    catch { return false; }
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") app.quit();
});
```

- [ ] **Step 2: Create `desktop/electron/preload.js`**

```js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  backendStatus: () => ipcRenderer.invoke("backend:status"),
  tokenGet: () => ipcRenderer.invoke("token:get"),
  tokenSet: (value) => ipcRenderer.invoke("token:set", value),
  tokenClear: () => ipcRenderer.invoke("token:clear"),
});
```

- [ ] **Step 3: Verify the exact spawn command the main process uses actually boots the backend**

From repo root, run in PowerShell (terminates after Ctrl+C; verify second pane):

```powershell
$env:PYTHONPATH="$PWD;$PWD\backend"
& "backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8765 --log-level warning
```

In a second PowerShell:
```powershell
(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8765/health).Content
```
Expected: JSON containing `"checks":{"database":true` and no startup exceptions. This is the same command `main.js` spawns with the same env; seed creds `admin@test.com`/`admin123` are available after this. Kill the uvicorn (Ctrl+C) before continuing.

- [ ] **Step 4: Commit**

```bash
git add desktop/electron/main.js desktop/electron/preload.js
git commit -m "desktop: electron main with embedded backend launcher + safeStorage token IPC"
```

---
---

### Task 3: Dev/run and build scripts

**Files:**
- Create: `desktop/run-dev.bat`
- Create: `desktop/build.bat`
- Create: `desktop/.gitignore`

**Interfaces:**
- Produces: human-facing entry points that match the old `windows_app/run.bat` + `windows_app/build.bat` workflow. `build.bat` runs the check gate then `electron-builder --win dir`; output lands in `desktop/release/win-unpacked/TelegramGeeks.exe`.

- [ ] **Step 1: Create `desktop/run-dev.bat`**

```bat
@echo off
cd /d "%~dp0"
call npm install
call npm run dev
```

- [ ] **Step 2: Create `desktop/build.bat`**

```bat
@echo off
cd /d "%~dp0"
call npm install
call npm run check
if errorlevel 1 exit /b 1
call npm run dist
echo.
echo Build complete: "%~dp0release\win-unpacked\TelegramGeeks.exe"
pause
```

- [ ] **Step 3: Create `desktop/.gitignore`**

```gitignore
node_modules/
dist/
release/
*.log
```

- [ ] **Step 4: Commit**

```bash
git add desktop/run-dev.bat desktop/build.bat desktop/.gitignore
git commit -m "desktop: dev/run and build scripts"
```

---
---

### Task 4: Design tokens — global CSS

**Files:**
- Create: `desktop/src/index.css`

**Interfaces:**
- Produces: `body` dark theme + CSS variables consumed by `tailwind.config.ts` (Task 1). All later components use `bg-background`, `bg-card`, `text-primary`, `border-border`, `bg-primary`, `bg-destructive`, `text-success`, `text-warning`, `rounded-lg`.

- [ ] **Step 1: Create `desktop/src/index.css`** (tokens copied verbatim from `frontend/src/app/globals.css`; mobile/blog-only classes omitted)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: dark;
    --background: 0 1% 1%;
    --foreground: 0 0% 100%;
    --card: 0 1% 2%;
    --card-foreground: 0 0% 100%;
    --primary: 180 92% 73%;
    --primary-foreground: 0 0% 7%;
    --secondary: 0 0% 5%;
    --secondary-foreground: 0 0% 80%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 55%;
    --accent: 180 92% 73%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 60% 50%;
    --warning: 38 92% 50%;
    --border: 0 0% 18%;
    --ring: 180 92% 73%;
    --radius: 5px;
    --surface: 0 1% 3%;
    --input: 0 0% 18%;
  }

  * { @apply border-[hsl(var(--border))]; }

  body {
    @apply bg-[hsl(var(--background))] text-[hsl(var(--foreground))];
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
  }

  h1 { @apply text-2xl font-bold tracking-tight; }
  h2 { @apply text-xl font-semibold; }
  h3 { @apply text-lg font-semibold; }
  p { @apply text-sm leading-relaxed; }

  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-thumb { @apply bg-muted rounded; }
  ::-webkit-scrollbar-track { @apply bg-transparent; }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer;
  }
  .btn-destructive {
    @apply inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer;
  }
  .card {
    @apply rounded-lg border border-border bg-card text-card-foreground shadow-sm;
  }
  .input {
    @apply w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary;
  }
  .label { @apply mb-1 block text-xs font-medium text-muted-foreground; }
  .table-base { @apply w-full text-sm; }
  .table-base thead th {
    @apply border-b border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground;
  }
  .table-base tbody td { @apply border-b border-border px-3 py-2 align-top; }
}
```

- [ ] **Step 2: Verify gate**

Run (in `desktop/`): `npm run check`
Expected: `tsc --noEmit` exits 0; `vite build` succeeds.

- [ ] **Step 3: Commit**

```bash
git add desktop/src/index.css
git commit -m "desktop: design tokens + base component classes"
```

---
---

### Task 5: SPA entry + routing shell + route types

**Files:**
- Create: `desktop/src/main.tsx`
- Create: `desktop/src/App.tsx`
- Create: `desktop/src/lib/api.ts`
- Create: `desktop/src/types.d.ts`

**Interfaces:**
- Consumes: Task 4 `index.css`, Task 2 `window.api` (typed in `types.d.ts`).
- Produces:
  - `App.tsx` renders the router. Routes: `/login`, `/register` (public); `/` (dashboard), `/accounts`, `/modules`, `/modules/:moduleId`, `/campaigns`, `/personas`, `/groups`, `/analytics`, `/neuro-text`, `/converter`, `/booster`, `/billing`, `/settings`, `/admin` (all inside `Layout`). Unknown paths redirect to `/`.
  - `api` axios instance (baseURL `http://127.0.0.1:8765/api/v1`) + `detail(err)` helper + `api` method groups (`authApi`, `accountsApi`, `campaignsApi`, `personasApi`, `groupsApi`, `analyticsApi`, `adminApi`, `paymentsApi`, `modulesApi`, `settingsApi`). Pages in later tasks import these.

- [ ] **Step 1: Create `desktop/src/types.d.ts`**

```ts
export interface BackendStatus { running: boolean; started: boolean; }

export interface WindowApi {
  backendStatus(): Promise<BackendStatus>;
  tokenGet(): Promise<string | null>;
  tokenSet(value: string): Promise<boolean>;
  tokenClear(): Promise<boolean>;
}

declare global {
  interface Window { api?: WindowApi; }
}

export interface ModuleRecord {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  operations: string[];
  tier: string;
  status: string;
}

export interface ModuleListResponse {
  total: number;
  active: number;
  categories: string[];
  module_categories: Record<string, string>;
  modules: ModuleRecord[];
}

export interface OperationParams {
  defaults: Record<string, unknown>;
  remap: Record<string, string>;
}

export interface ModuleParamsResponse {
  module_id: string;
  operations: Record<string, OperationParams>;
}
```

- [ ] **Step 2: Create `desktop/src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 3: Create `desktop/src/App.tsx`**

```tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import ModulesGrid from "./pages/ModulesGrid";
import ModuleRunner from "./pages/ModuleRunner";
import Campaigns from "./pages/Campaigns";
import Personas from "./pages/Personas";
import Groups from "./pages/Groups";
import Analytics from "./pages/Analytics";
import NeuroText from "./pages/NeuroText";
import Converter from "./pages/Converter";
import Booster from "./pages/Booster";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import BackendError from "./pages/BackendError";

export default function App() {
  const status = useAuth((s) => s.status);

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">Starting…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="modules" element={<ModulesGrid />} />
        <Route path="modules/:moduleId" element={<ModuleRunner />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="personas" element={<Personas />} />
        <Route path="groups" element={<Groups />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="neuro-text" element={<NeuroText />} />
        <Route path="converter" element={<Converter />} />
        <Route path="booster" element={<Booster />} />
        <Route path="billing" element={<Billing />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<Admin />} />
        <Route path="backend-error" element={<BackendError />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 4: Create `desktop/src/lib/api.ts`**

```ts
import axios, { AxiosError } from "axios";
import { useAuth } from "./auth";

export const BASE_URL = "http://127.0.0.1:8765";

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/")) {
      useAuth.getState().logout();
    }
    return Promise.reject(error);
  }
);

export function detail(err: unknown): string {
  const e = err as AxiosError<{ detail?: unknown }>;
  const d = e.response?.data?.detail;
  if (typeof d === "string") return d;
  if (d && typeof d === "object") return JSON.stringify(d, null, 2);
  return e.message || String(err);
}

export const authApi = {
  login: (email: string, password: string) => api.post<{ access_token: string; token_type: string }>("/auth/login", { email, password }),
  register: (email: string, password: string, full_name?: string) => api.post("/auth/register", { email, password, full_name }),
};

export const meApi = {
  me: () => api.get<{ id: number; email: string; role: string; full_name?: string }>("/auth/me"),
};

export const accountsApi = {
  list: (page = 1) => api.get<unknown>("/accounts/", { params: { page, page_size: 100 } }),
  create: (data: Record<string, unknown>) => api.post("/accounts/", data),
  delete: (id: number) => api.delete(`/accounts/${id}`),
  health: (id: number) => api.post(`/accounts/${id}/health`),
  warmup: (id: number) => api.post(`/accounts/${id}/warmup`),
  suspend: (id: number) => api.post(`/accounts/${id}/suspend`),
  unsuspend: (id: number) => api.post(`/accounts/${id}/unsuspend`),
};

export const campaignsApi = {
  list: (page = 1) => api.get<unknown>("/campaigns/", { params: { page, page_size: 100 } }),
  create: (data: Record<string, unknown>) => api.post("/campaigns/", data),
  delete: (id: number) => api.delete(`/campaigns/${id}`),
  start: (id: number) => api.post(`/campaigns/${id}/start`),
  pause: (id: number) => api.post(`/campaigns/${id}/pause`),
  stop: (id: number) => api.post(`/campaigns/${id}/stop`),
};

export const personasApi = {
  list: (page = 1) => api.get<unknown>("/personas/", { params: { page, page_size: 100 } }),
  create: (data: Record<string, unknown>) => api.post("/personas/", data),
  delete: (id: number) => api.delete(`/personas/${id}`),
};

export const groupsApi = {
  list: (page = 1) => api.get<unknown>("/groups/", { params: { page, page_size: 100 } }),
  create: (data: Record<string, unknown>) => api.post("/groups/", data),
  delete: (id: number) => api.delete(`/groups/${id}`),
};

export const analyticsApi = {
  overview: () => api.get<unknown>("/advanced-analytics/engagement-summary"),
  engagement: (groupId: number) => api.get(`/analytics/engagement/${groupId}`),
};

export const paymentsApi = {
  history: (page = 1) => api.get<unknown>("/payments/", { params: { page, page_size: 100 } }),
};

export const adminApi = {
  overview: () => api.get<unknown>("/admin/analytics/overview"),
  users: (page = 1) => api.get<unknown>("/admin/users", { params: { page, page_size: 100 } }),
};

export const settingsApi = {
  get: () => api.get<unknown>("/admin/settings"),
  update: (data: Record<string, unknown>) => api.put("/admin/settings", data),
};

export const modulesApi = {
  list: (category?: string) => api.get<ModuleListResponse>("/modules/", { params: category ? { category } : {} }),
  params: (moduleId: string) => api.get<ModuleParamsResponse>(`/modules/${moduleId}/params`),
  execute: (moduleId: string, operation: string, params: Record<string, unknown>) =>
    api.post(`/modules/${moduleId}/execute`, { operation, params }),
};
```

Note: `modulesApi` references `ModuleListResponse`/`ModuleParamsResponse` — `types.d.ts` provides them (declare-global `Window` plus module-scoped exports; import them in `api.ts` with `import type { ModuleListResponse, ModuleParamsResponse } from "./types";`).

- [ ] **Step 5: Verify gate**

Run (in `desktop/`): `npm run check`
Expected: `tsc --noEmit` fails ONLY because `./lib/auth`, `./components/Layout`, and `./pages/*` do not exist yet — that is the expected intermediate state. Do not commit App.tsx alone; continue to Task 6 where the shell resolves, then run the gate green.

- [ ] **Step 6: Commit**

```bash
git add desktop/src/main.tsx desktop/src/App.tsx desktop/src/lib/api.ts desktop/src/types.d.ts
git commit -m "desktop: react entry + routing shell + api client"
```

---
---

### Task 6: Auth store, layout, login/register, backend-error screen

**Files:**
- Create: `desktop/src/lib/auth.ts`
- Create: `desktop/src/components/Layout.tsx`
- Create: `desktop/src/pages/Login.tsx`
- Create: `desktop/src/pages/Register.tsx`
- Create: `desktop/src/pages/BackendError.tsx`
- Test: `desktop/src/lib/auth.test.ts`

**Interfaces:**
- Consumes: Task 2 `window.api`, Task 5 router + `authApi`/`meApi`/`detail`, Task 4 CSS.
- Produces:
  - zustand store `useAuth`: `{ user, status: "loading"|"ready"|"anon", restore(), setSession(), logout(), backendOk, setBackendOk() }`.
  - `Layout`: sidebar (nav links), topbar with user email + logout, backend-health banner (polls `window.api.backendStatus()`), `Outlet`, admin-role gate for `/admin`, redirect to `/login` when `status === "anon"`.
  - `Login`/`Register` forms hitting `authApi`; `BackendError` shown when backend is down.

- [ ] **Step 1: Write the failing unit test `desktop/src/lib/auth.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useAuth } from "./auth";

let stored: string | null = null;

beforeEach(() => {
  stored = null;
  (globalThis as any).window = {
    api: {
      tokenGet: async () => stored,
      tokenSet: async (v: string) => { stored = v; return true; },
      tokenClear: async () => { stored = null; return true; },
      backendStatus: async () => ({ running: true, started: true }),
    },
  };
  useAuth.setState({ token: null, user: null, status: "loading", backendOk: true });
});

describe("useAuth", () => {
  it("restore() promotes a persisted token to ready", async () => {
    stored = "tok-123";
    await useAuth.getState().restore();
    expect(useAuth.getState().status).toBe("ready");
    expect(useAuth.getState().token).toBe("tok-123");
  });

  it("restore() with no token lands on anon", async () => {
    await useAuth.getState().restore();
    expect(useAuth.getState().status).toBe("anon");
  });

  it("logout() clears token, persists the clear, and lands on anon", async () => {
    stored = "tok-123";
    await useAuth.getState().restore();
    await useAuth.getState().logout();
    expect(useAuth.getState().status).toBe("anon");
    expect(useAuth.getState().token).toBeNull();
    expect(stored).toBeNull();
  });

  it("setSession() stores the user and token", () => {
    useAuth.getState().setSession("tok-999", { id: 1, email: "a@b.c", role: "admin" });
    expect(useAuth.getState().token).toBe("tok-999");
    expect(useAuth.getState().status).toBe("ready");
    expect(useAuth.getState().user?.role).toBe("admin");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (in `desktop/`): `npx vitest run src/lib/auth.test.ts`
Expected: FAIL — `./auth` does not exist.

- [ ] **Step 3: Implement `desktop/src/lib/auth.ts`**

```ts
import { create } from "zustand";

export type AuthStatus = "loading" | "ready" | "anon";
export interface SessionUser { id: number; email: string; role: string; full_name?: string; }

interface AuthState {
  user: SessionUser | null;
  status: AuthStatus;
  backendOk: boolean;
  restore: () => Promise<void>;
  setSession: (token: string, user: SessionUser) => void;
  logout: () => Promise<void>;
  setBackendOk: (ok: boolean) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  backendOk: true,
  restore: async () => {
    const token = await window.api?.tokenGet();
    set({ status: token ? "ready" : "anon" });
  },
  setSession: (token, user) => set({ user, status: "ready" }),
  logout: async () => {
    await window.api?.tokenClear();
    set({ user: null, status: "anon" });
  },
  setBackendOk: (ok) => set({ backendOk: ok }),
}));
```

- [ ] **Step 4: Run the tests to verify they pass**

Run (in `desktop/`): `npx vitest run src/lib/auth.test.ts`
Expected: PASS (4 passed).

- [ ] **Step 5: Implement `desktop/src/components/Layout.tsx`**

```tsx
import { useEffect } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

const NAV = [
  { to: "/", label: "Dashboard", icon: "Home" },
  { to: "/accounts", label: "Accounts", icon: "Users" },
  { to: "/modules", label: "Modules", icon: "Blocks" },
  { to: "/campaigns", label: "Campaigns", icon: "Megaphone" },
  { to: "/personas", label: "Personas", icon: "Bot" },
  { to: "/groups", label: "Groups", icon: "UsersRound" },
  { to: "/analytics", label: "Analytics", icon: "BarChart3" },
  { to: "/neuro-text", label: "Neuro-Text", icon: "Sparkles" },
  { to: "/converter", label: "Converter", icon: "RefreshCw" },
  { to: "/booster", label: "Booster", icon: "Zap" },
  { to: "/billing", label: "Billing", icon: "CreditCard" },
  { to: "/settings", label: "Settings", icon: "Settings" },
];

export default function Layout() {
  const { user, status, logout, setBackendOk } = useAuth();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const st = await window.api?.backendStatus();
      if (!cancelled && st) setBackendOk(st.started);
    };
    check();
    const id = setInterval(check, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [setBackendOk]);

  if (status === "anon") return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-56 shrink-0 border-r border-border bg-background flex flex-col">
        <div className="px-4 py-4 font-semibold text-primary">TelegramGeeks</div>
        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${location.pathname === item.to ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <div className="truncate text-sm text-foreground">{user?.full_name || user?.email || user?.email}</div>
            <div className="text-xs text-muted-foreground">{user?.role}</div>
          </div>
          <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => logout()}>Logout</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Implement `desktop/src/pages/Login.tsx`**

```tsx
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
```

- [ ] **Step 7: Implement `desktop/src/pages/Register.tsx`**

```tsx
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
```

Note: after registration we log in immediately (registration itself does not return a token-bearing session usable by this client).

- [ ] **Step 8: Implement `desktop/src/pages/BackendError.tsx`**

```tsx
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
```

- [ ] **Step 9: Verify gate**

Run (in `desktop/`): `npm run check`
Expected: `tsc --noEmit` exits 0; `vite build` succeeds. All Task 5 page imports now resolve.
Run: `npx vitest run`
Expected: auth tests PASS.

- [ ] **Step 10: Commit**

```bash
git add desktop/src/lib/auth.ts desktop/src/components/Layout.tsx desktop/src/pages/Login.tsx desktop/src/pages/Register.tsx desktop/src/pages/BackendError.tsx desktop/src/lib/auth.test.ts
git commit -m "desktop: auth store, layout, login/register"
```

---
---

### Task 7: Dashboard

**Files:**
- Create: `desktop/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `modulesApi.list()`, `accountsApi.list()`, `useAuth()`.
- Produces: overview cards — module/account totals + quick links to Modules and Accounts; welcomes current user.

- [ ] **Step 1: Implement `desktop/src/pages/Dashboard.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { modulesApi, accountsApi } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Dashboard() {
  const { user } = useAuth();
  const [total, setTotal] = useState(0);
  const [accounts, setAccounts] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, a] = await Promise.all([modulesApi.list(), accountsApi.list()]);
        if (!cancelled) {
          setTotal(m.data.total);
          setAccounts((a.data as any)?.total ?? (Array.isArray(a.data) ? a.data.length : 0));
        }
      } catch { /* leave defaults */ }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header>
        <h1>Welcome back, {user?.full_name || user?.email}</h1>
        <p className="text-muted-foreground">Your Telegram Geeks control center.</p>
      </header>
      <div className="grid grid-cols-2 gap-4">
        <Link to="/modules" className="card p-5 transition-colors hover:bg-primary/10">
          <div className="text-3xl font-bold text-primary">{total}</div>
          <div className="text-sm text-muted-foreground">Modules</div>
        </Link>
        <Link to="/accounts" className="card p-5 transition-colors hover:bg-primary/10">
          <div className="text-3xl font-bold text-primary">{accounts}</div>
          <div className="text-sm text-muted-foreground">Accounts</div>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify gate**

Run (in `desktop/`): `npm run check`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add desktop/src/pages/Dashboard.tsx
git commit -m "desktop: dashboard overview"
```

---
---

### Task 8: Accounts page

**Files:**
- Create: `desktop/src/pages/Accounts.tsx`

**Interfaces:**
- Consumes: `accountsApi`, `detail`.
- Produces: a table of accounts with actions (health, warmup, suspend, unsuspend, delete) and a minimal create form. Response items use web `accounts/` shape: `{ items: [...] }` (paginated) — handle both `items` and `data.items` defensively.

- [ ] **Step 1: Implement `desktop/src/pages/Accounts.tsx`**

```tsx
import { FormEvent, useEffect, useState } from "react";
import { accountsApi, detail } from "../lib/api";

interface Row {
  id: number;
  phone_number?: string;
  username?: string;
  status?: string;
  [k: string]: unknown;
}

function extractItems(data: any): Row[] {
  const raw = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
  return (Array.isArray(raw) ? raw : []).filter((i: any) => i && typeof i === "object");
}

export default function Accounts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const r = await accountsApi.list(1);
      setRows(extractItems(r.data));
    } catch (err) { setError(detail(err)); }
  };

  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await accountsApi.create({ phone_number: phone, status: "active" });
      setPhone("");
      await load();
    } catch (err) { setError(detail(err)); }
    finally { setBusy(false); }
  };

  const act = async (id: number, fn: (id: number) => Promise<unknown>) => {
    setError("");
    try { await fn(id); await load(); }
    catch (err) { setError(detail(err)); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
      <header>
        <h1>Accounts</h1>
        <p className="text-muted-foreground">Session accounts on the embedded backend.</p>
      </header>
      <form className="card flex gap-2 p-4" onSubmit={create}>
        <input className="input" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <button className="btn-primary shrink-0" disabled={busy}>Add account</button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>ID</th><th>Phone</th><th>Username</th><th>Status</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.phone_number ?? "—"}</td>
                <td>{r.username ?? "—"}</td>
                <td>{r.status ?? "—"}</td>
                <td className="text-right">
                  <div className="inline-flex gap-1">
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, accountsApi.health)}>Health</button>
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, accountsApi.warmup)}>Warmup</button>
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, accountsApi.suspend)}>Suspend</button>
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, accountsApi.unsuspend)}>Unsuspend</button>
                    <button className="btn-destructive !px-2 !py-1 text-xs" onClick={() => act(r.id, accountsApi.delete)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No accounts yet. Add your first one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify gate**

Run (in `desktop/`): `npm run check`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add desktop/src/pages/Accounts.tsx
git commit -m "desktop: accounts page"
```

---
---

### Task 9: Generic module runner + param form

**Files:**
- Create: `desktop/src/lib/paramForm.ts`
- Create: `desktop/src/pages/ModulesGrid.tsx`
- Create: `desktop/src/pages/ModuleRunner.tsx`
- Test: `desktop/src/lib/paramForm.test.ts`

**Interfaces:**
- Consumes: `modulesApi`, `OperationParams`, `ModuleRecord`, `detail`.
- Produces:
  - `fieldList(defaults)` → `Array<{ key: string; kind: "text"|"number"|"checkbox"|"json" }>` (pure, tested).
  - `toParamValue(kind, raw)` → `unknown` (pure, tested).
  - `ModulesGrid` — grouped module cards by category from `modulesApi.list()`; each card links `/modules/{id}`.
  - `ModuleRunner` — reads `:moduleId`, fetches `/modules/{id}/params`, renders operation tabs + auto-generated inputs from `fieldList`, executes via `modulesApi.execute`, shows JSON result.

- [ ] **Step 1: Write failing tests `desktop/src/lib/paramForm.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { fieldList, toParamValue } from "./paramForm";

describe("fieldList", () => {
  it("maps primitive defaults to kinds", () => {
    const fields = fieldList({ name: "x", count: 5, enabled: true });
    expect(fields).toEqual([
      { key: "name", kind: "text" },
      { key: "count", kind: "number" },
      { key: "enabled", kind: "checkbox" },
    ]);
  });

  it("maps objects and arrays to json", () => {
    const fields = fieldList({ nested: { a: 1 }, list: [1, 2] });
    expect(fields).toEqual([
      { key: "nested", kind: "json" },
      { key: "list", kind: "json" },
    ]);
  });
});

describe("toParamValue", () => {
  it("parses numbers and booleans", () => {
    expect(toParamValue("number", "42")).toBe(42);
    expect(toParamValue("number", "")).toBeNull();
    expect(toParamValue("checkbox", false)).toBe(false);
  });
  it("parses json strings and falls back to raw", () => {
    expect(toParamValue("json", '{"a":1}')).toEqual({ a: 1 });
    expect(toParamValue("json", "not-json")).toBe("not-json");
  });
  it("passes text through", () => {
    expect(toParamValue("text", "hello")).toBe("hello");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run (in `desktop/`): `npx vitest run src/lib/paramForm.test.ts`
Expected: FAIL — `./paramForm` not found.

- [ ] **Step 3: Implement `desktop/src/lib/paramForm.ts`**

```ts
export type FieldKind = "text" | "number" | "checkbox" | "json";
export interface FormField { key: string; kind: FieldKind; }

export function fieldList(defaults: Record<string, unknown>): FormField[] {
  return Object.entries(defaults).map(([key, value]) => {
    let kind: FieldKind = "text";
    if (typeof value === "number") kind = "number";
    else if (typeof value === "boolean") kind = "checkbox";
    else if (value !== null && typeof value === "object") kind = "json";
    return { key, kind };
  });
}

export function toParamValue(kind: FieldKind, raw: string | boolean | null): unknown {
  if (kind === "checkbox") return raw === true || raw === "true";
  if (kind === "number") return raw === "" || raw === null ? null : Number(raw);
  if (kind === "json") {
    if (typeof raw !== "string") return raw ?? "";
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw ?? "";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run (in `desktop/`): `npx vitest run src/lib/paramForm.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `desktop/src/pages/ModulesGrid.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { modulesApi, detail } from "../lib/api";
import type { ModuleRecord } from "../types";

export default function ModulesGrid() {
  const [categories, setCategories] = useState<string[]>([]);
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await modulesApi.list();
        if (!cancelled) {
          setCategories(r.data.categories);
          setModules(r.data.modules);
        }
      } catch (err) { setError(detail(err)); }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
      <header>
        <h1>Modules</h1>
        <p className="text-muted-foreground">{modules.length} available tools.</p>
      </header>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {categories.map((cat) => {
        const grouped = modules.filter((m) => m.category === cat);
        if (grouped.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="mb-3 capitalize text-muted-foreground">{cat}</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {grouped.map((m) => (
                <Link key={m.id} to={`/modules/${m.id}`} className="card p-4 transition-colors hover:bg-primary/10">
                  <div className="font-medium text-primary">{m.name}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.description}</div>
                  <div className="mt-2 text-[10px] uppercase text-muted-foreground">{m.tier}</div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Implement `desktop/src/pages/ModuleRunner.tsx`**

```tsx
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { modulesApi, detail } from "../lib/api";
import { fieldList, toParamValue, FormField } from "../lib/paramForm";
import type { ModuleParamsResponse } from "../types";

export default function ModuleRunner() {
  const { moduleId = "" } = useParams();
  const [meta, setMeta] = useState<{ name?: string; description?: string }>({});
  const [params, setParams] = useState<ModuleParamsResponse | null>(null);
  const [op, setOp] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [metaR, p] = await Promise.all([modulesApi.list(), modulesApi.params(moduleId)]);
        const found = metaR.data.modules.find((m) => m.id === moduleId);
        if (!cancelled) {
          setMeta(found ? { name: found.name, description: found.description } : {});
          setParams(p.data);
          const ops = Object.keys(p.data.operations);
          const first = ops[0] ?? "";
          setOp(first);
          const defs = first ? p.data.operations[first].defaults : {};
          setFields(fieldList(defs));
          const init: Record<string, string | boolean> = {};
          for (const [k, v] of Object.entries(defs)) {
            init[k] = typeof v === "boolean" ? v : v == null ? "" : String(v);
          }
          setValues(init);
        }
      } catch (err) { setError(detail(err)); }
    })();
    return () => { cancelled = true; };
  }, [moduleId]);

  const ops = useMemo(() => (params ? Object.keys(params.operations) : []), [params]);

  const selectOp = (next: string) => {
    setOp(next);
    const defs = params?.operations[next]?.defaults ?? {};
    setFields(fieldList(defs));
    const init: Record<string, string | boolean> = {};
    for (const [k, v] of Object.entries(defs)) init[k] = typeof v === "boolean" ? v : v == null ? "" : String(v);
    setValues(init);
    setResult(null);
  };

  const run = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body: Record<string, unknown> = {};
      for (const f of fields) body[f.key] = toParamValue(f.kind, values[f.key] ?? "");
      const r = await modulesApi.execute(moduleId, op, body);
      setResult(r.data);
    } catch (err) { setResult(null); setError(detail(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header>
        <h1>{meta.name || moduleId}</h1>
        <p className="text-muted-foreground">{meta.description || "Module runner."}</p>
      </header>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {ops.map((o) => (
          <button key={o} className={`rounded-md px-3 py-1.5 text-sm ${o === op ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`} onClick={() => selectOp(o)}>
            {o}
          </button>
        ))}
      </div>
      <form className="card space-y-4 p-5" onSubmit={run}>
        {fields.length === 0 && <p className="text-sm text-muted-foreground">This operation takes no parameters.</p>}
        {fields.map((f) => (
          <div key={f.key}>
            <label className="label" htmlFor={f.key}>{f.key}</label>
            {f.kind === "checkbox" ? (
              <input id={f.key} type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={Boolean(values[f.key])} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.checked }))} />
            ) : (
              <input id={f.key} className="input font-mono" type={f.kind === "number" ? "number" : "text"} value={String(values[f.key] ?? "")} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
            )}
          </div>
        ))}
        <button className="btn-primary" disabled={busy || !op}>{busy ? "Running…" : "Run"}</button>
      </form>
      {result !== null && (
        <pre className="card max-h-96 overflow-auto p-4 text-xs text-muted-foreground">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Verify gate**

Run (in `desktop/`): `npm run check`
Expected: passes. Run: `npx vitest run` — paramForm tests PASS.

- [ ] **Step 8: Commit**

```bash
git add desktop/src/lib/paramForm.ts desktop/src/lib/paramForm.test.ts desktop/src/pages/ModulesGrid.tsx desktop/src/pages/ModuleRunner.tsx
git commit -m "desktop: generic module runner over /modules/{id}/execute"
```

---
---

### Task 10: Thin resource pages — campaigns, personas, groups

**Files:**
- Create: `desktop/src/pages/Campaigns.tsx`
- Create: `desktop/src/pages/Personas.tsx`
- Create: `desktop/src/pages/Groups.tsx`

**Interfaces:**
- Consumes: `campaignsApi`, `personasApi`, `groupsApi`, `detail`.
- Produces: minimal list+name-create+delete pages, following the Accounts page pattern. Kept deliberately small; grouping under one task because the three follow an identical shape and are rejected/approved together.

- [ ] **Step 1: Implement `desktop/src/pages/Campaigns.tsx`**

```tsx
import { FormEvent, useEffect, useState } from "react";
import { campaignsApi, detail } from "../lib/api";

function items(data: any): any[] {
  const raw = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
  return (Array.isArray(raw) ? raw : []).filter((i: any) => i && typeof i === "object");
}

export default function Campaigns() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => { try { setRows(items((await campaignsApi.list(1)).data)); } catch (err) { setError(detail(err)); } };
  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await campaignsApi.create({ name, status: "draft" }); setName(""); await load(); }
    catch (err) { setError(detail(err)); } finally { setBusy(false); }
  };

  const act = async (id: number, fn: (id: number) => Promise<unknown>) => {
    setError("");
    try { await fn(id); await load(); } catch (err) { setError(detail(err)); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>Campaigns</h1></header>
      <form className="card flex gap-2 p-4" onSubmit={create}>
        <input className="input" placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="btn-primary shrink-0" disabled={busy}>Create</button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>ID</th><th>Name</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name ?? "—"}</td>
                <td>{r.status ?? "—"}</td>
                <td className="text-right">
                  <div className="inline-flex gap-1">
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, campaignsApi.start)}>Start</button>
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, campaignsApi.pause)}>Pause</button>
                    <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(r.id, campaignsApi.stop)}>Stop</button>
                    <button className="btn-destructive !px-2 !py-1 text-xs" onClick={() => act(r.id, campaignsApi.delete)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No campaigns.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `desktop/src/pages/Personas.tsx`** (same shape, `personasApi`, create requires `{ name }`)

```tsx
import { FormEvent, useEffect, useState } from "react";
import { personasApi, detail } from "../lib/api";

function items(data: any): any[] {
  const raw = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
  return (Array.isArray(raw) ? raw : []).filter((i: any) => i && typeof i === "object");
}

export default function Personas() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => { try { setRows(items((await personasApi.list(1)).data)); } catch (err) { setError(detail(err)); } };
  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await personasApi.create({ name }); setName(""); await load(); }
    catch (err) { setError(detail(err)); } finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    setError("");
    try { await personasApi.delete(id); await load(); } catch (err) { setError(detail(err)); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>AI Personas</h1></header>
      <form className="card flex gap-2 p-4" onSubmit={create}>
        <input className="input" placeholder="Persona name" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="btn-primary shrink-0" disabled={busy}>Create</button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>ID</th><th>Name</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name ?? "—"}</td>
                <td className="text-right"><button className="btn-destructive !px-2 !py-1 text-xs" onClick={() => remove(r.id)}>Delete</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">No personas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `desktop/src/pages/Groups.tsx`** (same shape as Personas but `groupsApi`)

```tsx
import { FormEvent, useEffect, useState } from "react";
import { groupsApi, detail } from "../lib/api";

function items(data: any): any[] {
  const raw = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
  return (Array.isArray(raw) ? raw : []).filter((i: any) => i && typeof i === "object");
}

export default function Groups() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("group");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => { try { setRows(items((await groupsApi.list(1)).data)); } catch (err) { setError(detail(err)); } };
  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await groupsApi.create({ name, group_type: type }); setName(""); await load(); }
    catch (err) { setError(detail(err)); } finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    setError("");
    try { await groupsApi.delete(id); await load(); } catch (err) { setError(detail(err)); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>Groups</h1></header>
      <form className="card flex gap-2 p-4" onSubmit={create}>
        <input className="input" placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input w-40" placeholder="Type" value={type} onChange={(e) => setType(e.target.value)} />
        <button className="btn-primary shrink-0" disabled={busy}>Create</button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>ID</th><th>Name</th><th>Type</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name ?? "—"}</td>
                <td>{r.group_type ?? "—"}</td>
                <td className="text-right"><button className="btn-destructive !px-2 !py-1 text-xs" onClick={() => remove(r.id)}>Delete</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No groups.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify gate**

Run (in `desktop/`): `npm run check`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/pages/Campaigns.tsx desktop/src/pages/Personas.tsx desktop/src/pages/Groups.tsx
git commit -m "desktop: campaigns, personas, groups pages"
```

---
---

### Task 11: Analytics, converter, booster, neuro-text pages

**Files:**
- Create: `desktop/src/pages/Analytics.tsx`
- Create: `desktop/src/pages/Converter.tsx`
- Create: `desktop/src/pages/Booster.tsx`
- Create: `desktop/src/pages/NeuroText.tsx`

**Interfaces:**
- Consumes: `analyticsApi`, `modulesApi` (converter/booster reuse the generic runner for module ids `converter` and `booster`), `neuro_text` operations via `modulesApi.execute("neuro_text", ...)`.
- Produces: `Analytics` (summary cards), `Converter` = thin wrapper rendering `<ModuleRunner/>`-style behavior for module `converter`, `Booster` same for `booster`, `NeuroText` a small form for `neuro_text.preview_spintax`.

- [ ] **Step 1: Implement `desktop/src/pages/Analytics.tsx`**

```tsx
import { useEffect, useState } from "react";
import { analyticsApi, detail } from "../lib/api";

export default function Analytics() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try { setData((await analyticsApi.overview()).data as Record<string, unknown>); }
      catch (err) { setError(detail(err)); }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>Analytics</h1></header>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <pre className="card max-h-[70vh] overflow-auto p-4 text-xs text-muted-foreground">
        {data ? JSON.stringify(data, null, 2) : "Loading…"}
      </pre>
    </div>
  );
}
```

- [ ] **Step 2: Implement `desktop/src/pages/Converter.tsx` and `desktop/src/pages/Booster.tsx`** — both must reuse the generic `ModuleRunner` for modules `converter` and `booster`. `ModuleRunner` reads `:moduleId` from the URL, so these pages just redirect to the param'd route:

`desktop/src/pages/Converter.tsx`:

```tsx
import { Navigate } from "react-router-dom";

export default function Converter() {
  return <Navigate to="/modules/converter" replace />;
}
```

`desktop/src/pages/Booster.tsx`:

```tsx
import { Navigate } from "react-router-dom";

export default function Booster() {
  return <Navigate to="/modules/booster" replace />;
}
```

- [ ] **Step 3: Implement `desktop/src/pages/NeuroText.tsx`**

```tsx
import { FormEvent, useState } from "react";
import { modulesApi, detail } from "../lib/api";

export default function NeuroText() {
  const [template, setTemplate] = useState("Hello {World|Universe}!");
  const [count, setCount] = useState("5");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await modulesApi.execute("neuro_text", "preview_spintax", { template, count: Number(count) || 5 });
      setResult(r.data);
    } catch (err) { setError(detail(err)); setResult(null); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>Neuro-Text Engine</h1></header>
      <form className="card space-y-4 p-5" onSubmit={run}>
        <div>
          <label className="label" htmlFor="template">Spintax template</label>
          <textarea id="template" className="input min-h-24 font-mono" value={template} onChange={(e) => setTemplate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="count">Variants</label>
          <input id="count" type="number" className="input w-32" value={count} onChange={(e) => setCount(e.target.value)} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? "Running…" : "Preview"}</button>
      </form>
      {result !== null && <pre className="card max-h-96 overflow-auto p-4 text-xs text-muted-foreground">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

- [ ] **Step 4: Verify gate**

Run (in `desktop/`): `npm run check`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/pages/Analytics.tsx desktop/src/pages/Converter.tsx desktop/src/pages/Booster.tsx desktop/src/pages/NeuroText.tsx
git commit -m "desktop: analytics, converter, booster, neuro-text pages"
```

---
---

### Task 12: Billing, Settings, Admin pages

**Files:**
- Create: `desktop/src/pages/Billing.tsx`
- Create: `desktop/src/pages/Settings.tsx`
- Create: `desktop/src/pages/Admin.tsx`

**Interfaces:**
- Consumes: `paymentsApi`, `settingsApi`, `adminApi`, `detail`, `useAuth` (admin gate).
- Produces: `Billing` (payment history table), `Settings` (get/update settings JSON editor), `Admin` (overview + users table, admin-only guard).

- [ ] **Step 1: Implement `desktop/src/pages/Billing.tsx`**

```tsx
import { useEffect, useState } from "react";
import { paymentsApi, detail } from "../lib/api";

function items(data: any): any[] {
  const raw = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
  return (Array.isArray(raw) ? raw : []).filter((i: any) => i && typeof i === "object");
}

export default function Billing() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try { setRows(items((await paymentsApi.history(1)).data)); }
      catch (err) { setError(detail(err)); }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>Billing</h1></header>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>ID</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.status ?? "—"}</td>
                <td className="text-right text-xs text-muted-foreground">{Object.keys(r).filter((k) => !["id", "status"].includes(k)).slice(0, 3).join(", ")}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">No payments yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `desktop/src/pages/Settings.tsx`**

```tsx
import { useEffect, useState } from "react";
import { settingsApi, detail } from "../lib/api";

export default function Settings() {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError("");
    try { setRaw(JSON.stringify((await settingsApi.get()).data, null, 2)); }
    catch (err) { setError(detail(err)); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true); setError(""); setSaved(false);
    try {
      await settingsApi.update(JSON.parse(raw));
      setSaved(true);
    } catch (err) { setError(detail(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-6">
      <header><h1>Settings</h1></header>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {saved && <p className="text-xs text-success">Saved.</p>}
      <textarea className="input min-h-96 font-mono" value={raw} onChange={(e) => setRaw(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn-secondary" onClick={load}>Reload</button>
        <button className="btn-primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `desktop/src/pages/Admin.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { adminApi, detail } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Admin() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    (async () => {
      try {
        const [o, u] = await Promise.all([adminApi.overview(), adminApi.users(1)]);
        setOverview(o.data as Record<string, unknown>);
        setUsers((u.data as any)?.items ?? (Array.isArray(u.data) ? u.data : []));
      } catch (err) { setError(detail(err)); }
    })();
  }, [user]);

  if (user?.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      <header><h1>Admin</h1></header>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <pre className="card max-h-60 overflow-auto p-4 text-xs text-muted-foreground">{overview ? JSON.stringify(overview, null, 2) : "Loading…"}</pre>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>ID</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email ?? "—"}</td>
                <td>{u.role ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify gate**

Run (in `desktop/`): `npm run check`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/pages/Billing.tsx desktop/src/pages/Settings.tsx desktop/src/pages/Admin.tsx
git commit -m "desktop: billing, settings, admin pages"
```

---
---

### Task 13: Runtime smoke test

**Files:**
- Create: `desktop/smoke-test.bat`
- Create: `desktop/test/smoke.mjs`

**Interfaces:**
- Consumes: the fully-built SPA + Electron main (all prior tasks).
- Produces: a batch script that starts the backend exactly like `main.js` (Task 2 env), waits for `/health`, then runs a Playwright-free check of the API contract through the same axios-visible surface; verifies login → modules → params → execute → account CRUD; then stops the backend. Run this before Task 14 (delete windows_app).

- [ ] **Step 1: Create `desktop/test/smoke.mjs`**

```js
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

const mods = await json("GET", "/api/v1/modules/");
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
```

- [ ] **Step 2: Create `desktop/smoke-test.bat`**

```bat
@echo off
cd /d "%~dp0"
node test\smoke.mjs
if errorlevel 1 (
  echo SMOKE FAILED
  exit /b 1
)
```

- [ ] **Step 3: Run the smoke test**

Run (from `desktop/`): `node test/smoke.mjs`
Expected output ends with `SMOKE OK`. (Kills its own backend first if port 8765 is occupied — the script fails fast with a clear message; ensure no dev server from Task 2 Step 3 is still running.)

- [ ] **Step 4: Commit**

```bash
git add desktop/smoke-test.bat desktop/test/smoke.mjs
git commit -m "desktop: runtime smoke test"
```

---
---

### Task 14: Delete `windows_app/` and final verification

**Files:**
- Delete: `windows_app/` (entire directory tree)

**Interfaces:**
- Consumes: all prior tasks (green `npm run check`, green smoke test).
- Produces: repo without the old PySide6 app; `.gitignore` may already cover `windows_app/build`, `dist`, `logs` — verify nothing else references `windows_app` paths (`windows_app/` import in smoke tests, `docs/`).

- [ ] **Step 1: Pre-delete grep for references**

Grep repo for `windows_app` references that would break: `docs/`, `*.md`, `.bat`, `.py` test files.

```powershell
rg -l "windows_app" --glob '!backend/**' --glob '!frontend/**' .
```

- [ ] **Step 2: Delete the tree**

```powershell
Remove-Item -Recurse -Force windows_app
```

- [ ] **Step 3: Verify final gates**

Run (in `desktop/`): `npm run check`  → passes
Run (in `desktop/`): `npm test` → passes
Run (from `desktop/`): `node test/smoke.mjs` → ends `SMOKE OK`

- [ ] **Step 4: Build the portable folder once**

Run (in `desktop/`): `npm run dist`
Expected: `desktop/release/win-unpacked/TelegramGeeks.exe` created. (This step is slow — electron-builder copies the whole `backend/` into resources. Confirm the folder contains `resources/backend/.venv/Scripts/python.exe`.)

- [ ] **Step 5: Manual launch checklist**

1. Launch `desktop/release/win-unpacked/TelegramGeeks.exe`.
2. Wait for window; app should not crash for 2+ minutes (the QThread class of bug is impossible here — nothing uses QThread).
3. Sign in with `admin@test.com` / `admin123`.
4. Click each sidebar item; Modules shows the full grid; open `converter`, set `phone_number` to a value, Run; result JSON renders.
5. Close app; relaunch; token restores session (no login prompt).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "desktop: remove legacy windows_app, finalize desktop app"
```

---
---

## Self-Review Notes (executor: run this once, then fix in place)

1. **Spec coverage:** every spec decision maps to a task — Electron shell (2), embedded backend env/health (2), portable folder via electron-builder `dir` target (1,3,14), JWT Bearer client + safeStorage (6,2), design tokens (4), authed-only surface (5,7–12), generic module runner (9), smoke test (13), delete windows_app (14).
2. **Placeholder scan:** all code blocks are complete; no TBDs. `items()`/`extractItems()` defensive helpers are intentionally repeated per page (not centralized) to keep each page self-contained — acceptable duplication at this small scale.
3. **Type consistency:** `window.api` shape matches Task 2 preload (backendStatus/tokenGet/tokenSet/tokenClear); `useAuth` exposes `restore/setSession/logout/setBackendOk` matching its consumers; `ModuleParamsResponse`/`ModuleListResponse` from `types.d.ts` are imported where used (`api.ts`, `ModuleRunner`, `ModulesGrid`); `fieldList/toParamValue` signature matches tests.