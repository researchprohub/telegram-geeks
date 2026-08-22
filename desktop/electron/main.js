const { app, BrowserWindow, ipcMain, safeStorage } = require("electron");
const { spawn } = require("child_process");
const net = require("net");
const fs = require("fs");
const path = require("path");
const http = require("http");

const HOST = "127.0.0.1";
const PORT = 8765;
const BASE_URL = `http://${HOST}:${PORT}`;

const REPO_ROOT = app.isPackaged
  ? process.resourcesPath
  : path.dirname(app.getAppPath());
const BACKEND_DIR = path.join(REPO_ROOT, "backend");

function resolvePython() {
  const candidates = [
    path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe"),
    path.join(process.resourcesPath || "", "backend", ".venv", "Scripts", "python.exe"),
    path.join(path.dirname(app.getAppPath()), "backend", ".venv", "Scripts", "python.exe"),
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return "python";
}

const DATA_DIR = path.join(process.env.LOCALAPPDATA || app.getPath("userData"), "TelegramGeeks");
const TOKEN_FILE = path.join(DATA_DIR, "token.bin");
const DB_PATH = path.join(DATA_DIR, "telegramgeeks.db").replace(/\\/g, "/");

let backendProc = null;
let backendStarted = false;
let mainWindow = null;

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
      if (r.status === 200 && r.data?.checks?.database === true) return true;
    } catch { /* not up yet */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function startBackend() {
  if (backendProc && backendProc.exitCode === null) return true;
  if (await portInUse()) {
    try {
      const r = await httpGetJson(`${BASE_URL}/health`, 1500);
      if (r.status === 200 && r.data?.checks?.database === true) {
        backendStarted = true;
        return true;
      }
    } catch {
      return false;
    }
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "sessions"), { recursive: true });
  const py = resolvePython();
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
  try {
    const logFd = fs.openSync(path.join(DATA_DIR, "backend.log"), "a");
    backendProc = spawn(
      py,
      ["-m", "uvicorn", "app.main:app", "--host", HOST, "--port", String(PORT), "--log-level", "info"],
      { cwd: BACKEND_DIR, env, windowsHide: true, stdio: ["ignore", logFd, logFd] }
    );
  } catch (err) {
    console.error("[main] Failed to spawn backend:", err);
    return false;
  }
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
  mainWindow = new BrowserWindow({
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

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F12" && input.type === "keyDown") {
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    console.error(`[main] Failed to load SPA: ${errorCode} - ${errorDescription}`);
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  }
}

const os = require("os");
const crypto = require("crypto");
const { execSync } = require("child_process");

function getMachineHWID() {
  try {
    let machineGuid = "";
    if (process.platform === "win32") {
      try {
        const out = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', { encoding: "utf8", windowsHide: true });
        const m = out.match(/MachineGuid\s+REG_SZ\s+([a-f0-9\-]+)/i);
        if (m) machineGuid = m[1];
      } catch {}
    }
    const cpu = os.cpus()[0]?.model || "GENERIC_CPU";
    const host = os.hostname();
    const raw = `${machineGuid}_${cpu}_${host}_${os.platform()}`;
    const hash = crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
    return `HWID-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
  } catch (err) {
    return "HWID-DEFAULT-NODE-0001";
  }
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    const ok = await startBackend();
    if (!ok) console.error("[main] backend failed to start (port in use or python missing)");

    ipcMain.handle("backend:status", () => ({
      running: (backendProc !== null && backendProc.exitCode === null) || backendStarted,
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
    ipcMain.handle("hwid:get", () => getMachineHWID());

    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    stopBackend();
    if (process.platform !== "darwin") app.quit();
  });
}