"""Quick DB user check."""
import asyncio
from sqlalchemy import text
from app.db.session import engine

async def main():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT email, role, is_active FROM users"))
        rows = result.fetchall()
        for r in rows:
            print(f"{r[0]} | role={r[1]} | active={r[2]}")
        print(f"TOTAL: {len(rows)}")

if __name__ == "__main__":
    asyncio.run(main())
