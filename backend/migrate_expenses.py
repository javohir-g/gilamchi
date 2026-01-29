import asyncio
import os
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@db:5432/gilamchi")

async def migrate():
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Checking for 'category' column in 'expenses' table...")
        # Check if column exists
        result = await conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='expenses' AND column_name='category'"
        ))
        
        if not result.fetchone():
            print("Adding 'category' column to 'expenses' table...")
            await conn.execute(text("ALTER TABLE expenses ADD COLUMN category VARCHAR NOT NULL DEFAULT 'branch'"))
            print("Successfully added 'category' column.")
        else:
            print("'category' column already exists.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
