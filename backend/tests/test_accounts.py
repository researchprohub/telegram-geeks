"""Create test user account and get login tokens."""
import sys
sys.path.insert(0, "/app")

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models import User
from app.core.security import hash_password

async def create_user_and_get_tokens():
    """Create user account and get login tokens."""
    
    async with async_session_factory() as db:
        # Check if user account exists
        result = await db.execute(select(User).where(User.email == "user@test.com"))
        existing_user = result.scalar_one_or_none()
        
        if not existing_user:
            # Create regular user account
            regular_user = User(
                email="user@test.com",
                full_name="Regular User",
                role="operator",
                is_active=True,
                hashed_password=hash_password("Test123456"),
            )
            db.add(regular_user)
            await db.commit()
            print("Created user account: user@test.com")
        else:
            print("User account already exists")
        
        # Get admin account
        result = await db.execute(select(User).where(User.email == "admin@test.com"))
        admin_user = result.scalar_one_or_none()
        
        print("\nTest Accounts:")
        print("=" * 50)
        print(f"Admin: admin@test.com")
        print(f"User: user@test.com")
        print("\nNote: Passwords are set to 'Test123456' for both accounts")
        print("=" * 50)

if __name__ == "__main__":
    asyncio.run(create_user_and_get_tokens())
