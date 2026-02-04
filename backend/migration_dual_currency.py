"""
Migration script for Dual Currency support.
Adds exchange_rate to sales, expenses, debts, and payments tables.
Adds is_usd to expenses table.
Creates settings table if not exists and seeds it.
"""

import os
import sys
import uuid
from sqlalchemy import create_engine, text, inspect

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    # For local development if not in docker
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/carpet_shop"
    print(f"Using default local URL: {DATABASE_URL}")

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

def table_exists(table_name: str) -> bool:
    """Check if a table exists."""
    return table_name in inspector.get_table_names()

def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def add_column_if_missing(table_name: str, column_name: str, column_def: str):
    """Add a column to a table if it doesn't exist."""
    if not table_exists(table_name):
        print(f"⚠ Table {table_name} does not exist, skipping")
        return False

    if column_exists(table_name, column_name):
        print(f"✓ Column {table_name}.{column_name} already exists, skipping")
        return False
    
    print(f"→ Adding column {table_name}.{column_name}...")
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}"))
    print(f"✓ Added column {table_name}.{column_name}")
    return True

def main():
    print("\n" + "="*60)
    print("DUAL CURRENCY MIGRATION SCRIPT")
    print("="*60 + "\n")
    
    changes_made = False
    
    # 1. Create settings table if missing
    if not table_exists("settings"):
        print("→ Creating 'settings' table...")
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE settings (
                    id UUID PRIMARY KEY,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    exchange_rate NUMERIC(15, 2) DEFAULT 12850.0
                )
            """))
            # Seed initial setting
            conn.execute(text("INSERT INTO settings (id, exchange_rate) VALUES (:id, :rate)"), 
                         {"id": str(uuid.uuid4()), "rate": 12850.0})
        print("✓ Created and seeded 'settings' table")
        changes_made = True
    else:
        print("✓ 'settings' table already exists")

    # 2. Add exchange_rate to sales
    if add_column_if_missing("sales", "exchange_rate", "NUMERIC(15, 2) DEFAULT 12850.0"):
        changes_made = True
        
    # 3. Add exchange_rate and is_usd to expenses
    if add_column_if_missing("expenses", "exchange_rate", "NUMERIC(15, 2) DEFAULT 12850.0"):
        changes_made = True
    if add_column_if_missing("expenses", "is_usd", "BOOLEAN DEFAULT FALSE"):
        changes_made = True

    # 4. Add exchange_rate to debts
    if add_column_if_missing("debts", "exchange_rate", "NUMERIC(15, 2) DEFAULT 12850.0"):
        changes_made = True

    # 5. Add exchange_rate to payments
    if add_column_if_missing("payments", "exchange_rate", "NUMERIC(15, 2) DEFAULT 12850.0"):
        changes_made = True
    
    print("\n" + "="*60)
    if changes_made:
        print("✓ Migration completed successfully!")
    else:
        print("✓ No changes needed.")
    print("="*60 + "\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ ERROR: Migration failed!")
        print(f"   {str(e)}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
