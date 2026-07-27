"""Reset admin password and run full test."""
import asyncio
from sqlalchemy import text
from app.db.session import engine
from app.core.security import hash_password

async def main():
    pw = hash_password("Admin@123456")
    async with engine.begin() as conn:
        await conn.execute(
            text("UPDATE users SET hashed_password = :pw WHERE email = 'admin@telegramgeeks.com'"),
            {"pw": pw}
        )
        await conn.commit()
        print("Password reset OK")

asyncio.run(main())
