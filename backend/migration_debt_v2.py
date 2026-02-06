"""
Migration script to add initial_payment field to the debts table.

Run this on the production server with:
docker compose -f docker-compose.prod.yml exec backend python migration_debt_v2.py
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def add_column_if_missing(table_name: str, column_name: str, column_def: str):
    """Add a column to a table if it doesn't exist."""
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
    print("DEBT MIGRATION V2 SCRIPT")
    print("="*60 + "\n")
    
    changes_made = False
    
    # Add initial_payment to debts
    if add_column_if_missing(
        "debts",
        "initial_payment",
        "NUMERIC(15, 2) DEFAULT 0"
    ):
        changes_made = True
    
    print("\n" + "="*60)
    if changes_made:
        print("✓ Migration completed successfully!")
    else:
        print("✓ No changes needed - column already exists.")
    print("="*60 + "\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ ERROR: Migration failed!")
        print(f"   {str(e)}\n")
        sys.exit(1)
