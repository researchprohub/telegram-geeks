"""Check admin password hash."""
import asyncio
from sqlalchemy import text
from app.db.session import engine

async def main():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT email, hashed_password FROM users WHERE email = 'admin@telegramgeeks.com'"))
        row = result.fetchone()
        if row:
            print(f"Email: {row[0]}")
            print(f"Hash: {row[1][:60]}...")
        else:
            print("NOT FOUND")

asyncio.run(main())
