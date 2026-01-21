"""
Migration script to create expenses table
Run this once to add the expenses table to the database
"""
import os
import sys
from sqlalchemy import create_engine, text

# Add parent directory to path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings

settings = get_settings()
engine = create_engine(settings.DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        # Create expenses table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS expenses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                amount DOUBLE PRECISION NOT NULL,
                description VARCHAR NOT NULL,
                branch_id UUID NOT NULL REFERENCES branches(id),
                seller_id UUID NOT NULL REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Create index on branch_id for faster queries
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON expenses(branch_id);
        """))
        
        # Create index on created_at for faster date queries
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
        """))
        
        conn.commit()
        print("✅ Expenses table created successfully!")

if __name__ == "__main__":
    migrate()
