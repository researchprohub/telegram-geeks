"""CSRF Protection Middleware.

Generates CSRF tokens on GET requests and validates them on
POST/PUT/DELETE requests by comparing the cookie value with
the X-CSRF-Token header.

Skips validation for:
- API routes that use httpOnly + SameSite=Lax JWT cookies (already CSRF-safe)
- OPTIONS preflight requests
- WebSocket connections
"""

import secrets
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class CSRFMiddleware(BaseHTTPMiddleware):
    """CSRF token middleware for state-changing requests."""

    # Cookie name for CSRF token
    COOKIE_NAME = "csrf_token"
    # Header name expected by clients
    HEADER_NAME = "X-CSRF-Token"

    EXCLUDED_PREFIXES = (
        "/api/v1/",                  # All REST endpoints use JWT Bearer / SameSite=Lax cookie auth
        "/api/",                     # Rewritten API proxy paths
        "/api/v1/auth/",             # JWT cookie auth is CSRF-safe
        "/api/v1/admin/",            # Admin control panel endpoints
        "/api/v1/accounts/",         # Account management & TData upload
        "/api/v1/modules/",          # Module actions
        "/api/v1/orchestration/",    # Orchestration actions
        "/api/v1/personas/",         # Persona actions
        "/api/v1/licenses/",         # License generation and verification
        "/api/v1/payments/",         # Payment checks and orders
    )

    def _should_skip(self, request: Request) -> bool:
        """Determine if CSRF check should be skipped for this request."""
        from app.core.config import settings
        if getattr(settings, "environment", "") == "desktop":
            return True
        path = request.url.path
        if path.startswith("/api/v1/") or path.startswith("/api/"):
            return True
        for prefix in self.EXCLUDED_PREFIXES:
            if path.startswith(prefix):
                return True
        return False

    def _generate_token(self) -> str:
        return secrets.token_hex(32)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        method = request.method
        if method in ("GET", "HEAD", "OPTIONS"):
            response = await call_next(request)
            if self.COOKIE_NAME not in request.cookies:
                token = self._generate_token()
                response.set_cookie(
                    key=self.COOKIE_NAME,
                    value=token,
                    httponly=False,
                    samesite="lax",
                    max_age=86400,
                )
            return response

        if self._should_skip(request):
            return await call_next(request)

        # Bearer-token requests can't be forged cross-origin (the header isn't
        # auto-attached like cookies), so CSRF only protects cookie-authed calls.
        if request.headers.get("authorization", "").lower().startswith("bearer "):
            return await call_next(request)

        cookie_token = request.cookies.get(self.COOKIE_NAME)
        header_token = request.headers.get(self.HEADER_NAME)
        if not cookie_token or not header_token:
            return Response(content='{"detail":"CSRF token missing"}', status_code=403, media_type="application/json")
        if not secrets.compare_digest(cookie_token, header_token):
            return Response(content='{"detail":"CSRF token mismatch"}', status_code=403, media_type="application/json")

        response = await call_next(request)
        new_token = self._generate_token()
        response.set_cookie(key=self.COOKIE_NAME, value=new_token, httponly=False, samesite="lax", max_age=86400)
        return response


async def get_csrf_token(request: Request) -> dict:
    """Standalone endpoint handler to get a fresh CSRF token."""
    token = secrets.token_hex(32)
    return {"csrf_token": token}
