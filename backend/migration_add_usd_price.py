#!/usr/bin/env python3
"""
Migration script to add price_usd_per_sqm column to collections table.
Run this script independently after deployment.
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not found in environment")
        return
    
    engine = create_engine(database_url)
    
    with engine.begin() as conn:
        try:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='collections' AND column_name='price_usd_per_sqm'
            """))
            
            if result.fetchone():
                print("✓ Column price_usd_per_sqm already exists")
            else:
                print("Adding collections.price_usd_per_sqm...")
                conn.execute(text("ALTER TABLE collections ADD COLUMN price_usd_per_sqm DECIMAL(10, 2) DEFAULT NULL"))
                print("✓ Added collections.price_usd_per_sqm")
                
        except Exception as e:
            print(f"Error during migration: {e}")
            raise

if __name__ == "__main__":
    print("Running collection USD price migration...")
    run_migration()
    print("Migration completed successfully!")
