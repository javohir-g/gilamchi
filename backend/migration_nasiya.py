"""
Migration script to add Nasiya (installment) fields to the database.

This script adds:
1. price_nasiya_per_sqm column to collections table
2. order_id column to debts table  
3. is_nasiya column to sales table

Run this on the production server with:
docker compose -f docker-compose.prod.yml exec backend python migration_nasiya.py
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
    print("NASIYA MIGRATION SCRIPT")
    print("="*60 + "\n")
    
    changes_made = False
    
    # 1. Add price_nasiya_per_sqm to collections
    if add_column_if_missing(
        "collections",
        "price_nasiya_per_sqm",
        "NUMERIC(10, 2)"
    ):
        changes_made = True
    
    if add_column_if_missing(
        "debts",
        "order_id",
        "VARCHAR"
    ):
        changes_made = True
        # Add index for performance
        print("→ Adding index on debts.order_id...")
        with engine.begin() as conn:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_debts_order_id ON debts(order_id)"))
        print("✓ Added index on debts.order_id")
    
    # 2.1 Add initial_payment to debts
    if add_column_if_missing(
        "debts",
        "initial_payment",
        "NUMERIC(15, 2) DEFAULT 0"
    ):
        changes_made = True
    
    # 3. Add is_nasiya to sales
    if add_column_if_missing(
        "sales",
        "is_nasiya",
        "BOOLEAN DEFAULT FALSE"
    ):
        changes_made = True
    
    print("\n" + "="*60)
    if changes_made:
        print("✓ Migration completed successfully!")
        print("  New columns have been added to the database.")
    else:
        print("✓ No changes needed - all columns already exist.")
    print("="*60 + "\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ ERROR: Migration failed!")
        print(f"   {str(e)}\n")
        sys.exit(1)
