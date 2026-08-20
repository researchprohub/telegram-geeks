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