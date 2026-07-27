# Security Architecture & Audit Report — TelegramGeeks

**Date:** 2026-07-19  
**Version:** 1.0.0  
**Scope:** Full-stack security audit (Backend + Frontend + Infrastructure)  
**Methodology:** OWASP Top 10 (2021), STRIDE threat modeling  

---

## Executive Summary

This report documents a comprehensive security audit of the TelegramGeeks SaaS platform. The platform uses FastAPI (Python), Next.js (TypeScript/Tailwind), PostgreSQL, Redis, and Nginx. While the architecture has several good practices (bcrypt password hashing, Pydantic schema validation, role-based access on admin routes), there are **critical vulnerabilities** that must be addressed before production deployment.

**Overall Risk Level: HIGH** — Multiple P0 and P1 findings require immediate remediation.

---

## 1. Authentication & Session Management

### P0 — JWT Stored in localStorage [CRITICAL]
- **Files:** `frontend/src/lib/api.ts` (line ~12), `frontend/src/app/login/page.tsx` (line ~22), `frontend/src/app/register/page.tsx` (line ~20), `frontend/src/components/layout/sidebar.tsx` (line ~47)
- **Description:** Access tokens and refresh tokens are stored in `localStorage`, which is accessible to any JavaScript running in the browser. This makes tokens vulnerable to XSS attacks. Any injected script can read `localStorage` and steal tokens.
- **Fix Specification:** Move JWT to `httpOnly` cookies. On the backend, set `Set-Cookie: access_token=<token>; HttpOnly; Secure; SameSite=Lax; Path=/`. On the frontend, remove all `localStorage.getItem/setItem` calls for tokens. Update the axios interceptor to use `credentials: 'include'` and read cookies automatically.
- **Estimate:** 8 hours

### P0 — JWT Secret Has Default Value in Production [CRITICAL]
- **Files:** `backend/app/core/config.py` (line ~22), `docker-compose.yml` (line ~42)
- **Description:** The default JWT secret is `"change-me-in-production"` and the docker-compose exposes `JWT_SECRET` with value `"dev-secret-change-me"`. If not overridden, this allows anyone who knows the default to forge valid JWT tokens.
- **Fix Specification:** Use a cryptographically secure random secret (minimum 256 bits). Enforce via environment variable with no default. Add a startup validation that rejects the application if the secret is shorter than 32 characters or equals a known default.
- **Estimate:** 2 hours

### P1 — JWT Expires After 7 Days With No Rotation [HIGH]
- **Files:** `backend/app/core/config.py` (line ~24)
- **Description:** `jwt_expire_minutes: int = 10080` (7 days). Long-lived tokens increase the window of exposure if stolen. The refresh endpoint (`/auth/refresh`) returns the same token for both `access_token` and `refresh_token`, making token rotation impossible.
- **Fix Specification:** Reduce access token TTL to 15 minutes. Implement proper refresh token rotation: issue separate long-lived refresh tokens (stored in a database with rotation tracking). On refresh, invalidate the old refresh token and issue a new pair.
- **Estimate:** 16 hours

### P1 — No Brute-Force Protection on Login [HIGH]
- **Files:** `backend/app/api/v1/endpoints/auth.py`
- **Description:** The `/auth/login` endpoint has no rate limiting, no account lockout, and no CAPTCHA. An attacker can perform unlimited login attempts.
- **Fix Specification:** Add per-IP rate limiting specifically for `/auth/login` (e.g., 5 attempts per 15 minutes). Implement progressive delays and account lockout after 10 failed attempts. Consider adding reCAPTCHA v3 for public endpoints.
- **Estimate:** 6 hours

### P1 — No Password Strength Validation [HIGH]
- **Files:** `backend/app/schemas/__init__.py` (line ~17)
- **Description:** `UserRegister` only enforces `min_length=8`. No complexity requirements (uppercase, lowercase, digits, special characters).
- **Fix Specification:** Add regex-based password strength validation: minimum 12 characters, at least one uppercase, one lowercase, one digit, one special character. Use `pydantic` field validators.
- **Estimate:** 3 hours

### P2 — Logout Does Not Invalidate Token [MEDIUM]
- **Files:** `frontend/src/components/layout/sidebar.tsx` (line ~47)
- **Description:** Logout only removes the token from localStorage on the frontend. The backend has no token blacklist/revocation mechanism. Stolen tokens remain valid until expiration.
- **Fix Specification:** Add a `/auth/logout` endpoint that blacklists the token in Redis with TTL matching the JWT expiry. Check the blacklist on every authenticated request.
- **Estimate:** 6 hours

---

## 2. Authorization & Access Control

### P1 — No Tenant Isolation [HIGH]
- **Files:** `backend/app/api/v1/endpoints/accounts.py`, `campaigns.py`, `groups.py`, `personas.py`
- **Description:** All CRUD endpoints query the database without filtering by `user_id`. Any authenticated user can list, read, update, or delete ANY account, campaign, group, or persona — regardless of ownership. There is no `user_id` foreign key on these resources.
- **Fix Specification:** Add `user_id` column to `Account`, `Campaign`, `Group`, and `Persona` models. Add a dependency that filters all queries by `current_user.id`. Update all endpoints to use `where(Account.user_id == current_user.id)`.
- **Estimate:** 24 hours

### P1 — Admin Routes Lacked Middleware Enforcement [HIGH]
- **Files:** `backend/app/api/v1/endpoints/admin.py`
- **Description:** Admin endpoints use a `require_admin` helper function called via `Depends()`, but this is inconsistent. Some endpoints use `_admin: User = Depends(require_admin)` while others directly check `current_user.role`. The pattern is fragile.
- **Fix Specification:** Standardize on a single `require_admin` dependency. Add an `AuthorizationError` exception handler. Consider using FastAPI's built-in dependency injection for role checks consistently.
- **Estimate:** 4 hours

### P2 — Module Access Gating Uses Role Instead of Plan Tier [MEDIUM]
- **Files:** `backend/app/api/v1/endpoints/modules.py` (line ~135)
- **Description:** `_check_module_access()` maps user roles to plan tiers. The mapping is hardcoded (`"admin": "agency"`, `"operator": "starter"`). There is no actual subscription/payment enforcement — a user can be an "operator" and still access all modules by changing their role directly in the database.
- **Fix Specification:** Implement a proper subscription model with `Subscription` table tracking plan tier, start/end dates, and payment status. Gate module access based on active subscription, not user role.
- **Estimate:** 20 hours

### P2 — Delete Endpoint on Campaigns Does Hard Delete [MEDIUM]
- **Files:** `backend/app/api/v1/endpoints/campaigns.py` (line ~73)
- **Description:** `DELETE /campaigns/{campaign_id}` performs a hard delete via `await db.delete(c)`. Other resources use soft deletes. This inconsistency can cause data loss and breaks referential integrity with related tables (conversations, analytics).
- **Fix Specification:** Change to soft delete: set `status = "deleted"` and `deleted_at = datetime.utcnow()`. Add `deleted_at IS NULL` filter to all list queries.
- **Estimate:** 4 hours

---

## 3. Input Validation & Injection

### P2 — SQL Injection Risk in Admin Search [MEDIUM]
- **Files:** `backend/app/api/v1/endpoints/admin.py` (lines ~84-88)
- **Description:** The search query uses `User.email.ilike(f"%{search}%")` which is safe with SQLAlchemy's parameterized queries. However, the `search` parameter is unvalidated and accepts arbitrary strings. While SQLAlchemy prevents traditional SQL injection, the lack of length limits allows potential DoS via long search strings.
- **Fix Specification:** Add `max_length=100` to the search query parameter. Sanitize input with `sqlalchemy.text()` if raw SQL is ever introduced.
- **Estimate:** 2 hours

### P2 — No Input Length Limits on Many Endpoints [MEDIUM]
- **Files:** `backend/app/api/v1/endpoints/tdata_upload.py`, `backend/app/api/v1/endpoints/modules.py`
- **Description:** The TData upload endpoint accepts ZIP files with no size limit. The module execute endpoint accepts arbitrary `params: dict[str, Any]` with no schema validation, allowing arbitrarily large payloads.
- **Fix Specification:** Add `max_file_size` validation (e.g., 50MB). Add request body size limits at the Nginx/Uvicorn level. Validate module execution params against expected schemas.
- **Estimate:** 6 hours

### P2 — No CSRF Protection [MEDIUM]
- **Files:** `backend/app/main.py`, all state-changing endpoints
- **Description:** The CORS middleware allows `allow_credentials=True` with specific origins, which is correct. However, there is no CSRF token protection on state-changing endpoints (POST/PUT/DELETE). Since the frontend is on a different origin (or same origin via proxy), CSRF is possible if cookies are used.
- **Fix Specification:** Implement CSRF protection using double-submit cookie pattern or SameSite=Strict/Lax cookies. Add `xsrf` token validation middleware.
- **Estimate:** 8 hours

---

## 4. Data Protection & Secrets Management

### P1 — Session Strings Stored in Plaintext [HIGH]
- **Files:** `backend/app/models/__init__.py` (line ~44), `backend/app/services/infrastructure.py` (SessionManager)
- **Description:** Telegram session strings (`session_string` column in `Account` model) are stored as plaintext `Text` columns. These strings grant full access to the Telegram account. If the database is compromised, all accounts are immediately hijacked.
- **Fix Specification:** Encrypt session strings at rest using AES-256-GCM with a key derived from an HSM or AWS KMS. Store only the ciphertext in the database. Decrypt on-demand in memory only.
- **Estimate:** 16 hours

### P1 — API Keys Stored in Plaintext in Config [HIGH]
- **Files:** `backend/app/core/config.py`, `backend/app/services/infrastructure.py`
- **Description:** AI provider API keys (OpenAI, Anthropic, Groq) and Telegram API credentials are loaded from environment variables and stored in plaintext in memory. There is no encryption at rest for these secrets.
- **Fix Specification:** Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, or at minimum encrypted `.env` files). Rotate API keys regularly. Log redacted versions only.
- **Estimate:** 12 hours

### P2 — Phone Numbers Not Masked in Logs [MEDIUM]
- **Files:** `backend/app/services/module_dispatcher.py` (line ~450)
- **Description:** Module execution logs include full phone numbers: `logger.info(f"Executing {module_id}.{operation} with params: {filtered_params}")`. Phone numbers are PII and should never appear in logs.
- **Fix Specification:** Add a logging sanitizer that masks phone numbers, email addresses, and session strings before they reach the log output. Use structured logging with field-level redaction.
- **Estimate:** 4 hours

### P2 — No Encryption in Transit for Sensitive Fields [MEDIUM]
- **Files:** `nginx/nginx.conf`
- **Description:** Nginx listens on port 80 (HTTP only). There is no TLS termination, no HSTS header, and no redirect from HTTP to HTTPS. All data including credentials and session strings are transmitted in plaintext.
- **Fix Specification:** Configure Nginx with SSL certificates (Let's Encrypt). Add `return 301 https://$host$request_uri;` for HTTP. Add HSTS header: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`.
- **Estimate:** 8 hours

---

## 5. File Upload Security

### P1 — TData Upload Has No File Type Validation [HIGH]
- **Files:** `backend/app/api/v1/endpoints/tdata_upload.py` (line ~40)
- **Description:** The upload endpoint checks `file.filename.endswith('.zip')` but does not validate the actual file content. An attacker can rename a malicious executable to `.zip` and bypass the check. There is also no virus scanning.
- **Fix Specification:** Validate ZIP file magic bytes (`PK\x03\x04`). Extract and scan contents for malicious files. Limit extraction depth to prevent zip-slip attacks. Validate file size before reading into memory.
- **Estimate:** 8 hours

### P1 — Zip Slip / Path Traversal Vulnerability [HIGH]
- **Files:** `backend/app/services/tdata_uploader.py`
- **Description:** The TData uploader extracts ZIP files to disk. If a ZIP contains files with paths like `../../etc/passwd`, it can overwrite arbitrary files on the server.
- **Fix Specification:** Use `pathlib.Path.resolve()` to canonicalize extracted paths. Verify the resolved path starts with the intended upload directory. Reject any ZIP entries with `..` in their path.
- **Estimate:** 4 hours

### P2 — No File Size Limit on Uploads [MEDIUM]
- **Files:** `backend/app/api/v1/endpoints/tdata_upload.py`
- **Description:** `await file.read()` reads the entire file into memory without size checking. A large file can cause OOM kills.
- **Fix Specification:** Stream the file upload and enforce a maximum size (e.g., 50MB). Set Uvicorn `limit-max-request-field-size` and Nginx `client_max_body_size`.
- **Estimate:** 3 hours

---

## 6. Infrastructure & Network Security

### P1 — Swagger Docs Exposed in Production [HIGH]
- **Files:** `backend/app/main.py` (lines ~64-65), `nginx/nginx.conf` (lines ~18-28)
- **Description:** FastAPI's `/docs` and `/redoc` endpoints are exposed without authentication. These reveal the full API contract, parameter types, and response schemas, aiding attackers in crafting exploits.
- **Fix Specification:** Disable `/docs` and `/redoc` in production. Conditionally enable only when `settings.environment == "development"`. Alternatively, protect behind admin authentication.
- **Estimate:** 2 hours

### P1 — Nginx Lacks Security Headers [HIGH]
- **Files:** `nginx/nginx.conf`
- **Description:** Nginx configuration has no security headers: no `X-Frame-Options`, no `X-Content-Type-Options`, no `Content-Security-Policy`, no `Referrer-Policy`, no `Permissions-Policy`.
- **Fix Specification:** Add the following headers:
  ```
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none';" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  ```
- **Estimate:** 3 hours

### P2 — Redis Exposed Without Authentication [MEDIUM]
- **Files:** `docker-compose.yml` (line ~22)
- **Description:** Redis is exposed on port 6379 without a password. It's accessible from the host network. If Redis is used for session storage, rate limiting, or Celery broker, this is a critical risk.
- **Fix Specification:** Set a Redis password in `docker-compose.yml`. Update all Redis connections to use `redis://:password@redis:6379/0`. Bind Redis to internal network only (remove `ports:` mapping for production).
- **Estimate:** 4 hours

### P2 — PostgreSQL Default Credentials [MEDIUM]
- **Files:** `docker-compose.yml` (lines ~7-9)
- **Description:** PostgreSQL uses default credentials `postgres:postgres`. The database is exposed on port 5432 to the host.
- **Fix Specification:** Use strong random passwords. Remove `ports:` mapping for production (internal network only). Enable SSL for database connections.
- **Estimate:** 3 hours

### P2 — Docker Compose Exposes All Service Ports [MEDIUM]
- **Files:** `docker-compose.yml`
- **Description:** All services (PostgreSQL, Redis, Ollama, Backend, Frontend) are exposed on host ports. Only Nginx on port 80 should be publicly accessible.
- **Fix Specification:** Remove `ports:` mappings for internal services in production. Keep only Nginx (port 80/443) and metrics (port 9090) exposed.
- **Estimate:** 2 hours

---

## 7. CORS & API Security

### P1 — CORS Allows Wildcard Methods and Headers [HIGH]
- **Files:** `backend/app/main.py` (lines ~69-73)
- **Description:** `allow_methods=["*"]` and `allow_headers=["*"]` permit any HTTP method and any header. Combined with `allow_credentials=True`, this is dangerous if `cors_origins` includes wildcard or broad ranges.
- **Fix Specification:** Explicitly list allowed methods: `["GET", "POST", "PUT", "DELETE", "OPTIONS"]`. Explicitly list allowed headers: `["Authorization", "Content-Type"]`. Ensure `cors_origins` is strictly configured per environment.
- **Estimate:** 2 hours

### P2 — No API Rate Limiting Per-Endpoint [MEDIUM]
- **Files:** `backend/app/middleware/rate_limiter.py`
- **Description:** The rate limiter is an in-memory sliding window that applies globally to all IPs. It does not differentiate between endpoints (login vs. health check) and resets on process restart. In a multi-container deployment, each container has its own rate limit counter.
- **Fix Specification:** Move rate limiting to Redis for distributed counting. Add endpoint-specific limits (e.g., stricter for `/auth/login`, more generous for `/health`). Add rate limit headers to responses.
- **Estimate:** 12 hours

### P2 — No Request ID / Correlation IDs [MEDIUM]
- **Files:** `backend/app/middleware/request_logging.py`
- **Description:** No request tracing IDs are generated. This makes it impossible to correlate frontend requests with backend logs, hindering incident response.
- **Fix Specification:** Add a `X-Request-ID` header generator middleware. Propagate the ID through all log statements and response headers.
- **Estimate:** 4 hours

---

## 8. Error Handling & Information Disclosure

### P1 — Stack Traces Leaked in Error Responses [HIGH]
- **Files:** `backend/app/api/v1/endpoints/payments.py` (lines ~60-63, ~83-85)
- **Description:** Generic `except Exception as e` blocks raise `HTTPException(status_code=500, detail=str(e))`. This can leak internal implementation details, file paths, library versions, and API key fragments.
- **Fix Specification:** Catch specific exceptions. Return generic error messages to clients. Log full stack traces internally. Add an exception handler middleware that sanitizes error responses.
- **Estimate:** 6 hours

### P2 — Health Endpoint Reveals Environment [MEDIUM]
- **Files:** `backend/app/main.py` (line ~79)
- **Description:** The `/health` endpoint returns `"environment": "development"` hardcoded. This reveals the deployment environment to unauthenticated users.
- **Fix Specification:** Remove the `environment` field from the health response. Only return `status` and `version`.
- **Estimate:** 1 hour

### P2 — No Input Sanitization on User-Generated Content [MEDIUM]
- **Files:** `frontend/src/app/dashboard/personas/page.tsx`, `backend/app/schemas/__init__.py`
- **Description:** Persona names and descriptions are stored and displayed without sanitization. While React escapes JSX by default, user content passed to non-React contexts (PDF exports, API responses) could contain XSS payloads.
- **Fix Specification:** Sanitize all user input on the backend before storing. Use DOMPurify or similar on the frontend for any `dangerouslySetInnerHTML` usage.
- **Estimate:** 6 hours

---

## 9. Telegram-Specific Security

### P1 — TData File Lifecycle Not Managed [HIGH]
- **Files:** `backend/app/services/tdata_uploader.py`
- **Description:** Uploaded TData ZIP files are stored temporarily and deleted after processing. However, extracted session files are persisted indefinitely in the `sessions/` directory with no cleanup policy. Compromised servers retain all session data forever.
- **Fix Specification:** Implement automated cleanup of session files older than 90 days. Encrypt session files on disk. Log all session file access.
- **Estimate:** 8 hours

### P2 — No Telegram FloodWait Handling in API Layer [MEDIUM]
- **Files:** `backend/app/services/module_dispatcher.py`
- **Description:** The module dispatcher catches exceptions during module execution but returns raw error messages to the client. Telegram `FloodWait` errors (rate limiting by Telegram) are not handled gracefully — the client sees opaque errors instead of actionable wait times.
- **Fix Specification:** Detect Telegram `FloodWait` exceptions. Return structured responses with `retry_after` seconds. Implement automatic retry with exponential backoff.
- **Estimate:** 8 hours

---

## 10. Observability & Audit

### P2 — No Audit Logging [MEDIUM]
- **Files:** `backend/app/api/v1/endpoints/admin.py`
- **Description:** Admin actions (ban user, update settings) log to `loguru` but there is no structured audit trail stored in the database. Logs are ephemeral and can be lost during container restarts.
- **Fix Specification:** Create an `AuditLog` model with fields: `user_id`, `action`, `target_type`, `target_id`, `ip_address`, `timestamp`, `metadata`. Store all admin actions persistently.
- **Estimate:** 12 hours

### P2 — No Security Monitoring / Alerting [MEDIUM]
- **Files:** None (missing entirely)
- **Description:** There is no monitoring for brute-force attacks, unusual API usage patterns, or security incidents. No integration with alerting systems (PagerDuty, Slack, email).
- **Fix Specification:** Implement security event detection (failed login spikes, unusual module execution patterns). Integrate with a monitoring stack (Prometheus + Grafana). Set up alerting rules.
- **Estimate:** 24 hours

---

## Summary of Findings

| Severity | Count | Key Issues |
|----------|-------|------------|
| **P0** | 2 | localStorage JWT, default JWT secret |
| **P1** | 10 | No tenant isolation, plaintext session strings, no TLS, missing security headers, zip-slip, exposed Swagger, no rate limiting on login, leaked error details, no CSRF, API key storage |
| **P2** | 14 | No token rotation, no password complexity, no file size limits, no audit logging, Redis auth missing, no request tracing, no flood wait handling |

## Remediation Priority

1. **Immediate (P0):** Fix JWT storage and secret management
2. **Sprint 1 (P1):** Tenant isolation, TLS, security headers, file upload validation, rate limiting on auth
3. **Sprint 2 (P1/P2):** Token rotation, CSRF, audit logging, Redis auth, CORS hardening
4. **Sprint 3 (P2):** Error handling, input sanitization, observability, Telegram-specific protections

## Final Verdict: **NOT READY FOR PRODUCTION**

The platform has a solid architectural foundation but requires significant security hardening before production deployment. The most critical gaps are JWT storage in localStorage, lack of tenant isolation, and missing TLS/security headers.
