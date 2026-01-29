import os
from sqlalchemy import create_engine, text

# Use synchronous connection URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/gilamchi")
if "+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("+asyncpg", "")

def migrate():
    engine = create_engine(DATABASE_URL)
    
    with engine.begin() as conn:
        print("Checking for 'staff' table...")
        # Create staff table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS staff (
                id UUID PRIMARY KEY,
                name VARCHAR NOT NULL,
                branch_id UUID NOT NULL REFERENCES branches(id),
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                deleted_at TIMESTAMP WITH TIME ZONE,
                deleted_by UUID,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print("Staff table checked/created.")

        print("Checking for 'staff_id' column in 'expenses' table...")
        # Check if column exists
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='expenses' AND column_name='staff_id'"
        ))
        
        if not result.fetchone():
            print("Adding 'staff_id' column to 'expenses' table...")
            conn.execute(text("ALTER TABLE expenses ADD COLUMN staff_id UUID REFERENCES staff(id)"))
            print("Successfully added 'staff_id' column.")
        else:
            print("'staff_id' column already exists.")

    engine.dispose()

if __name__ == "__main__":
    migrate()
