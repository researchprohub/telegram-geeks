# Telegram Geeks — Anti-Tamper & Application Security Hardening Guide

Comprehensive defense-in-depth architecture to protect the **Windows Desktop Application** and **Next.js Web Platform / FastAPI Backend** against cracking, reverse engineering, unauthorized key sharing, memory tampering, and automated API abuse.

---

## 1. Threat Model & Vector Overview

| Vector | Attack Description | Mitigation Applied in Telegram Geeks |
|---|---|---|
| **License Key Sharing** | Users distribute a single key to multiple machines or teams. | **Cryptographic HWID Binding & Zero-Trust Heartbeat**: Keys bind to MachineGuid + CPU/Motherboard hash upon first activation. |
| **Electron ASAR Extraction** | Attackers unpack `app.asar` using `npx @electron/asar extract` to modify JS verification logic. | **ASAR Integrity Verification + V8 Bytecode Compilation (Bytenode)**: Eliminates plaintext JavaScript from the distribution bundle. |
| **Runtime Debugging / Memory Patching** | Attackers attach x64dbg, Cheat Engine, or DevTools to bypass auth conditionals (e.g. `if (license.valid)`). | **Anti-Debugger Hooks (`IsDebuggerPresent`, `CheckRemoteDebuggerPresent`) & Node.js Native Addon Checks**. |
| **API Replay & Scraping** | Reverse engineers intercept HTTP traffic via mitmproxy/Charles to forge backend responses. | **HMAC-SHA256 Request Signing with Nonce & Timestamp + SSL Certificate Pinning**. |
| **Token & Session Theft** | Malware extracts session `.session` or `.json` account files from disk. | **Windows DPAPI Storage (`safeStorage`) + SQLite AES-256 (SQLCipher)**. |

---

## 2. Desktop Application Hardening

### A. Hardware ID (HWID) Fingerprinting
A non-forgeable composite signature is constructed from hardware and OS registry artifacts:
```javascript
// Hardware signature calculation (Motherboard + CPU + Windows MachineGuid)
function getMachineHWID() {
  const machineGuid = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid');
  const cpuModel = os.cpus()[0]?.model;
  const host = os.hostname();
  const raw = `${machineGuid}_${cpuModel}_${host}_${os.platform()}`;
  return crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
}
```
- **Binding Policy**: The server locks the key to this HWID on initial activation.
- **Admin Reset**: An administrator can clear the HWID lock via `/api/v1/licenses/admin/{key}/unbind-hwid` when authorized hardware transfers occur.

### B. V8 Bytecode Pre-Compilation (Bytenode)
Instead of packaging readable `.js` files in `app.asar`:
1. Pre-compile critical scripts (`main.js`, `license_service.js`, `anti_detection.js`) into V8 bytecode binary files (`.jsc`).
2. Run via `bytenode.runBytecodeFile()`.
3. Disassembles into low-level V8 bytecode instructions rather than human-readable JavaScript, rendering decompilation extremely arduous.

### C. Anti-Debugging & Environment Detection
In `desktop/electron/main.js`:
- Block standard shortcut keys: `Ctrl+Shift+I`, `F12`, `Ctrl+U`.
- Check for debugger presence:
  ```javascript
  if (process.env.NODE_ENV !== "development") {
    setInterval(() => {
      const startTime = Date.now();
      debugger; // Triggers delay if devtools or debugger is attached
      if (Date.now() - startTime > 100) {
        app.quit(); // Debugger detected -> terminate execution
      }
    }, 2000);
  }
  ```
- Windows Native Anti-Debug:
  - Invokes Win32 API `IsDebuggerPresent()` and `CheckRemoteDebuggerPresent()`.
  - Sets thread hide from debugger: `NtSetInformationThread(GetCurrentThread(), ThreadHideFromDebugger, 0, 0)`.

### D. Windows Data Protection API (DPAPI)
All local tokens and authentication keys are stored using OS-level DPAPI keys tied to the current Windows user login:
```javascript
safeStorage.encryptString(tokenValue); // Encrypted using Windows DPAPI
```
Even if the file `%LOCALAPPDATA%\TelegramGeeks\token.bin` is exfiltrated to another machine, it cannot be decrypted.

---

## 3. Web Platform & API Hardening

### A. HMAC-SHA256 Request Signing
Every sensitive state-changing request (module execution, account upload, campaign dispatch) includes an HMAC-SHA256 signature calculated from:
```
Signature = HMAC_SHA256(Secret, Method + Path + Timestamp + Nonce + BodyHash)
```
- **Replay Window**: The server enforces `abs(CurrentTime - Timestamp) < 30s` and verifies nonces against Redis cache.
- Prevents replay attacks and unauthorized automated bots.

### B. Content Security Policy & Security Headers
Configured in `backend/app/main.py`:
- `Content-Security-Policy`: Disallows unsafe inline scripts and frames.
- `Strict-Transport-Security`: Enforces `max-age=31536000; includeSubDomains`.
- `X-Frame-Options: DENY`: Prevents Clickjacking attacks.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.

### C. Zero-Trust Telegram Session Storage
- SQLite session strings (`.session`) and MTProto auth keys are stored encrypted at rest.
- When an account worker terminates, session memory buffers are overwritten with zeros (`b'\x00' * len(key)`) to prevent RAM dumping.

---

## 4. Operational Recommendations

1. **Production Build Pipeline**: Always run `electron-builder` with code signing certificates (`signtool.exe`) and enable ASAR integrity check flags.
2. **Periodic Key Heartbeat**: The desktop client transmits a periodic background heartbeat (`/api/v1/licenses/verify`) every 6 hours. If a key is revoked by the administrator, the desktop client terminates the session and resets the local token.
3. **Database Backups**: Use encrypted automated backups for `%LOCALAPPDATA%\TelegramGeeks\licenses.db`.
