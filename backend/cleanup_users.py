import asyncio
from app.db.session import async_session_factory
from sqlalchemy import update, delete
from app.models import User

async def run():
    async with async_session_factory() as db:
        # Just delete all test users so the test script can register them cleanly
        await db.execute(delete(User).where(User.email.in_([
            'admin@test.com', 'starter@test.com', 'pro@test.com', 'agency@test.com', 'viewer@test.com'
        ])))
        await db.commit()
        print('Deleted test users')

if __name__ == "__main__":
    asyncio.run(run())
