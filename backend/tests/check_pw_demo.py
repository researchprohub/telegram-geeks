import sys; sys.path.insert(0, '.')
from app.core.security import verify_password
import asyncio
from sqlalchemy import text
from app.db.session import engine


async def main():
    async with engine.connect() as conn:
        r = await conn.execute(text("SELECT email, hashed_password FROM users WHERE email='demo@test.com'"))
        row = r.fetchone()
        if row:
            pw = row[1]
            print("Matches Admin@123456:", verify_password("Admin@123456", pw))
        else:
            print("User not found")
    await engine.dispose()

asyncio.run(main())