"""FastAPI dependency injection helpers."""

from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User, UserRole
from app.exceptions import AuthenticationError, AuthorizationError

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract user from httpOnly cookie or Authorization header."""
    token = request.cookies.get("access_token")
    if token:
        payload = decode_access_token(token)
        if payload and payload.get("sub"):
            from sqlalchemy import select
            result = await db.execute(select(User).where(User.id == int(payload["sub"])))
            user = result.scalar_one_or_none()
            if user and user.is_active:
                return user
    if credentials:
        payload = decode_access_token(credentials.credentials)
        if payload and payload.get("sub"):
            from sqlalchemy import select
            result = await db.execute(select(User).where(User.id == int(payload["sub"])))
            user = result.scalar_one_or_none()
            if user and user.is_active:
                return user
    raise AuthenticationError("Authentication required")


async def get_current_user_from_cookie(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the current user from httpOnly cookie.

    Reads the 'access_token' cookie, decodes it, and returns the user.
    Falls back to Bearer token if cookie is absent.
    """
    # Try cookie first
    token = request.cookies.get("access_token")
    if token:
        payload = decode_access_token(token)
        if payload:
            user_id = payload.get("sub")
            if user_id:
                from sqlalchemy import select
                result = await db.execute(select(User).where(User.id == int(user_id)))
                user = result.scalar_one_or_none()
                if user and user.is_active:
                    return user

    # Fallback: try Authorization header
    cred_header = request.headers.get("authorization", "")
    if cred_header.startswith("Bearer "):
        token = cred_header[7:]
        payload = decode_access_token(token)
        if payload:
            user_id = payload.get("sub")
            if user_id:
                from sqlalchemy import select
                result = await db.execute(select(User).where(User.id == int(user_id)))
                user = result.scalar_one_or_none()
                if user and user.is_active:
                    return user

    raise AuthenticationError("Authentication required")


def require_role(*roles: UserRole):
    """Dependency factory that requires one of the given roles."""
    async def role_checker(current_user: User = Depends(get_current_user_from_cookie)):
        role_values = {r.value if hasattr(r, 'value') else str(r) for r in roles}
        if current_user.role not in role_values:
            raise AuthorizationError(f"Requires one of roles: {list(role_values)}")
        return current_user
    return role_checker


async def get_current_user_tenant(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Tenant-aware user dependency — reads from cookie or header."""
    return await get_current_user_from_cookie(request, db)
