"""Endpoint-aware rate limiting middleware with per-path configuration."""

import time
from collections import defaultdict
from typing import Dict, Tuple

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Per-endpoint rate limit configuration: (max_requests, window_seconds)
ENDPOINT_LIMITS: Dict[str, Tuple[int, int]] = {
    "/api/v1/auth/login": (1000, 60),       # dev: generous to avoid blocking
    "/api/v1/auth/register": (100, 3600),    # dev: generous
}

# Default rate limit for all other endpoints: (max_requests, window_seconds)
DEFAULT_LIMIT = (10000, 60)  # dev: generous


def _get_endpoint_limits(path: str) -> Tuple[int, int]:
    """Return (max_requests, window_seconds) for the given request path."""
    for pattern, limits in ENDPOINT_LIMITS.items():
        if path.startswith(pattern):
            return limits
    return DEFAULT_LIMIT


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter with per-endpoint configuration.
    
    Replaces with Redis for production multi-instance deployments.
    """

    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Determine endpoint-specific limits
        ep_max, ep_window = _get_endpoint_limits(request.url.path)
        window_start = now - ep_window

        # Prune old entries for this IP
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if t > window_start
        ]

        if len(self.requests[client_ip]) >= ep_max:
            return Response(
                content='{"detail": "Rate limit exceeded"}',
                status_code=429,
                media_type="application/json",
            )

        self.requests[client_ip].append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(ep_max)
        response.headers["X-RateLimit-Remaining"] = str(
            max(0, ep_max - len(self.requests[client_ip]))
        )
        return response
