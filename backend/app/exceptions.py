"""Custom exceptions and global exception handlers."""

import logging
import traceback
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.core.config import settings

logger = logging.getLogger(__name__)


# ─── Custom Exceptions ──────────────────────────────────────────

class PlatformError(Exception):
    """Base exception for all platform errors."""
    def __init__(self, message: str, code: str = "platform_error", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class AuthenticationError(PlatformError):
    """Raised when authentication fails."""
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, code="authentication_error", status_code=401)


class AuthorizationError(PlatformError):
    """Raised when authorization fails (insufficient permissions)."""
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, code="authorization_error", status_code=403)


class NotFoundError(PlatformError):
    """Raised when a resource is not found."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, code="not_found", status_code=404)


class ConflictError(PlatformError):
    """Raised when a resource conflict occurs."""
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, code="conflict", status_code=409)


# ─── Exception Handlers ─────────────────────────────────────────

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all exception handler that sanitizes error responses."""
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {exc}",
        exc_info=True,
    )

    if isinstance(exc, PlatformError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "code": exc.code},
        )

    if settings.environment == "production":
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()},
    )


async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle Pydantic validation errors."""
    logger.warning(f"Validation error on {request.method} {request.url.path}: {exc}")
    logger.warning(traceback.format_exc())
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)},
    )
