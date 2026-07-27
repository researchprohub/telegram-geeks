"""Request logging middleware."""

import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("request_logger")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all incoming requests with timing info."""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time

        logger.info(
            "%s %s | %d | %.3fs",
            request.method,
            request.url.path,
            response.status_code,
            process_time,
        )
        response.headers["X-Process-Time"] = str(process_time)
        return response
