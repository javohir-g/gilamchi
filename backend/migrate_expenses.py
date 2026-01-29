import os
from sqlalchemy import create_engine, text

# Use synchronous connection URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/gilamchi")
# Ensure the dialact is correct if it's passed with +asyncpg from env
if "+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("+asyncpg", "")

def migrate():
    engine = create_engine(DATABASE_URL)
    
    with engine.begin() as conn:
        print("Checking for 'category' column in 'expenses' table...")
        # Check if column exists
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='expenses' AND column_name='category'"
        ))
        
        if not result.fetchone():
            print("Adding 'category' column to 'expenses' table...")
            conn.execute(text("ALTER TABLE expenses ADD COLUMN category VARCHAR NOT NULL DEFAULT 'branch'"))
            print("Successfully added 'category' column.")
        else:
            print("'category' column already exists.")

    engine.dispose()

if __name__ == "__main__":
    migrate()
