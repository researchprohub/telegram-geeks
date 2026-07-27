"""Auth service."""

from app.core.security import hash_password, verify_password, create_access_token
from app.models import User, UserRole
from app.exceptions import AuthenticationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


class AuthService:
    """Business logic for authentication."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate(self, email: str, password: str) -> tuple[User, str]:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")
        token = create_access_token({"sub": str(user.id), "email": user.email})
        return user, token

    async def register_user(
        self, email: str, password: str, full_name: str | None = None, role: str = "operator"
    ) -> User:
        # Check if email exists
        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise AuthenticationError("Email already registered")

        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=UserRole(role),
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
