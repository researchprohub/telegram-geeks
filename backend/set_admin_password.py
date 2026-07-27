"""Set admin password and verify both accounts."""
import sys
sys.path.insert(0, "/app")

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models import User
from app.core.security import hash_password

async def set_admin_password():
    """Set admin password."""
    
    async with async_session_factory() as db:
        # Get admin account
        result = await db.execute(select(User).where(User.email == "admin@test.com"))
        admin_user = result.scalar_one_or_none()
        
        if admin_user:
            # Update password
            admin_user.hashed_password = hash_password("Test123456")
            await db.commit()
            print("✅ Admin password updated")
        else:
            print("❌ Admin account not found")
        
        # Verify both accounts
        print("\nTest Accounts:")
        print("=" * 50)
        print(f"Admin: admin@test.com")
        print(f"User: user@test.com")
        print("\nPassword for both: Test123456")
        print("=" * 50)

if __name__ == "__main__":
    asyncio.run(set_admin_password())
