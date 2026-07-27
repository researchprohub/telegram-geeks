"""Authentication endpoints — uses raw JSON body parsing for FastAPI 0.139 compatibility."""

from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, verify_password, decode_access_token, decode_refresh_token, hash_password
from app.core.redis_client import get_redis
from app.schemas import UserRegister, TokenResponse, UserOut, ChangePassword, UpdateProfile
from app.db.session import get_db
from app.models import User

router = APIRouter()
security = HTTPBearer(auto_error=False)


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str, request: Request):
    is_secure = request.url.scheme == "https"
    response.set_cookie(
        key="access_token", value=access_token, max_age=900,
        httponly=True, secure=is_secure, samesite="lax", path="/api/",
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token, max_age=604800,
        httponly=True, secure=is_secure, samesite="lax", path="/api/v1/auth/refresh",
    )


def _clear_auth_cookies(response: Response, request: Request):
    is_secure = request.url.scheme == "https"
    response.set_cookie(key="access_token", value="", max_age=0, httponly=True, secure=is_secure, samesite="lax", path="/api/")
    response.set_cookie(key="refresh_token", value="", max_age=0, httponly=True, secure=is_secure, samesite="lax", path="/api/v1/auth/refresh")


@router.post("/login", response_model=TokenResponse, tags=["Auth"])
async def login(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")

    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))

    if not email or not password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email and password are required")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token, jti = create_refresh_token({"sub": str(user.id), "role": user.role})
    r = await get_redis()
    if r:
        await r.setex(f"rt:{jti}", 604800, str(user.id))
    _set_auth_cookies(response, access_token, refresh_token, request=request)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token, expires_in=900)


@router.post("/register", tags=["Auth"])
async def register(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")

    from app.services.settings_service import SettingsService
    svc = SettingsService(db)
    reg_enabled = await svc.get("registration_enabled")
    if reg_enabled == "false":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Registration is disabled")

    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))
    full_name = body.get("full_name")

    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format")

    errors = []
    if len(password) < 12:
        errors.append("Password must be at least 12 characters")
    if not any(c.isupper() for c in password):
        errors.append("Password must contain an uppercase letter")
    if not any(c.islower() for c in password):
        errors.append("Password must contain a lowercase letter")
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain a digit")
    if not any(c in "!@#$%^&*()-_=+" for c in password):
        errors.append("Password must contain a special character")
    if errors:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="; ".join(errors))

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=email, hashed_password=hash_password(password), full_name=full_name,
        role="operator", is_active=True, created_at=datetime.utcnow(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token, jti = create_refresh_token({"sub": str(user.id), "role": user.role})
    r = await get_redis()
    if r:
        await r.setex(f"rt:{jti}", 604800, str(user.id))
    _set_auth_cookies(response, access_token, refresh_token, request=request)

    return UserOut(
        id=user.id, email=user.email, full_name=user.full_name,
        role=user.role, is_active=user.is_active, created_at=user.created_at,
    )


@router.post("/refresh", response_model=TokenResponse, tags=["Auth"])
async def refresh_token(request: Request, response: Response):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")

    refresh_tok = body.get("refresh_token") or body.get("token")
    if not refresh_tok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided")

    payload = decode_refresh_token(refresh_tok)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    jti = payload.get("jti")
    user_id = payload.get("sub")

    r = await get_redis()
    if r and jti:
        consumed = await r.getdel(f"rt:{jti}")
        if not consumed:
            # Token reuse detected — invalidate all refresh tokens for this user
            inv_key = f"rti:{user_id}"
            inv = int(await r.get(inv_key) or 0) + 1
            await r.setex(inv_key, 604800, inv)
            _clear_auth_cookies(response, request=request)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token reused — all sessions invalidated")

    role = payload.get("role", "operator")
    new_access = create_access_token({"sub": user_id, "role": role})
    new_refresh, new_jti = create_refresh_token({"sub": user_id, "role": role})
    if r and new_jti:
        await r.setex(f"rt:{new_jti}", 604800, user_id)
    _set_auth_cookies(response, new_access, new_refresh, request=request)

    return TokenResponse(access_token=new_access, refresh_token=new_refresh, expires_in=900)


@router.post("/logout", tags=["Auth"])
async def logout(request: Request, response: Response):
    tok = request.cookies.get("refresh_token")
    if tok:
        payload = decode_refresh_token(tok)
        if payload and payload.get("jti"):
            r = await get_redis()
            if r:
                await r.delete(f"rt:{payload['jti']}")
    _clear_auth_cookies(response, request=request)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut, tags=["Auth"])
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    """Get current user from cookie or Bearer token."""
    user = await _get_authenticated_user(request, db)
    return UserOut(
        id=user.id, email=user.email, full_name=user.full_name,
        role=user.role, is_active=user.is_active, created_at=user.created_at,
    )


@router.put("/change-password", tags=["Auth"])
async def change_password(
    body: ChangePassword,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    user = await _get_authenticated_user(request, db)
    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    user.hashed_password = hash_password(body.new_password)
    await db.commit()
    r = await get_redis()
    if r:
        inv_key = f"rti:{user.id}"
        inv = int(await r.get(inv_key) or 0) + 1
        await r.setex(inv_key, 604800, inv)
    return {"message": "Password changed"}


@router.put("/update-profile", response_model=UserOut, tags=["Auth"])
async def update_profile(
    body: UpdateProfile,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    user = await _get_authenticated_user(request, db)
    if body.full_name is not None:
        user.full_name = body.full_name
    await db.commit()
    return UserOut(
        id=user.id, email=user.email, full_name=user.full_name,
        role=user.role, is_active=user.is_active, created_at=user.created_at,
    )


async def _get_authenticated_user(request: Request, db: AsyncSession) -> User:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is disabled")
    return user
