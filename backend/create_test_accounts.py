"""Create test admin and user accounts."""
import sys
sys.path.insert(0, "/app")

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models import User
from app.core.security import hash_password

async def create_test_accounts():
    """Create admin and user test accounts."""
    
    async with async_session_factory() as db:
        # Check if accounts already exist
        result = await db.execute(select(User).where(User.email.in_(["admin@test.com", "user@test.com"])))
        existing_users = result.scalars().all()
        
        if existing_users:
            print(f"Found {len(existing_users)} existing accounts")
            for user in existing_users:
                print(f"  - {user.email} ({user.role})")
        else:
            # Create admin account
            admin_user = User(
                email="admin@test.com",
                full_name="Admin User",
                role="admin",
                is_active=True,
            )
            await db.add(admin_user)
            
            # Create regular user account
            regular_user = User(
                email="user@test.com",
                full_name="Regular User",
                role="operator",
                is_active=True,
            )
            await db.add(regular_user)
            
            await db.commit()
            print("Created 2 test accounts:")
            print("  - admin@test.com (Admin)")
            print("  - user@test.com (Operator)")

if __name__ == "__main__":
    asyncio.run(create_test_accounts())
