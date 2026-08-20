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

    # Routes that skip CSRF validation (JWT cookie auth is already CSRF-safe)
    EXCLUDED_PREFIXES = (
        "/api/v1/auth/",             # JWT cookie auth is CSRF-safe
        "/api/v1/accounts/upload/",  # TData upload uses JWT cookie auth
        "/api/v1/accounts/login/",   # interactive login (QR / phone) uses JWT bearer auth
        "/api/v1/modules/",          # Module actions use JWT cookie auth
        "/api/v1/orchestration/",    # Orchestration uses JWT cookie auth
        "/api/v1/personas/",         # Persona image uploads use JWT cookie auth
    )

    def _should_skip(self, request: Request) -> bool:
        """Determine if CSRF check should be skipped for this request."""
        path = request.url.path
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
